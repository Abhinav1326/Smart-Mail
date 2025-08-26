import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  // Save refresh_token somewhere (DB, secure store)
  // Note: Google only returns refresh_token the first consent or when prompt=consent is used and access_type=offline.
  const hasRefresh = Boolean(tokens.refresh_token);
  return NextResponse.json({
    tokens,
    hasRefreshToken: hasRefresh,
    note: hasRefresh
      ? undefined
      : "No refresh_token returned. Ensure access_type=offline and prompt=consent; remove prior consent in Google Account > Security > Third-party access and try again.",
  });
}
