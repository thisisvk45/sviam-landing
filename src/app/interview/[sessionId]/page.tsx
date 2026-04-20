import InterviewRoom from "./InterviewRoom";

export const metadata = {
  title: "AI Interview | SViam",
  description: "AI-powered technical interview platform",
};

type Props = { params: Promise<{ sessionId: string }> };

export default async function InterviewPage({ params }: Props) {
  const { sessionId } = await params;

  // Validate session server-side
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  let sessionData = null;
  let error = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/interviews/sessions/${sessionId}/public`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      sessionData = await res.json();
    } else if (res.status === 404) {
      error = "not_found";
    } else {
      error = "server_error";
    }
  } catch {
    error = "server_error";
  }

  if (error === "not_found") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md px-6">
          <h1
            className="text-2xl text-[var(--text)] mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Interview Not Found
          </h1>
          <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            This interview link is invalid or has expired. Please contact the hiring company for a new link.
          </p>
        </div>
      </main>
    );
  }

  if (sessionData?.status === "completed") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md px-6">
          <h1
            className="text-2xl text-[var(--text)] mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            Interview Completed
          </h1>
          <p className="text-sm text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            This interview has already been completed. The hiring team will review your responses shortly.
          </p>
        </div>
      </main>
    );
  }

  return <InterviewRoom sessionId={sessionId} sessionData={sessionData} />;
}
