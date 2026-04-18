import { createBrowserClient } from "@supabase/ssr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type MatchResult = {
  match_score: number;
  job_id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  apply_url: string;
  posted_at: string;
  skills: string[];
  source: string;
};

export type MatchResponse = {
  jobs_matched: number;
  results: MatchResult[];
};

export type Profile = {
  id: string;
  name: string;
  phone: string;
  city: string;
  experience_level: string;
  job_preferences: object;
  resume_url: string;
  resume_text: string;
  created_at: string;
};

export type ResumeUploadResponse = {
  message: string;
  resume_url: string;
  char_count: number;
};

export type JobStats = {
  total_active_jobs: number;
};

export type SavedJob = {
  user_id: string;
  job_id: string;
  title: string;
  company: string;
  city: string;
  created_at: string;
};

export type MatchFilters = {
  city?: string;
  remote_only?: boolean;
  min_score?: number;
  limit?: number;
  offset?: number;
};

async function getToken(): Promise<string | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function matchResume(
  file: File,
  token?: string,
  filters?: MatchFilters
): Promise<MatchResponse> {
  const params = new URLSearchParams();
  if (filters?.city) params.set("city", filters.city);
  if (filters?.remote_only) params.set("remote_only", "true");
  if (filters?.min_score) params.set("min_score", String(filters.min_score));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const form = new FormData();
  form.append("resume", file);
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const qs = params.toString();
  const url = `${API_URL}/match/resume${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { method: "POST", headers, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to match resume");
  }
  return res.json();
}

export async function matchStored(
  token: string,
  filters?: MatchFilters
): Promise<MatchResponse> {
  const params = new URLSearchParams();
  if (filters?.city) params.set("city", filters.city);
  if (filters?.remote_only) params.set("remote_only", "true");
  if (filters?.min_score) params.set("min_score", String(filters.min_score));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const form = new FormData();
  const qs = params.toString();
  const url = `${API_URL}/match/resume${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to match stored resume");
  }
  return res.json();
}

export async function getProfile(token: string): Promise<Profile> {
  const res = await fetch(`${API_URL}/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch profile");
  }
  return res.json();
}

export async function updateProfile(
  token: string,
  data: Partial<Profile>
): Promise<Profile> {
  const res = await fetch(`${API_URL}/profile/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile");
  }
  return res.json();
}

export async function uploadResume(
  token: string,
  file: File
): Promise<ResumeUploadResponse> {
  const form = new FormData();
  form.append("resume", file);
  const res = await fetch(`${API_URL}/profile/resume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload resume");
  }
  return res.json();
}

export async function getJobStats(): Promise<JobStats> {
  const res = await fetch(`${API_URL}/jobs/stats`);
  if (!res.ok) throw new Error("Failed to fetch job stats");
  return res.json();
}

export async function saveJob(token: string, jobId: string): Promise<void> {
  const res = await fetch(`${API_URL}/jobs/save/${jobId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save job");
  }
}

export async function unsaveJob(token: string, jobId: string): Promise<void> {
  const res = await fetch(`${API_URL}/jobs/save/${jobId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to unsave job");
  }
}

export async function getSavedJobs(
  token: string
): Promise<{ saved_jobs: SavedJob[] }> {
  const res = await fetch(`${API_URL}/jobs/saved`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch saved jobs");
  }
  return res.json();
}

// Resume Builder types
export type ResumePersonal = {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedin: string;
  portfolio: string;
};

export type ResumeExperience = {
  company: string;
  title: string;
  start: string;
  end: string;
  location: string;
  bullets: string[];
};

export type ResumeEducation = {
  institution: string;
  degree: string;
  field: string;
  year: string;
  gpa: string;
};

export type ResumeCertification = {
  name: string;
  issuer: string;
  year: string;
};

export type ResumeData = {
  personal: ResumePersonal;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications: ResumeCertification[];
};

export type TailorChange = {
  section: string;
  original: string;
  updated: string;
  reason: string;
};

export async function parseResume(
  token: string,
  file: File
): Promise<ResumeData> {
  const form = new FormData();
  form.append("resume", file);
  const res = await fetch(`${API_URL}/resume/parse`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to parse resume");
  }
  return res.json();
}

export async function improveBullets(
  token: string,
  data: { company: string; title: string; bullets: string[] }
): Promise<{ improved_bullets: string[] }> {
  const res = await fetch(`${API_URL}/resume/improve-bullets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to improve bullets");
  }
  return res.json();
}

export async function generateSummary(
  token: string,
  data: { experience: ResumeExperience[]; skills: string[]; target_role?: string }
): Promise<{ summary: string }> {
  const res = await fetch(`${API_URL}/resume/generate-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate summary");
  }
  return res.json();
}

export async function suggestSkills(
  token: string,
  data: { experience: ResumeExperience[]; current_skills: string[] }
): Promise<{ suggested_skills: string[] }> {
  const res = await fetch(`${API_URL}/resume/suggest-skills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to suggest skills");
  }
  return res.json();
}

export async function tailorResume(
  token: string,
  data: { resume: ResumeData; job_description: string }
): Promise<{ tailored_resume: ResumeData; changes: TailorChange[] }> {
  const res = await fetch(`${API_URL}/resume/tailor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to tailor resume");
  }
  return res.json();
}

export async function generatePdf(
  token: string,
  resume: ResumeData
): Promise<Blob> {
  const res = await fetch(`${API_URL}/resume/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resume }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate PDF");
  }
  return res.blob();
}

export { getToken };
