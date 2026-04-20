"use client";

import { IconUsers, IconExternalLink } from "@tabler/icons-react";
import ReferralTemplate from "./ReferralTemplate";

type Props = {
  companyName: string;
  companyDomain?: string;
  jobTitle: string;
};

export default function InsiderConnections({ companyName, companyDomain, jobTitle }: Props) {
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&network=%5B%22S%22%5D`;
  const alumniUrl = `https://www.linkedin.com/company/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, "-"))}/people/`;

  return (
    <div className="p-4 rounded-[14px]"
      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.03))", border: "1px solid rgba(99,102,241,0.12)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.1)", color: "var(--teal)" }}>
          <IconUsers size={14} />
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            Know someone at {companyName}?
          </p>
          <p className="text-[0.6rem] text-[var(--muted)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            Referrals increase your chances by 4-10x
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={alumniUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[0.65rem] font-medium transition-colors hover:text-[var(--teal)]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
          Browse {companyName} employees <IconExternalLink size={10} />
        </a>
        <a href={linkedinSearchUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[0.65rem] font-medium transition-colors hover:text-[var(--teal)]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
          Find mutual connections <IconExternalLink size={10} />
        </a>
      </div>
      <p className="text-[0.55rem] text-[var(--muted)] mt-2" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
        Tip: Filter by your college or past companies to find warm introductions
      </p>
      <div className="mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <ReferralTemplate jobTitle={jobTitle} companyName={companyName} />
      </div>
    </div>
  );
}
