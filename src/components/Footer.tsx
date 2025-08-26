"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center py-6 bg-gray-100 text-gray-600 text-sm">
      <div className="flex justify-center gap-6 mb-2">
        <Link href="/about" className="hover:text-blue-600">About</Link>
        <Link href="/contact" className="hover:text-blue-600">Contact</Link>
        <a
          href="https://github.com/your-repo"
          target="_blank"
          className="hover:text-blue-600"
        >
          GitHub
        </a>
      </div>
      <p>© 2025 Smart Mails. All rights reserved.</p>
    </footer>
  );
}
