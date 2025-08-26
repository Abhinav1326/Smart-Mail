import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function getKey(): Buffer {
  const raw = process.env.MAIL_PASS_ENC_KEY || process.env.MAIL_PASSWORD_KEY || "";
  if (!raw) {
    throw new Error("Encryption key is not set (MAIL_PASS_ENC_KEY)");
  }
  // Accept 32-byte key in base64 or hex
  let key: Buffer;
  const isHex = /^[0-9a-fA-F]+$/.test(raw);
  try {
    key = isHex ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  } catch {
    throw new Error("Invalid encryption key encoding; expected base64 or hex");
  }
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (AES-256)");
  }
  return key;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const password: string | undefined = body?.password;
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json({ error: "Missing 'password'" }, { status: 400 });
    }

    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Return hex by default (stable for Firestore string storage)
    return NextResponse.json({
      encrypted: enc.toString("hex"),
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      alg: "AES-256-GCM",
      keyVersion: 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Encryption failed" }, { status: 500 });
  }
}
