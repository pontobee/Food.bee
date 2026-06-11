// Script para tirar screenshots do sistema com Playwright
// Espera a página carregar completamente antes de fotografar

import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const PAGES = [
  { url: '/',                        file: 'ss-landing.png',      wait: '.gradient-text'         },
  { url: '/dashboard',               file: 'ss-dashboard.png',    wait: 'text=Bom dia'           },
  { url: '/dashboard/pedidos',       file: 'ss-pedidos.png',      wait: 'text=Pedidos Ativos'    },
  { url: '/dashboard/estoque',       file: 'ss-estoque.png',      wait: 'text=Total de Produtos' },
  { url: '/dashboard/financeiro',    file: 'ss-financeiro.png',   wait: 'text=Faturamento Mensal'},
  { url: '/dashboard/whatsapp',      file: 'ss-whatsapp.png',     wait: 'text=Bot WhatsApp'      },
];

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page    = await ctx.newPage();

for (const { url, file, wait } of PAGES) {
  console.log(`📸 ${url}`);
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  try { await page.waitForSelector(wait, { timeout: 6000 }); } catch {}
  await page.waitForTimeout(800); // animações finalizarem
  await page.screenshot({ path: file, fullPage: false });
  console.log(`   ✓ salvo: ${file}`);
}

await browser.close();
console.log('\n✅ Screenshots prontos!');
