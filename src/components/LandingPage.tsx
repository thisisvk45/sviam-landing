"use client";

import { useEffect, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import GradientBackground from "@/components/shared/GradientBackground";
import JobTicker from "@/components/JobTicker";
import { ForkProvider } from "@/components/fork/ForkContext";

// Lazy-load below-fold components to reduce initial JS parse
const ForkContent = lazy(() => import("@/components/fork/ForkContent"));
const TryIt = lazy(() => import("@/components/TryIt"));
const BigStats = lazy(() => import("@/components/shared/BigStats"));
const FounderStory = lazy(() => import("@/components/FounderStory"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Waitlist = lazy(() => import("@/components/Waitlist"));
const Footer = lazy(() => import("@/components/Footer"));

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LandingPage() {
  // Warm up the backend + prefetch trending jobs so dashboard loads instantly
  useEffect(() => {
    fetch(`${API_URL}/ping`, { mode: "cors" }).catch(() => {});
    fetch(`${API_URL}/jobs/trending`, { mode: "cors" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.results) {
          try { sessionStorage.setItem("sviam_trending", JSON.stringify(data.results)); } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);
  return (
    <ForkProvider>
      <GradientBackground />
      <Navbar />
      <main>
        <Hero />
        <JobTicker />
        <TrustedBy />
        <Suspense>
          <ForkContent />
          <TryIt />
          <BigStats />
          <FounderStory />
          <FAQ />
          <Waitlist />
        </Suspense>
      </main>
      <Suspense>
        <Footer />
      </Suspense>
    </ForkProvider>
  );
}
