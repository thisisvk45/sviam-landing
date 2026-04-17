"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import ForkContent from "@/components/fork/ForkContent";
import BigStats from "@/components/shared/BigStats";
import FounderStory from "@/components/FounderStory";
import FAQ from "@/components/FAQ";
import GradientBackground from "@/components/shared/GradientBackground";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { ForkProvider } from "@/components/fork/ForkContext";

export default function Home() {
  return (
    <ForkProvider>
      <GradientBackground />
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <ForkContent />
        <BigStats />
        <FounderStory />
        <FAQ />
        <Waitlist />
      </main>
      <Footer />
    </ForkProvider>
  );
}
