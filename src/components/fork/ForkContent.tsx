"use client";

import { useFork } from "./ForkContext";
import ForkSelector from "./ForkSelector";
import PathToggle from "./PathToggle";
import SeekerMatchInterview from "../seeker/SeekerMatchInterview";
import SeekerHowItWorks from "../seeker/SeekerHowItWorks";
import HirerPipeline from "../hirer/HirerPipeline";
import HirerInterviewConfig from "../hirer/HirerInterviewConfig";
import HirerResults from "../hirer/HirerResults";

function SeekerSections() {
  return (
    <div style={{ animation: "fadeInLeft 0.6s cubic-bezier(0.33,1,0.68,1) forwards" }}>
      <SeekerMatchInterview />
      <div className="section-divider" />
      <SeekerHowItWorks />
    </div>
  );
}

function HirerSections() {
  return (
    <div style={{ animation: "fadeInRight 0.6s cubic-bezier(0.33,1,0.68,1) forwards" }}>
      <HirerPipeline />
      <div className="section-divider" />
      <HirerInterviewConfig />
      <div className="section-divider" />
      <HirerResults />
    </div>
  );
}

export default function ForkContent() {
  const { path } = useFork();

  return (
    <div id="fork">
      {path && <PathToggle />}
      {path === null && <ForkSelector />}
      {path === "seeker" && <SeekerSections />}
      {path === "hirer" && <HirerSections />}
    </div>
  );
}
