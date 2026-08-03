import { MetadataRoute } from "next";

// The bare apex (entrancelab.in.net) 308-redirects to www — the sitemap
// reference should point at the final serving domain directly.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.entrancelab.in.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          // Auth-gated app pages — a crawler hitting these only finds a
          // redirect to /login, so there's nothing to index and no reason
          // to spend crawl budget on them.
          "/mock-tests",
          "/test/",
          "/analytics",
          "/results",
          "/practice",
          // /merchandise itself is public; posting and managing your own
          // listings requires login.
          "/merchandise/new",
          "/merchandise/mine",
          // Non-functional placeholder; real registration is at /register.
          "/signup",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
