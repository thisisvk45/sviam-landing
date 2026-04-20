import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/dashboard", "/profile", "/resume-builder", "/interview-prep", "/visa-prep"],
      },
    ],
    sitemap: "https://sviam.in/sitemap.xml",
  };
}
