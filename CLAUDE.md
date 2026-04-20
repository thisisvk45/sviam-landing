@AGENTS.md

# SViam Frontend

Live: sviam.in
Backend API: https://sviam-backend.onrender.com
Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12

Key files:
- src/app/dashboard/DashboardClient.tsx — main dashboard
- src/components/JobCard.tsx — job match cards
- src/lib/api.ts — all API calls to backend
- src/app/resume-builder/ResumeBuilderClient.tsx — resume builder
- src/app/profile/ProfileClient.tsx — user profile

Always run npm run build after changes. Zero TypeScript errors required.
Never use any as a TypeScript type.
