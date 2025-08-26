import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { refresh_token: rt } = await req.json();
    const refresh_token = typeof rt === "string" ? rt.trim() : rt;

    const missing = [
      ["GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID],
      ["GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET],
      ["GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI],
    ].filter(([, v]) => !v);

    if (missing.length) {
      return NextResponse.json(
        { error: "Missing env", missing: missing.map(([k]) => k) },
        { status: 500 }
      );
    }

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Missing refresh_token" },
        { status: 400 }
      );
    }

    const client = getOAuthClient();
    client.setCredentials({ refresh_token });
    try {
      const at = await client.getAccessToken();
      // access token may be an object or string depending on googleapis version
      return NextResponse.json({ ok: true, accessToken: String(at?.token || at || "") });
    } catch (e: any) {
      return NextResponse.json(
        {
          error: "invalid_refresh",
          reason: e?.response?.data?.error || e?.code || "invalid_grant",
          description: e?.response?.data?.error_description || e?.message,
        },
        { status: 401 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "debug_failed", message: e?.message },
      { status: 500 }
    );
  }
}
