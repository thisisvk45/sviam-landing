"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ForkContent from "@/components/fork/ForkContent";
import BigStats from "@/components/shared/BigStats";
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
        <ForkContent />
        <BigStats />
        <Waitlist />
      </main>
      <Footer />
    </ForkProvider>
  );
}
