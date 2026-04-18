import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Builder — SViam",
  description:
    "Build an ATS-optimized resume in minutes. Free for Indian job seekers.",
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
