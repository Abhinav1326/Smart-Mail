import { NextResponse } from "next/server";

export const runtime = "nodejs";

const removed = NextResponse.json(
  { error: "This endpoint has been removed." },
  { status: 410 }
);

export async function GET() { return removed; }
export async function POST() { return removed; }
export async function PUT() { return removed; }
export async function PATCH() { return removed; }
export async function DELETE() { return removed; }
export async function OPTIONS() { return removed; }
export async function HEAD() { return removed; }
