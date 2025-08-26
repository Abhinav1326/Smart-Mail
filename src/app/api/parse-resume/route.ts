import { NextResponse } from "next/server";
import * as pdfjs from "pdfjs-dist";
// Use the Node build of PDF.js
// @ts-expect-error - the type package doesn't expose the exact path
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs";
// Configure the worker (not actually used in node, but PDF.js expects a value)
(pdfjs as any).GlobalWorkerOptions = (pdfjs as any).GlobalWorkerOptions || {};
(pdfjs as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let source: "json-base64" | "data-url" | "binary" | "multipart" | "unknown" = "unknown";

    if (contentType.includes("application/pdf")) {
      // Raw PDF body
      const ab = await req.arrayBuffer();
      buffer = Buffer.from(ab);
      source = "binary";
    } else if (contentType.startsWith("multipart/form-data")) {
      // Multipart upload: expect field name 'file'
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Expected 'file' field with a PDF" }, { status: 400 });
      }
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
      source = "multipart";
    } else {
      // Assume JSON body
      const body = await req.json().catch(() => ({}));
      let base64: string | undefined = body?.base64;
      const dataUrl: string | undefined = body?.dataUrl;
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:application/pdf;base64,")) {
        base64 = dataUrl.split(",")[1];
        source = "data-url";
      }
      if (typeof base64 === "string" && base64.length > 0) {
        buffer = Buffer.from(base64, "base64");
        if (source === "unknown") source = "json-base64";
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: "No PDF provided. Send base64 in JSON, a data URL, multipart 'file', or raw application/pdf body." },
        { status: 400 }
      );
    }

    // Optional size guard (20MB)
    const MAX = 20 * 1024 * 1024;
    if (buffer.byteLength > MAX) {
      return NextResponse.json({ error: "PDF too large (max 20MB)" }, { status: 413 });
    }

    // Load PDF with pdfjs and extract text
    const uint8 = new Uint8Array(buffer);
    const pdf = await (pdfjs as any).getDocument({ data: uint8 }).promise;
    let text = "";
    const pages = pdf.numPages;
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .filter(Boolean);
      text += strings.join(" ") + "\n";
    }
    text = text.trim();

    try {
      const info = { source, bytes: buffer.byteLength, pages, textLength: text.length };
      if (process.env.NODE_ENV !== "production") {
        console.log("[/api/parse-resume] parsed:", info);
      }
    } catch {}

    return NextResponse.json({ text, meta: { source, pages, textLength: text.length } });
  } catch (err: any) {
    try {
      console.error("[/api/parse-resume] error:", err);
    } catch {}
    return NextResponse.json({ error: err?.message || "Failed to parse resume" }, { status: 500 });
  }
}
