import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/auth";
import { prisma }                    from "@/lib/prisma";
import { cloudinary }                from "@/lib/cloudinary";

// GET /api/configuracoes/logo — retorna a logo_url atual
export async function GET() {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" },     { status: 403 });

  const lanchonete = await prisma.lanchonete.findUnique({
    where:  { id: session.user.lanchonete_id },
    select: { logo_url: true },
  });

  return NextResponse.json({ logo_url: lanchonete?.logo_url ?? null });
}

// POST /api/configuracoes/logo — faz upload da logo e salva a URL no banco
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)                      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" },     { status: 403 });

  const form = await req.formData();
  const file = form.get("logo") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         "lanchesmart/logos",
        public_id:      session.user.lanchonete_id,
        overwrite:      true,
        resource_type:  "image",
        transformation: [{ width: 400, height: 400, crop: "limit" }],
      },
      (err, res) => { if (err || !res) reject(err); else resolve(res); }
    );
    stream.end(buffer);
  });

  await prisma.lanchonete.update({
    where: { id: session.user.lanchonete_id },
    data:  { logo_url: result.secure_url },
  });

  return NextResponse.json({ logo_url: result.secure_url });
}
