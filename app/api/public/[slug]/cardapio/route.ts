import { NextResponse } from "next/server";
import { getCardapio }  from "@/modules/public/public.service";

// GET /api/public/[slug]/cardapio — público, sem autenticação
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data     = await getCardapio(slug);
  if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(data);
}
