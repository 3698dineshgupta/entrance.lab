import { MetadataRoute } from "next";

// Only genuinely public, crawlable pages — /mock-tests, /practice, /analytics,
// /results, and /test/* all redirect an unauthenticated visitor to /login
// (see middleware.ts and each page's own getServerSession check), so
// listing them would just send crawlers into a redirect with nothing to
// index. /signup is a non-functional placeholder (real registration is at
// /register) and is deliberately left out.
// The bare apex (entrancelab.in.net) 308-redirects to www — list the final
// serving domain directly so crawlers don't spend a hop on every URL.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.entrancelab.in.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/register`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/login`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/request-hub`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
