import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrancelab.in.net";

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
          // Non-functional placeholder; real registration is at /register.
          "/signup",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
