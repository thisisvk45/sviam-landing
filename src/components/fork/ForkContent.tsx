"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useFork } from "./ForkContext";
import ForkSelector from "./ForkSelector";
import PathToggle from "./PathToggle";
import SeekerMatchInterview from "../seeker/SeekerMatchInterview";
import SeekerVisaPrep from "../seeker/SeekerVisaPrep";
import SeekerHowItWorks from "../seeker/SeekerHowItWorks";
import HirerPipeline from "../hirer/HirerPipeline";
import HirerInterviewConfig from "../hirer/HirerInterviewConfig";
import HirerResults from "../hirer/HirerResults";

const sectionVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 60,
    scale: 0.97,
    filter: "blur(8px)",
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1] as const,
      staggerChildren: 0.1,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -40,
    scale: 0.97,
    filter: "blur(6px)",
    transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const },
  }),
};

const selectorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: { duration: 0.3 },
  },
};

function SeekerSections() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      custom={-1}
      variants={reducedMotion ? undefined : sectionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <SeekerMatchInterview />
      <div className="section-divider" />
      <SeekerVisaPrep />
      <div className="section-divider" />
      <SeekerHowItWorks />
    </motion.div>
  );
}

function HirerSections() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      custom={1}
      variants={reducedMotion ? undefined : sectionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <HirerPipeline />
      <div className="section-divider" />
      <HirerInterviewConfig />
      <div className="section-divider" />
      <HirerResults />
    </motion.div>
  );
}

export default function ForkContent() {
  const { path } = useFork();

  return (
    <div id="fork">
      {path && <PathToggle />}
      <AnimatePresence mode="wait" custom={path === "seeker" ? -1 : 1}>
        {path === null && (
          <motion.div
            key="selector"
            variants={selectorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ForkSelector />
          </motion.div>
        )}
        {path === "seeker" && <SeekerSections key="seeker" />}
        {path === "hirer" && <HirerSections key="hirer" />}
      </AnimatePresence>
    </div>
  );
}
