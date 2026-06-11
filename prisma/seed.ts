import { config as loadEnv } from "dotenv";
import path from "node:path";
import bcrypt from "bcryptjs";

// tsx não carrega .env.local automaticamente (isso é convenção do Next.js).
// Import dinâmico após carregar o env: imports estáticos são "hoisted" e o
// módulo lib/prisma criaria o client (lendo DATABASE_URL) antes do loadEnv rodar.
loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

let prisma: (typeof import("../lib/prisma"))["prisma"];

async function main() {
  ({ prisma } = await import("../lib/prisma"));

  console.log("🌱 Seed iniciado...");

  // Lanchonete de demonstração
  const lanchonete = await prisma.lanchonete.upsert({
    where: { slug: "hamburgueria-demo" },
    update: {},
    create: {
      nome: "Hamburgueria Demo",
      slug: "hamburgueria-demo",
      telefone: "11999990000",
    },
  });

  console.log(`✅ Lanchonete: ${lanchonete.nome} (${lanchonete.id})`);

  // Assinatura trial
  await prisma.assinatura.upsert({
    where: { lanchonete_id: lanchonete.id },
    update: {},
    create: {
      lanchonete_id: lanchonete.id,
      plano: "TRIAL",
      status: "TRIAL",
      data_inicio: new Date(),
      data_vencimento: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 dias
    },
  });

  // Admin padrão
  const senhaHash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { lanchonete_id_email: { lanchonete_id: lanchonete.id, email: "admin@demo.com" } },
    update: {},
    create: {
      lanchonete_id: lanchonete.id,
      nome: "Administrador",
      email: "admin@demo.com",
      senha_hash: senhaHash,
      role: "ADMIN",
    },
  });

  console.log("✅ Usuário admin: admin@demo.com / admin123");

  // Categorias
  const categorias = await Promise.all(
    [
      { nome: "Hambúrgueres", ordem: 0 },
      { nome: "Bebidas", ordem: 1 },
      { nome: "Acompanhamentos", ordem: 2 },
      { nome: "Sobremesas", ordem: 3 },
    ].map((c) =>
      prisma.categoria.create({ data: { ...c, lanchonete_id: lanchonete.id } })
    )
  );

  console.log(`✅ ${categorias.length} categorias criadas`);

  // Produtos
  await prisma.produto.createMany({
    data: [
      { lanchonete_id: lanchonete.id, categoria_id: categorias[0].id, nome: "X-Burguer Clássico", preco_venda: 22.9, preco_custo: 9.5, estoque_atual: 50, estoque_minimo: 5 },
      { lanchonete_id: lanchonete.id, categoria_id: categorias[0].id, nome: "X-Bacon Duplo",      preco_venda: 31.9, preco_custo: 13.0, estoque_atual: 30, estoque_minimo: 5 },
      { lanchonete_id: lanchonete.id, categoria_id: categorias[1].id, nome: "Coca-Cola 350ml",    preco_venda: 6.0,  preco_custo: 2.5,  estoque_atual: 100, estoque_minimo: 20 },
      { lanchonete_id: lanchonete.id, categoria_id: categorias[1].id, nome: "Suco de Laranja",    preco_venda: 8.0,  preco_custo: 3.0,  estoque_atual: 40, estoque_minimo: 10 },
      { lanchonete_id: lanchonete.id, categoria_id: categorias[2].id, nome: "Batata Frita P",     preco_venda: 10.9, preco_custo: 3.5,  estoque_atual: 60, estoque_minimo: 10 },
      { lanchonete_id: lanchonete.id, categoria_id: categorias[2].id, nome: "Onion Rings",        preco_venda: 14.9, preco_custo: 5.0,  estoque_atual: 30, estoque_minimo: 5  },
    ],
  });

  // Adicionais globais
  await prisma.produtoAdicional.createMany({
    data: [
      { lanchonete_id: lanchonete.id, nome: "Bacon Extra",   tipo: "ADICIONAL", preco_extra: 4.0  },
      { lanchonete_id: lanchonete.id, nome: "Queijo Extra",  tipo: "ADICIONAL", preco_extra: 3.0  },
      { lanchonete_id: lanchonete.id, nome: "Ovo Frito",     tipo: "ADICIONAL", preco_extra: 2.5  },
      { lanchonete_id: lanchonete.id, nome: "Sem Alface",    tipo: "EXCECAO",   preco_extra: 0    },
      { lanchonete_id: lanchonete.id, nome: "Sem Cebola",    tipo: "EXCECAO",   preco_extra: 0    },
      { lanchonete_id: lanchonete.id, nome: "Sem Tomate",    tipo: "EXCECAO",   preco_extra: 0    },
    ],
  });

  console.log("✅ Produtos e adicionais criados");
  console.log("🎉 Seed concluído!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma?.$disconnect());
