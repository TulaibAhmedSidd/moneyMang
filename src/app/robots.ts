import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://money-mang.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/portal/login", "/portal/register"],
        disallow: [
          "/portal/analytics",
          "/portal/calendar",
          "/portal/transactions",
          "/portal/settings",
          "/api/",
          "/admin/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/portal/login", "/portal/register"],
        disallow: [
          "/portal/analytics",
          "/portal/calendar",
          "/portal/transactions",
          "/portal/settings",
          "/api/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
