[LancheSmart Handoff.dc.html](https://github.com/user-attachments/files/29119854/LancheSmart.Handoff.dc.html)
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #e7e5e1; color: #1c1917; -webkit-font-smoothing: antialiased; }
  @media print {
    body { background: #fff; }
    .doc-page { box-shadow: none !important; margin: 0 !important; }
    .page-break { page-break-before: always; }
  }
</style>
</helmet>

<div data-screen-label="Handoff" style="padding:40px 20px;background:#e7e5e1;min-height:100vh;">
<div class="doc-page" style="max-width:860px;margin:0 auto;background:#fbfaf8;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:72px 76px;">

  <!-- COVER -->
  <div style="display:flex;align-items:center;gap:13px;margin-bottom:36px;">
    <img src="assets/icone.webp" alt="LancheSmart" style="width:46px;height:46px;border-radius:12px;display:block;object-fit:cover;" />
    <div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:18px;letter-spacing:-0.01em;color:#1c1917;">LancheSmart</div>
      <div style="font-size:13px;color:#78716c;">Plataforma de gestão para lanchonetes</div>
    </div>
  </div>

  <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:999px;background:rgba(230,92,0,0.10);border:1px solid rgba(230,92,0,0.25);font-size:12px;font-weight:600;color:#c2410c;letter-spacing:0.04em;text-transform:uppercase;">Documento de Handoff · Dev</div>
  <h1 style="font-family:'Sora',sans-serif;font-weight:800;font-size:40px;line-height:1.1;letter-spacing:-0.025em;margin:18px 0 0;color:#16130f;">Landing Page — Relatório de entrega</h1>
  <p style="margin:14px 0 0;font-size:16px;line-height:1.6;color:#57534e;max-width:600px;">Estado atual, pendências, arquitetura de componentes e design system para continuidade do desenvolvimento até a V1.</p>

  <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:28px;font-size:13px;color:#78716c;">
    <span><strong style="color:#1c1917;">Versão:</strong> 0.9 (pré-V1)</span>
    <span><strong style="color:#1c1917;">Data:</strong> 19 jun 2026</span>
    <span><strong style="color:#1c1917;">Stack:</strong> HTML + Design Components</span>
  </div>

  <!-- PROGRESS -->
  <div style="margin-top:32px;padding:22px 24px;background:#fff;border:1px solid #ece8e1;border-radius:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <span style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:#1c1917;">Conclusão estimada</span>
      <span style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;color:#e65c00;">90%</span>
    </div>
    <div style="height:10px;background:#f0ece5;border-radius:999px;overflow:hidden;">
      <div style="height:100%;width:90%;background:linear-gradient(90deg,#e65c00,#fb923c);border-radius:999px;"></div>
    </div>
    <p style="margin:12px 0 0;font-size:13px;color:#78716c;line-height:1.5;">Estrutura visual e fluxo principal concluídos. Faltam camadas de polimento (scroll-spy, performance, SEO e acessibilidade) e integrações reais para fechar a V1.</p>
  </div>

  <!-- 1. CONCLUÍDO -->
  <div style="margin-top:48px;">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">01</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Funcionalidades concluídas</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:0;margin-top:6px;">
      <sc-for list="{{ done }}" as="d" hint-placeholder-count="9">
        <div style="display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #f0ece5;">
          <span style="flex:none;width:22px;height:22px;border-radius:7px;background:rgba(34,197,94,0.12);display:flex;align-items:center;justify-content:center;margin-top:1px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
          <div>
            <div style="font-size:14.5px;font-weight:600;color:#1c1917;">{{ d.title }}</div>
            <div style="font-size:13.5px;color:#78716c;line-height:1.5;margin-top:2px;">{{ d.desc }}</div>
          </div>
        </div>
      </sc-for>
    </div>
  </div>

  <!-- 2. PENDÊNCIAS -->
  <div style="margin-top:48px;" class="page-break">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">02</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Pendências</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:0;margin-top:6px;">
      <sc-for list="{{ todo }}" as="t" hint-placeholder-count="8">
        <div style="display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #f0ece5;align-items:flex-start;">
          <span style="flex:none;width:22px;height:22px;border-radius:7px;background:{{ t.tagBg }};display:flex;align-items:center;justify-content:center;margin-top:1px;font-size:11px;">{{ t.glyph }}</span>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:14.5px;font-weight:600;color:#1c1917;">{{ t.title }}</span>
              <span style="font-size:10.5px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:{{ t.prioColor }};background:{{ t.prioBg }};border-radius:5px;padding:2px 7px;">{{ t.prio }}</span>
            </div>
            <div style="font-size:13.5px;color:#78716c;line-height:1.5;margin-top:2px;">{{ t.desc }}</div>
          </div>
        </div>
      </sc-for>
    </div>
  </div>

  <!-- 3. COMPONENTES -->
  <div style="margin-top:48px;">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">03</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Estrutura de componentes</h2>
    </div>
    <p style="font-size:13.5px;color:#78716c;margin:14px 0 18px;line-height:1.55;">O projeto é composto por 4 arquivos <span style="font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#c2410c;">.dc.html</span> independentes. A landing concentra a lógica num único componente com estado interno (modais, seções reveláveis e scroll suave).</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <sc-for list="{{ components }}" as="c" hint-placeholder-count="4">
        <div style="background:#fff;border:1px solid #ece8e1;border-radius:13px;padding:18px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:13.5px;font-weight:500;color:#1c1917;">{{ c.file }}</span>
            <span style="font-size:11px;font-weight:600;color:#57534e;background:#f0ece5;border-radius:6px;padding:3px 9px;">{{ c.role }}</span>
          </div>
          <p style="margin:10px 0 0;font-size:13.5px;color:#57534e;line-height:1.55;">{{ c.desc }}</p>
          <div style="margin-top:11px;display:flex;flex-wrap:wrap;gap:6px;">
            <sc-for list="{{ c.parts }}" as="p" hint-placeholder-count="4">
              <span style="font-size:11.5px;color:#78716c;background:#faf7f3;border:1px solid #ece8e1;border-radius:6px;padding:3px 9px;">{{ p.name }}</span>
            </sc-for>
          </div>
        </div>
      </sc-for>
    </div>
  </div>

  <!-- 4. DESIGN SYSTEM -->
  <div style="margin-top:48px;" class="page-break">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">04</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Design System</h2>
    </div>

    <!-- cores -->
    <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;margin:22px 0 12px;color:#1c1917;">Cores</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      <sc-for list="{{ colors }}" as="c" hint-placeholder-count="8">
        <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;overflow:hidden;">
          <div style="height:46px;background:{{ c.hex }};border-bottom:1px solid rgba(0,0,0,0.06);"></div>
          <div style="padding:9px 11px;">
            <div style="font-size:12px;font-weight:600;color:#1c1917;">{{ c.name }}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#a8a29e;margin-top:1px;">{{ c.hex }}</div>
          </div>
        </div>
      </sc-for>
    </div>

    <!-- tipografia -->
    <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;margin:26px 0 12px;color:#1c1917;">Tipografia</h3>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <span style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;color:#16130f;">Sora — Títulos</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#a8a29e;">600 · 700 · 800</span>
      </div>
      <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <span style="font-family:'Inter',sans-serif;font-size:17px;font-weight:400;color:#16130f;">Inter — Corpo & UI</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#a8a29e;">400 · 500 · 600 · 700</span>
      </div>
      <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:500;color:#16130f;">JetBrains Mono — Labels/código</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#a8a29e;">400 · 500</span>
      </div>
    </div>

    <!-- espaçamentos + sombras + raios -->
    <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;margin:26px 0 12px;color:#1c1917;">Espaçamentos, raios & sombras</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;padding:16px 18px;">
        <div style="font-size:12.5px;font-weight:600;color:#1c1917;margin-bottom:8px;">Raio de borda</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#57534e;line-height:1.9;">Botões / inputs · <span style="color:#e65c00;">10–11px</span><br>Cards · <span style="color:#e65c00;">13–16px</span><br>Modais / blocos · <span style="color:#e65c00;">18–20px</span><br>Pills · <span style="color:#e65c00;">999px</span></div>
      </div>
      <div style="background:#fff;border:1px solid #ece8e1;border-radius:11px;padding:16px 18px;">
        <div style="font-size:12.5px;font-weight:600;color:#1c1917;margin-bottom:8px;">Ritmo de espaçamento</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#57534e;line-height:1.9;">Base · <span style="color:#e65c00;">4px</span><br>Gaps de UI · <span style="color:#e65c00;">8 / 12 / 16px</span><br>Padding seção · <span style="color:#e65c00;">48–88px</span><br>Container · <span style="color:#e65c00;">1100–1200px</span></div>
      </div>
    </div>

    <!-- elementos -->
    <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;margin:26px 0 12px;color:#1c1917;">Elementos de UI</h3>
    <div style="background:#0d0d0d;border:1px solid #27272a;border-radius:14px;padding:26px 24px;">
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
        <span style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;font-size:14px;font-weight:600;color:#fff;background:#e65c00;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,0.3);">Primário</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;font-size:14px;font-weight:600;color:#fafafa;background:rgba(255,255,255,0.04);border:1px solid #2f2f33;border-radius:10px;">Secundário</span>
        <span style="display:inline-flex;align-items:center;justify-content:center;padding:13px 14px;font-size:14px;font-weight:600;color:#a1a1aa;border-radius:9px;">Terciário</span>
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:13px;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid #27272a;border-radius:11px;max-width:320px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>
        <span style="font-size:13.5px;color:#71717a;">Input · borda #27272a, foco laranja</span>
      </div>
      <div style="margin-top:11px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#71717a;line-height:1.8;">Sombra card · 0 18px 40px -16px rgba(0,0,0,.6)<br>Anel de foco · 0 0 0 3px rgba(230,92,0,.45)</div>
    </div>
  </div>

  <!-- 5. MELHORIAS -->
  <div style="margin-top:48px;">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">05</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Melhorias recomendadas</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
      <sc-for list="{{ improvements }}" as="m" hint-placeholder-count="6">
        <div style="display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid #ece8e1;border-radius:12px;padding:15px 18px;">
          <span style="flex:none;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#fff;background:{{ m.rankBg }};width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;">{{ m.rank }}</span>
          <div>
            <div style="font-size:14.5px;font-weight:600;color:#1c1917;">{{ m.title }}</div>
            <div style="font-size:13.5px;color:#78716c;line-height:1.5;margin-top:2px;">{{ m.desc }}</div>
          </div>
        </div>
      </sc-for>
    </div>
  </div>

  <!-- 6. STATUS FINAL -->
  <div style="margin-top:48px;">
    <div style="display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #1c1917;padding-bottom:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#e65c00;font-weight:500;">06</span>
      <h2 style="font-family:'Sora',sans-serif;font-size:23px;font-weight:700;margin:0;letter-spacing:-0.015em;color:#16130f;">Status final</h2>
    </div>
    <div style="margin-top:18px;background:linear-gradient(135deg,#16130f,#26201a);border-radius:18px;padding:30px 32px;color:#fafafa;">
      <div style="display:flex;align-items:baseline;gap:14px;">
        <span style="font-family:'Sora',sans-serif;font-size:46px;font-weight:800;letter-spacing:-0.03em;color:#fb923c;">90%</span>
        <span style="font-size:15px;color:#d6d3d1;">concluído · pronto para a reta final da V1</span>
      </div>
      <p style="margin:14px 0 18px;font-size:14px;line-height:1.6;color:#c7c2bd;max-width:600px;">A camada visual e o fluxo de conversão (explorar demo → contratar) estão completos e coesos. Para fechar a <strong style="color:#fff;">V1</strong>, faltam os 10% de robustez e integração:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <sc-for list="{{ v1 }}" as="v" hint-placeholder-count="4">
          <div style="display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:#e7e5e4;line-height:1.45;">
            <span style="color:#fb923c;font-weight:700;flex:none;">→</span>{{ v.text }}
          </div>
        </sc-for>
      </div>
    </div>
    <p style="margin:20px 0 0;font-size:12.5px;color:#a8a29e;text-align:center;">LancheSmart · Documento de handoff gerado em 19 jun 2026 · Confidencial</p>
  </div>

</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props="{&quot;$preview&quot;:{&quot;width&quot;:900,&quot;height&quot;:1200}}">
class Component extends DCLogic {
  renderVals() {
    const prio = {
      alta: { prio: 'Alta', prioColor: '#b91c1c', prioBg: 'rgba(220,38,38,0.10)' },
      media: { prio: 'Média', prioColor: '#c2410c', prioBg: 'rgba(234,88,12,0.10)' },
      baixa: { prio: 'Baixa', prioColor: '#3f6212', prioBg: 'rgba(101,163,13,0.12)' },
    };
    return {
      done: [
        { title: 'Navbar', desc: 'Logo clicável (scroll suave ao topo, sem ação no topo), itens Soluções e Planos com scroll âncora, CTA "Acessar painel" abrindo o modal.' },
        { title: 'Hero', desc: 'Badge, título com destaque laranja, subtítulo, par de CTAs, linha de confiança e mockup do painel (Kanban de pedidos) ao lado.' },
        { title: 'Modal de Login', desc: 'Overlay com blur, animação de entrada/saída (fade + scale), e-mail e senha com ícones, mostrar/ocultar senha, estado de loading, fecha por X / ESC / clique fora.' },
        { title: 'Seção de Soluções', desc: 'Âncora #solucoes acessível pela navbar, apresentando os quatro recursos centrais da plataforma.' },
        { title: 'Cards de funcionalidades', desc: 'Gestão de pedidos, controle de estoque, financeiro e automação via WhatsApp — grid responsivo com ícones SVG.' },
        { title: 'CTA principal', desc: '"Explorar demonstração" — leva direto à /demo, sem login, como porta de entrada do funil.' },
        { title: 'CTA secundário', desc: '"Como funciona" — revela a seção de 3 passos (Receba · Controle · Entregue) com CTA de WhatsApp ao final.' },
        { title: 'Seção de Planos', desc: 'PRO (R$ 79,99) e FULL (R$ 199,99) com badge "Mais vendido", checklists e botões primário/outline.' },
        { title: 'Responsividade', desc: 'Breakpoints em 900/860/560px: hero, grids de features, kanban, planos e demo empilham em telas menores.' },
        { title: 'Animações existentes', desc: 'Entrada do modal, pulso (ping) de novos pedidos, hover dos cards (elevação + sombra) e transições de botão.' },
      ],
      todo: [
        { ...prio.media, glyph: '✨', tagBg: 'rgba(234,88,12,0.10)', title: 'Microanimações', desc: 'Revelar seções no scroll (fade/slide), contadores animados nos KPIs do demo e transição entre views.' },
        { ...prio.baixa, glyph: '🖱️', tagBg: 'rgba(101,163,13,0.12)', title: 'Hover states (refino)', desc: 'Cobertos nos botões e cards principais; padronizar nav, links de rodapé e itens de lista do demo.' },
        { ...prio.media, glyph: '📊', tagBg: 'rgba(234,88,12,0.10)', title: 'Dashboard Demo', desc: 'Telas montadas com dados mockados; falta conectar a dados reais/sessão e tornar o Kanban arrastável.' },
        { ...prio.alta, glyph: '🧭', tagBg: 'rgba(220,38,38,0.10)', title: 'Scroll Spy da navbar', desc: 'Destacar o item ativo (Soluções/Planos) conforme a seção visível via IntersectionObserver.' },
        { ...prio.media, glyph: '📱', tagBg: 'rgba(234,88,12,0.10)', title: 'Ajustes de responsividade', desc: 'Validar 320–414px, menu hambúrguer no mobile e revisão do modal em telas baixas.' },
        { ...prio.media, glyph: '⚡', tagBg: 'rgba(234,88,12,0.10)', title: 'Otimizações de performance', desc: 'Self-host das fontes, lazy-load de imagens, e remoção de código morto na classe de lógica.' },
        { ...prio.alta, glyph: '🔍', tagBg: 'rgba(220,38,38,0.10)', title: 'SEO', desc: 'Meta tags (title/description), Open Graph, favicon, dados estruturados e tags semânticas <header>/<main>/<footer>.' },
        { ...prio.alta, glyph: '♿', tagBg: 'rgba(220,38,38,0.10)', title: 'Acessibilidade', desc: 'Foco visível em toda navegação por teclado, trap de foco no modal, aria-labels e contraste AA verificado.' },
      ],
      components: [
        { file: 'LancheSmart Landing.dc.html', role: 'Página principal', desc: 'Componente único com estado interno: controla modal de login, seção "Como funciona" (reveal), scroll suave das âncoras e abertura automática do modal via ?signup=1.', parts: [ {name:'Navbar'}, {name:'Hero + mockup'}, {name:'Soluções'}, {name:'Como funciona'}, {name:'Planos'}, {name:'Login Modal'} ] },
        { file: 'LancheSmart Demo.dc.html', role: 'App de demonstração', desc: 'Shell com sidebar e troca de views por estado. Banner "Modo demonstração" e dados 100% mockados, sem login.', parts: [ {name:'Dashboard'}, {name:'Pedidos (Kanban)'}, {name:'Estoque'}, {name:'Financeiro'} ] },
        { file: 'Botoes Design System.dc.html', role: 'Referência', desc: 'Guia de botões (primário/secundário/terciário) com estados, alinhamento de ícones e CSS pronto via tokens.', parts: [ {name:'Tokens'}, {name:'Estados'}, {name:'Código'} ] },
        { file: 'LancheSmart Landing.html', role: 'Build standalone', desc: 'Versão self-contained (fontes inlinadas) para distribuição offline. Gerada a partir da landing.', parts: [ {name:'Offline'}, {name:'Single-file'} ] },
      ],
      colors: [
        { name: 'Accent', hex: '#e65c00' },
        { name: 'Accent hover', hex: '#cc5200' },
        { name: 'Accent active', hex: '#b34800' },
        { name: 'Background', hex: '#09090b' },
        { name: 'Surface', hex: '#18181b' },
        { name: 'Border', hex: '#27272a' },
        { name: 'Texto', hex: '#fafafa' },
        { name: 'Texto mudo', hex: '#8b8b93' },
      ],
      improvements: [
        { rank: '1', rankBg: '#b91c1c', title: 'Acessibilidade + SEO antes do lançamento', desc: 'São bloqueadores de qualidade para a V1 pública: meta tags, foco por teclado e contraste AA.' },
        { rank: '2', rankBg: '#c2410c', title: 'Scroll spy e menu mobile', desc: 'Fecham a navegação: item ativo na navbar e hambúrguer abaixo de 768px.' },
        { rank: '3', rankBg: '#c2410c', title: 'Integração real do demo e formulário', desc: 'Conectar login/cadastro e o dashboard a uma API; persistir sessão.' },
        { rank: '4', rankBg: '#a16207', title: 'Microanimações no scroll', desc: 'Revelar seções e animar KPIs para reforçar a percepção premium.' },
        { rank: '5', rankBg: '#65a30d', title: 'Performance e fontes self-hosted', desc: 'Reduzir dependência de CDN, lazy-load e limpeza de código.' },
        { rank: '6', rankBg: '#65a30d', title: 'Analytics e rastreio de conversão', desc: 'Eventos nos CTAs (explorar demo, contratar) para medir o funil.' },
      ],
      v1: [
        { text: 'SEO e meta tags completos' },
        { text: 'Acessibilidade AA + navegação por teclado' },
        { text: 'Scroll spy e menu mobile' },
        { text: 'Integração real de auth e do dashboard' },
      ],
    };
  }
}
</script>
</body>
</html>
