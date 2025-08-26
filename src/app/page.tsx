"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Floating Gradient Blobs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 8 }}
  className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gradient-to-r from-blue-400 to-yellow-300 opacity-30 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 40, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
  className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 opacity-30 blur-3xl"
      />

  {/* Navbar */}
  <Navbar />

  {/* Hero Section */}
  <Hero ctaHref={user ? "/apply" : "/signin"} />

  {/* Features Section */}
  <Features />

      {/* Call to Action */}
      <section className="text-center py-20 relative z-10">
        <h3 className="text-3xl font-semibold text-gray-900 mb-6">
          Ready to land your next job?
        </h3>
        <Link
          href={user ? "/apply" : "/signin"}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-medium hover:opacity-90 transition shadow-xl"
        >
          Login & Start Applying
        </Link>
      </section>

  <Footer />
    </div>
  );
}

