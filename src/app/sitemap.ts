import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: "https://sviam.in", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: "https://sviam.in/jobs", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://sviam.in/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://sviam.in/dashboard", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  // Add city pages
  const cities = ["bangalore", "mumbai", "delhi-ncr", "hyderabad", "chennai", "pune", "remote"];
  for (const city of cities) {
    entries.push({
      url: `https://sviam.in/jobs/in/${city}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Add individual job pages
  try {
    const res = await fetch(`${API_URL}/jobs?limit=5000`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      for (const job of data.jobs || []) {
        const id = job._id || job.id;
        if (id) {
          entries.push({
            url: `https://sviam.in/jobs/${id}`,
            lastModified: job.posted_at ? new Date(job.posted_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Sitemap still works with static pages only
  }

  return entries;
}
