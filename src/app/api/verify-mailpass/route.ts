import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string = (body?.email || "").trim();
    let password: string = (body?.password || "").toString();

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Missing email" }), { status: 400 });
    }
    // Remove spaces users might paste with
    password = password.replace(/\s+/g, "");
    if (!password) {
      return new Response(JSON.stringify({ ok: false, error: "Missing password" }), { status: 400 });
    }

    if (!/^[A-Za-z0-9]{16}$/.test(password)) {
      return new Response(
        JSON.stringify({ ok: false, error: "App Password should be 16 letters/numbers (paste without spaces)" }),
        { status: 200 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: email, pass: password },
    });

    await transporter.verify();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    const message = err?.message || "Verification failed";
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 200 });
  }
}
