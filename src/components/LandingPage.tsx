"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import ForkContent from "@/components/fork/ForkContent";
import BigStats from "@/components/shared/BigStats";
import FounderStory from "@/components/FounderStory";
import FAQ from "@/components/FAQ";
import GradientBackground from "@/components/shared/GradientBackground";
import TryIt from "@/components/TryIt";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { ForkProvider } from "@/components/fork/ForkContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LandingPage() {
  // Warm up the backend on landing page load so it's ready by dashboard
  useEffect(() => {
    fetch(`${API_URL}/ping`, { mode: "cors" }).catch(() => {});
  }, []);
  return (
    <ForkProvider>
      <GradientBackground />
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <ForkContent />
        <TryIt />
        <BigStats />
        <FounderStory />
        <FAQ />
        <Waitlist />
      </main>
      <Footer />
    </ForkProvider>
  );
}
