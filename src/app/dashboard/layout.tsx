import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SViam",
  description: "View your AI-powered job matches, upload your resume, and manage your profile on SViam.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
