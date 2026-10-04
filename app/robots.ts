import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow:    ["/", "/planos", "/cardapio/"],
      disallow: ["/dashboard/", "/api/", "/login", "/signup", "/forgot-password", "/reset-password/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
