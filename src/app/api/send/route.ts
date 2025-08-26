import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
  const { to, subject, body, html, attachments } = await req.json();

  if (!to || !subject || (!body && !html)) {
      return new Response(
    JSON.stringify({ error: "Missing required fields: to, subject, and either body or html" }),
        { status: 400 }
      );
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      return new Response(
        JSON.stringify({ error: "Server email not configured" }),
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

  const mail: nodemailer.SendMailOptions = {
      from: user,
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
