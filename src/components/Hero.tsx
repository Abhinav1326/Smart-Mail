"use client";
import Link from "next/link";

type HeroProps = {
  ctaHref: string;
};

export default function Hero({ ctaHref }: HeroProps) {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-20 relative z-10">
      <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-3xl leading-tight">
        Apply to Jobs Smarter <br />
        <span className="text-blue-600">Let AI draft and send your applications</span>
      </h2>
      <p className="mt-6 text-lg text-gray-600 max-w-2xl">
        Paste any job description and our app extracts recruiter info, generates a tailored email, and sends it in one click.
      </p>
      <Link
        href={ctaHref}
        className="mt-8 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition shadow-lg"
      >
        Get Started
      </Link>
    </section>
  );
}
