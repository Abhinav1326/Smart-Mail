import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
  const { jobDescription, applicant, resumeText } = await req.json();
    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });
    }

    const model = getGeminiModel();
  const prompt = `You are an assistant that reads a job description and the applicant's resume text and drafts a very short, professional application email in HTML.

Return STRICT JSON only with keys: recruiterEmail, recruiterName, companyName, jobRole, jobLocation, subject, body.
- recruiterEmail: If an explicit recruiter/contact email is present in the job description, return it; otherwise null.
- recruiterName: The recruiter's or contact person's name if present; else null.
- companyName: The company name inferred from the job description; if not clearly present, return null.
- jobRole: The role/title being hired for; if not clearly present, return null.
- jobLocation: The location of the job if mentioned (city, region, or remote/hybrid); else null.
- subject: A concise subject line suitable for applying to this role.
- body: A short, courteous HTML email body following this structure and constraints:
  Hello,\n\n
  I am writing to apply for the <ROLE> role at <COMPANY>. <1-2 lines on fit/skills>.\n\n
  I have attached my resume for your review.\n\n
  Best regards,\n
  <APPLICANT NAME>\n
  <APPLICANT PHONE> | <APPLICANT EMAIL>\n
  <APPLICANT LINKS (GitHub, LinkedIn, Portfolio) if provided>

Output the email body as minimal semantic HTML: wrap paragraphs in <p>, use <br/> only if needed, and for links output anchors where the visible text is exactly "GitHub", "LinkedIn", and "Portfolio" (only include ones available) and the href points to the provided URLs. No CSS styles. No markdown. No code fences.

Use the provided applicant object and resume text to populate the name, email, phone, and to reference 1-2 relevant skills/achievements aligned with the JD. Only include fields that exist. Keep it very concise (about 4-6 short lines total). Avoid bullet lists.

Job description:
"""
${jobDescription}
"""

${applicant ? `Applicant object (JSON): ${JSON.stringify(applicant)}` : "No applicant object provided"}

Resume text (may be empty if not provided):
"""
${resumeText || ""}
"""
`;

    // Debug: log the prompt sent to Gemini (truncated for safety)
    try {
      if (process.env.DEBUG_GEMINI_PROMPT === "1" || process.env.NODE_ENV !== "production") {
        const max = 5000;
        const out = prompt.length > max ? prompt.slice(0, max) + "\n...[truncated]" : prompt;
        // console.log("[/api/analyze] Gemini prompt:\n", out);
      }
    } catch {}

    const resp = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = resp.response.text().trim();

    // Try to parse strict JSON; if the model added code fences, strip them.
    const jsonText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let data: any;
    try {
      data = JSON.parse(jsonText);
    } catch {
      // Fallback: attempt to extract JSON object
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Model did not return JSON");
      data = JSON.parse(match[0]);
    }

    const result = {
      recruiterEmail: data.recruiterEmail ?? null,
      recruiterName: data.recruiterName ?? null,
      companyName: data.companyName ?? null,
      jobRole: data.jobRole ?? null,
      jobLocation: data.jobLocation ?? null,
      subject: String(data.subject || "Application for the role"),
      body: String(data.body || ""),
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to analyze" }, { status: 500 });
  }
}
