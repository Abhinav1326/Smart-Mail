import nodemailer from "nodemailer";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
  const { to, subject, body, html, attachments, fromEmail, mailPassword } = await req.json();

  if (!to || !subject || (!body && !html)) {
      return new Response(
    JSON.stringify({ error: "Missing required fields: to, subject, and either body or html" }),
        { status: 400 }
      );
    }

    // Require per-user credentials: decrypt provided encrypted app password
    if (!fromEmail || !mailPassword?.cipher || !mailPassword?.iv || !mailPassword?.tag) {
      return new Response(
        JSON.stringify({ error: "Missing sender credentials. Please save your contact email and app password first." }),
        { status: 400 }
      );
    }

    const keyRaw = process.env.MAIL_PASS_ENC_KEY || process.env.MAIL_PASSWORD_KEY;
    if (!keyRaw) {
      return new Response(
        JSON.stringify({ error: "Encryption key missing on server (MAIL_PASS_ENC_KEY)" }),
        { status: 500 }
      );
    }
    const isHex = /^[0-9a-fA-F]+$/.test(keyRaw);
    const key = Buffer.from(keyRaw, isHex ? "hex" : "base64");
    if (key.length !== 32) {
      return new Response(
        JSON.stringify({ error: "Invalid MAIL_PASS_ENC_KEY (must be 32 bytes)" }),
        { status: 500 }
      );
    }
    let authUser: string;
    let authPass: string;
    try {
      const iv = Buffer.from(mailPassword.iv, "hex");
      const tag = Buffer.from(mailPassword.tag, "hex");
      const cipherBuf = Buffer.from(mailPassword.cipher, "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
      authUser = String(fromEmail);
      authPass = dec.toString("utf8");
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to decrypt provided mail password" }),
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: authUser, pass: authPass },
    });

  const mail: nodemailer.SendMailOptions = {
      from: authUser,
      to,
      subject,
      text: body || undefined,
      html: html || undefined,
    };

    if (Array.isArray(attachments) && attachments.length) {
      mail.attachments = attachments.map((a: any) => ({
        filename: a.filename,
        content: a.content,
        encoding: a.encoding || "base64",
        contentType: a.contentType,
      }));
    }

    await transporter.sendMail(mail);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("/api/send error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
