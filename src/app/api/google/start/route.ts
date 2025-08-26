import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

export const runtime = "nodejs";

export async function GET() {
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    access_type: "offline",
    prompt: "consent",
  });
  return NextResponse.redirect(url);
}
