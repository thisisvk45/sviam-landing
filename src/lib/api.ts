import { createBrowserClient } from "@supabase/ssr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SubScores = {
  skill_match: number;
  experience_match: number;
  location_match: number;
};

export type MatchResult = {
  match_score: number;
  job_id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  work_type: string;
  apply_url: string;
  posted_at: string;
  skills: string[];
  source: string;
  sub_scores?: SubScores;
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

export type ApplicationStatus = 'queued' | 'applied' | 'interview' | 'offer' | 'rejected';

export type Application = {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  resume_id: string | null;
  title: string;
  company: string;
  city: string;
  apply_url: string;
  tailored_resume_json: object | null;
  cover_letter: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AtsProfile = {
  linkedin: string;
  github: string;
  portfolio: string;
  work_authorization: string;
  current_ctc: string;
  expected_ctc: string;
  notice_period: string;
  dob: string;
  gender: string;
  full_address: string;
  languages: string[];
  references: string[];
};

export type AutoApplySettings = {
  enabled: boolean;
  max_per_day: number;
  min_match_score: number;
  excluded_companies: string[];
  preferred_work_modes: string[];
  always_include_cover_letter: boolean;
};

export type MatchFilters = {
  city?: string;
  work_type?: string;
  remote_only?: boolean;
  min_score?: number;
  limit?: number;
  offset?: number;
  resume_id?: string;
};

export type UserResume = {
  id: string;
  user_id: string;
  label: string;
  storage_path: string;
  char_count: number;
  created_at: string;
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
  if (filters?.resume_id) params.set("resume_id", filters.resume_id);
  if (filters?.city) params.set("city", filters.city);
  if (filters?.work_type) params.set("work_type", filters.work_type);
  if (filters?.remote_only) params.set("remote_only", "true");
  if (filters?.min_score) params.set("min_score", String(filters.min_score));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const qs = params.toString();
  const url = `${API_URL}/match/resume${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to match stored resume");
  }
  return res.json();
}

export async function listResumes(
  token: string
): Promise<{ resumes: UserResume[] }> {
  const res = await fetch(`${API_URL}/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to list resumes");
  }
  return res.json();
}

export async function uploadUserResume(
  token: string,
  file: File,
  label: string
): Promise<UserResume> {
  const form = new FormData();
  form.append("resume", file);
  const res = await fetch(`${API_URL}/resumes?label=${encodeURIComponent(label)}`, {
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

export async function deleteResume(
  token: string,
  resumeId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/resumes/${resumeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete resume");
  }
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

export type JobDetail = {
  _id: string;
  source: string;
  source_url: string;
  apply_url: string;
  ats_type: string;
  company: { name: string; domain: string; city: string; industry: string; size: string };
  role: { title: string; title_canonical: string; level: string; department: string; type: string };
  location: { city: string; state: string; country: string; remote: boolean; hybrid: boolean };
  requirements: { skills: string[]; exp_years_min: number; exp_years_max: number; education: string };
  compensation: { salary_min: number; salary_max: number; currency: string; disclosed: boolean };
  raw_jd: string;
  posted_at: string;
  is_active: boolean;
};

export async function getJob(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Job not found");
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

export async function generateCoverLetter(
  token: string,
  data: { resume_text: string; job_title: string; company: string; city?: string; job_description?: string; tone?: "formal" | "creative" }
): Promise<{ cover_letter: string }> {
  const res = await fetch(`${API_URL}/resume/cover-letter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate cover letter");
  }
  return res.json();
}

// Public Profile
export type PublicProfile = {
  name: string;
  city: string;
  experience_level: string;
  linkedin: string;
  github: string;
  portfolio: string;
  skills: string[];
  target_roles: string[];
  work_mode: string;
};

export async function getPublicProfile(slug: string): Promise<PublicProfile> {
  const res = await fetch(`${API_URL}/profile/public/${slug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Profile not found");
  }
  return res.json();
}

// Interview Prep
export type InterviewQuestion = {
  question: string;
  category: string;
  difficulty: string;
  tip: string;
};

export async function generateInterviewQuestions(
  token: string,
  data: { job_title: string; company: string; skills?: string[]; experience_level?: string; question_count?: number }
): Promise<{ questions: InterviewQuestion[] }> {
  const res = await fetch(`${API_URL}/interview-prep/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate questions");
  }
  return res.json();
}

export async function generateVisaPrepQuestions(
  token: string,
  data: { university: string; program: string; consulate_city?: string; funding?: string; work_experience_years?: number; question_count?: number }
): Promise<{ questions: InterviewQuestion[] }> {
  const res = await fetch(`${API_URL}/interview-prep/visa-prep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate visa questions");
  }
  return res.json();
}

// Applications API
export async function getApplications(
  token: string,
  status?: ApplicationStatus
): Promise<{ applications: Application[] }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/applications${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch applications");
  }
  return res.json();
}

export async function createApplication(
  token: string,
  data: { job_id: string; title: string; company: string; city: string; apply_url: string; resume_id?: string; notes?: string }
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create application");
  }
  return res.json();
}

export async function updateApplication(
  token: string,
  id: string,
  data: { status?: ApplicationStatus; notes?: string; cover_letter?: string; resume_id?: string }
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update application");
  }
  return res.json();
}

export async function deleteApplication(
  token: string,
  id: string
): Promise<void> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete application");
  }
}

export async function createApplicationFromApply(
  token: string,
  jobId: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/from-apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to track application");
  }
  return res.json();
}

export async function explainMatch(
  token: string,
  data: { job_id: string; resume_text: string }
): Promise<{ explanation: string }> {
  const res = await fetch(`${API_URL}/match/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to explain match");
  }
  return res.json();
}

export async function getSimilarJobs(jobId: string): Promise<{ similar_jobs: MatchResult[] }> {
  const res = await fetch(`${API_URL}/jobs/${jobId}/similar`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch similar jobs");
  }
  return res.json();
}

export type ProfileFull = {
  profile: Profile;
  stats: {
    applications_count: number;
    saved_jobs_count: number;
    resumes_count: number;
  };
};

export async function getProfileFull(token: string): Promise<ProfileFull> {
  const res = await fetch(`${API_URL}/profile/full`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch full profile");
  }
  return res.json();
}

export async function getTrendingJobs(limit?: number): Promise<MatchResponse> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/jobs/trending${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch trending jobs");
  }
  return res.json();
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/profile/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete account");
  }
}

// Job cities for SEO pages
export type CityCount = { city: string; count: number };

export async function getJobCities(): Promise<{ cities: CityCount[] }> {
  const res = await fetch(`${API_URL}/jobs/cities`);
  if (!res.ok) return { cities: [] };
  return res.json();
}

// Billing API
export type SubscriptionStatus = {
  tier: "free" | "pro" | "unlimited";
  subscription_id: string | null;
  valid_until: string | null;
};

export type UsageInfo = {
  allowed: boolean;
  tier: string;
  used: number;
  limit: number;
  resets?: string;
};

export async function getBillingStatus(token: string): Promise<SubscriptionStatus> {
  const res = await fetch(`${API_URL}/billing/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { tier: "free", subscription_id: null, valid_until: null };
  return res.json();
}

export async function getBillingUsage(token: string): Promise<Record<string, UsageInfo>> {
  const res = await fetch(`${API_URL}/billing/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.usage || {};
}

export async function createOrder(
  token: string,
  tier: "pro" | "unlimited"
): Promise<{ order_id: string; amount: number; currency: string; key_id: string; tier: string }> {
  const res = await fetch(`${API_URL}/billing/create-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create order");
  }
  return res.json();
}

export async function verifyPayment(
  token: string,
  data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; tier: string }
): Promise<{ status: string; tier: string; valid_until: string }> {
  const res = await fetch(`${API_URL}/billing/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Payment verification failed");
  }
  return res.json();
}

// Job listing (for server-side use)
export type JobListResponse = {
  jobs: JobDetail[];
  total: number;
  count: number;
  skip: number;
  limit: number;
};

export async function listJobs(params?: {
  city?: string;
  level?: string;
  remote?: boolean;
  limit?: number;
  skip?: number;
}): Promise<JobListResponse> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.level) qs.set("level", params.level);
  if (params?.remote) qs.set("remote", "true");
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.skip) qs.set("skip", String(params.skip));
  const res = await fetch(`${API_URL}/jobs?${qs}`);
  if (!res.ok) return { jobs: [], total: 0, count: 0, skip: 0, limit: 20 };
  return res.json();
}

export { getToken };
