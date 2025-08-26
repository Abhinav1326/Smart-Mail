"use client";

type FeatureItem = {
  text: string;
};

type FeaturesProps = {
  items?: FeatureItem[];
};

const defaultItems: FeatureItem[] = [
  { text: "Secure Login (Firebase Auth)" },
  { text: "Personalized Applications (Gemini AI)" },
  { text: "One-Click Email Sending (Nodemailer + Gmail)" },
  { text: "Track Sent Applications" },
];

export default function Features({ items = defaultItems }: FeaturesProps) {
  return (
    <section className="relative z-10 bg-gray-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="min-h-[calc(100vh-4rem)] flex items-center">
          <div className="w-full">
            <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-gray-900 mb-10">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map((f, i) => (
                <FeatureCard key={i} delayMs={i * 100} text={f.text} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Reveal from "@/components/Reveal";

function FeatureCard({ text, delayMs = 0 }: { text: string; delayMs?: number }) {
  return (
    <Reveal delayMs={delayMs}>
      <div className="rounded-2xl bg-gray-100 p-5 shadow-[10px_10px_20px_#c9cdd3,-10px_-10px_20px_#ffffff]">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-green-600 bg-gray-100 shadow-[inset_4px_4px_8px_#c9cdd3,inset_-4px_-4px_8px_#ffffff]">✓</span>
          <p className="text-gray-700 text-base sm:text-lg">{text}</p>
        </div>
      </div>
    </Reveal>
  );
}
