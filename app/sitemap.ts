import type { MetadataRoute } from "next";
import { prisma }             from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";

  const lanchonetes = await prisma.lanchonete.findMany({
    where:  { inativo_em: null },
    select: { slug: true, criado_em: true },
  });

  return [
    {
      url:             base,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        1,
    },
    {
      url:             `${base}/planos`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    ...lanchonetes.map((l) => ({
      url:             `${base}/cardapio/${l.slug}`,
      lastModified:    l.criado_em,
      changeFrequency: "weekly" as const,
      priority:        0.6,
    })),
  ];
}
