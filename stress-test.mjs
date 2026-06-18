import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3001';
const CONCURRENCY = 50;
const TOTAL_REQUESTS = 1000;

async function authenticate() {
  console.log('🔑 Iniciando autenticação...');
  
  // 1. Obter CSRF Token e capturar os cookies do CSRF
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!csrfRes.ok) {
    throw new Error('Falha ao obter CSRF Token');
  }
  const { csrfToken } = await csrfRes.json();
  console.log(`✓ CSRF Token obtido: ${csrfToken.slice(0, 10)}...`);

  // Deduplicar cookies (NextAuth pode enviar múltiplos csrf-tokens)
  const cookieMap = new Map();
  csrfRes.headers.getSetCookie().forEach(cookieStr => {
    const [nameValue] = cookieStr.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    const value = valueParts.join('=');
    cookieMap.set(name.trim(), value.trim());
  });
  const csrfCookieHeader = [...cookieMap.entries()]
    .map(([name, val]) => `${name}=${val}`)
    .join('; ');

  // 2. Realizar Login passando o cookie do CSRF
  const loginBody = new URLSearchParams({
    csrfToken,
    email: 'admin@demo.com',
    password: 'admin123',
    redirect: 'false',
    json: 'true'
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookieHeader
    },
    body: loginBody.toString(),
    redirect: 'manual' // Impedir o fetch de seguir o 302 redirect automático
  });

  if (loginRes.status !== 302 && loginRes.status !== 200) {
    throw new Error(`Falha no login: ${loginRes.status} ${loginRes.statusText}`);
  }

  // Extrair cookies da resposta final de autenticação (302 redirect)
  const rawCookies = loginRes.headers.getSetCookie();
  if (rawCookies.length === 0) {
    throw new Error('Nenhum cookie retornado pela autenticação');
  }

  const cookieHeader = rawCookies
    .map(c => c.split(';')[0])
    .join('; ');

  console.log('✓ Autenticado com sucesso!');
  return cookieHeader;
}

// Retorna payload de pedido aleatório
function generateOrderPayload() {
  // Hambúrgueres:
  // X-Burguer Clássico (preco_venda: 22.9, preco_custo: 9.5, estoque_atual: 50, estoque_minimo: 5)
  // X-Bacon Duplo (preco_venda: 31.9, preco_custo: 13.0, estoque_atual: 30, estoque_minimo: 5)
  // Bebidas:
  // Coca-Cola 350ml (preco_venda: 6.0, preco_custo: 2.5, estoque_atual: 100, estoque_minimo: 20)
  // Suco de Laranja (preco_venda: 8.0, preco_custo: 3.0, estoque_atual: 40, estoque_minimo: 10)
  // Acompanhamentos:
  // Batata Frita P (preco_venda: 10.9, preco_custo: 3.5, estoque_atual: 60, estoque_minimo: 10)
  // Onion Rings (preco_venda: 14.9, preco_custo: 5.0, estoque_atual: 30, estoque_minimo: 5)
  
  // Vamos buscar os IDs dos produtos do banco antes de iniciar o teste de estresse
  // para garantir que enviamos IDs reais. Mas para simplificar, usaremos IDs simulados ou passados dinamicamente.
  // Para evitar erros de "Produto não encontrado", o script buscará os produtos ativos primeiro!
}

async function fetchProducts(cookie) {
  const res = await fetch(`${BASE_URL}/api/produtos`, {
    headers: {
      'Cookie': cookie
    }
  });
  if (!res.ok) {
    throw new Error('Falha ao buscar produtos');
  }
  return await res.json();
}

async function runBenchmark(name, url, options, totalRequests, concurrency) {
  console.log(`\n🚀 Iniciando benchmark: ${name}`);
  console.log(`Parâmetros: total=${totalRequests}, concorrência=${concurrency}, url=${url}`);
  
  const start = performance.now();
  let completed = 0;
  let successful = 0;
  let failed = 0;
  const latencies = [];

  const runRequest = async () => {
    const reqStart = performance.now();
    try {
      const opts = typeof options === 'function' ? options() : options;
      const res = await fetch(url, opts);
      const reqDuration = performance.now() - reqStart;
      latencies.push(reqDuration);
      
      if (res.ok) {
        successful++;
      } else {
        failed++;
        // console.error(`Erro ${res.status}:`, await res.text());
      }
    } catch (err) {
      failed++;
    }
    completed++;
  };

  // Executa em lotes/concorrência controlada
  const workers = Array(concurrency).fill(null).map(async () => {
    while (completed < totalRequests) {
      await runRequest();
    }
  });

  await Promise.all(workers);
  const duration = (performance.now() - start) / 1000;
  
  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`--- Resultados: ${name} ---`);
  console.log(`Duração: ${duration.toFixed(2)}s`);
  console.log(`Sucesso: ${successful} / Falha: ${failed}`);
  console.log(`RPS (Throughput): ${(totalRequests / duration).toFixed(2)} req/s`);
  console.log(`Latência Média: ${avg.toFixed(2)}ms`);
  console.log(`Latência p95: ${p95.toFixed(2)}ms`);
  console.log(`Latência p99: ${p99.toFixed(2)}ms`);
  
  return { successRate: (successful / totalRequests) * 100, avg, rps: totalRequests / duration };
}

async function main() {
  const target = process.argv[2] || 'all';
  
  try {
    // 1. Testar endpoint público de Webhook
    if (target === 'all' || target === 'eventos') {
      const webhookOpts = () => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'message.upsert',
          id: crypto.randomUUID(),
          data: {
            message: 'Teste de estresse ' + Math.random(),
            sender: '5511999999999@s.whatsapp.net'
          }
        })
      });
      
      await runBenchmark(
        'POST /api/eventos (Webhook)', 
        `${BASE_URL}/api/eventos`, 
        webhookOpts, 
        TOTAL_REQUESTS, 
        CONCURRENCY
      );
    }

    // 2. Testar endpoint autenticado de Pedidos
    if (target === 'all' || target === 'pedidos') {
      const cookie = await authenticate();
      const produtos = await fetchProducts(cookie);
      
      if (produtos.length === 0) {
        throw new Error('Nenhum produto cadastrado para realizar pedidos');
      }

      console.log(`✓ Encontrados ${produtos.length} produtos para simular pedidos.`);

      const orderOpts = () => {
        // Selecionar 1 a 2 produtos aleatórios
        const numItens = Math.floor(Math.random() * 2) + 1;
        const itens = [];
        for (let i = 0; i < numItens; i++) {
          const prod = produtos[Math.floor(Math.random() * produtos.length)];
          itens.push({
            produto_id: prod.id,
            quantidade: Math.floor(Math.random() * 2) + 1,
            adicionais: prod.adicionais && prod.adicionais.length > 0 && Math.random() > 0.5 
              ? [{ produto_adicional_id: prod.adicionais[0].id }]
              : []
          });
        }

        return {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
          },
          body: JSON.stringify({
            itens,
            forma_pagamento: 'PIX',
            origem: 'WHATSAPP',
            observacao: 'Pedido gerado pelo teste de estresse'
          })
        };
      };

      await runBenchmark(
        'POST /api/pedidos (Criação de Pedido)', 
        `${BASE_URL}/api/pedidos`, 
        orderOpts, 
        TOTAL_REQUESTS, 
        CONCURRENCY
      );
    }

  } catch (error) {
    console.error('❌ Ocorreu um erro no teste de estresse:', error);
  }
}

main();
