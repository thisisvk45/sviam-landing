"use client";

import { useState } from "react";
import { IconCopy, IconCheck, IconMail } from "@tabler/icons-react";

type Props = {
  jobTitle: string;
  companyName: string;
};

export default function ReferralTemplate({ jobTitle, companyName }: Props) {
  const [copied, setCopied] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const template = `Hi [Name],

I hope you're doing well! I noticed you work at ${companyName} and wanted to reach out.

I recently came across the ${jobTitle} role at ${companyName} and I'm very interested. My background in [your key skills] aligns well with the requirements.

Would you be open to a quick chat about the role and the team? I'd also really appreciate it if you could refer me internally — I understand many companies prioritize employee referrals.

Happy to share my resume if that helps. Thanks so much for your time!

Best,
[Your Name]`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showTemplate) {
    return (
      <button onClick={() => setShowTemplate(true)}
        className="inline-flex items-center gap-1 text-[0.65rem] font-medium transition-colors hover:text-[var(--teal)]"
        style={{ color: "var(--muted2)", fontFamily: "var(--font-dm-sans)" }}>
        <IconMail size={11} /> Generate referral email template
      </button>
    );
  }

  return (
    <div className="p-3 rounded-[10px] mt-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.6rem] font-medium text-[var(--text)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Referral Request Template
        </span>
        <button onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[0.6rem] transition-colors"
          style={{ color: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}>
          {copied ? <><IconCheck size={10} /> Copied</> : <><IconCopy size={10} /> Copy</>}
        </button>
      </div>
      <pre className="text-[0.6rem] text-[var(--muted2)] whitespace-pre-wrap leading-relaxed"
        style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
        {template}
      </pre>
    </div>
  );
}
