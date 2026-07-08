export interface EvolutionConfig {
  url: string;
  apiKey: string;
  instance: string;
}

function headers(apiKey: string) {
  return { "Content-Type": "application/json", apikey: apiKey };
}

export async function criarInstancia(cfg: EvolutionConfig) {
  const res = await fetch(`${cfg.url}/instance/create`, {
    method:  "POST",
    headers: headers(cfg.apiKey),
    body:    JSON.stringify({ instanceName: cfg.instance, qrcode: true }),
  });
  if (!res.ok) throw new Error(`Evolution create: ${res.status}`);
  return res.json();
}

export async function buscarQrCode(cfg: EvolutionConfig): Promise<{ qrcode?: string; pairingCode?: string }> {
  const res = await fetch(`${cfg.url}/instance/connect/${cfg.instance}`, {
    headers: headers(cfg.apiKey),
  });
  if (!res.ok) throw new Error(`Evolution qrcode: ${res.status}`);
  return res.json();
}

export async function buscarStatus(cfg: EvolutionConfig): Promise<{ state: string }> {
  const res = await fetch(`${cfg.url}/instance/connectionState/${cfg.instance}`, {
    headers: headers(cfg.apiKey),
  });
  if (!res.ok) throw new Error(`Evolution status: ${res.status}`);
  const data = await res.json();
  return { state: data?.instance?.state ?? data?.state ?? "unknown" };
}

export async function desconectar(cfg: EvolutionConfig) {
  const res = await fetch(`${cfg.url}/instance/logout/${cfg.instance}`, {
    method:  "DELETE",
    headers: headers(cfg.apiKey),
  });
  if (!res.ok) throw new Error(`Evolution logout: ${res.status}`);
  return res.json();
}

export async function enviarMensagem(cfg: EvolutionConfig, numero: string, texto: string) {
  const res = await fetch(`${cfg.url}/message/sendText/${cfg.instance}`, {
    method:  "POST",
    headers: headers(cfg.apiKey),
    body:    JSON.stringify({ number: numero, text: texto }),
  });
  if (!res.ok) throw new Error(`Evolution sendText: ${res.status}`);
  return res.json() as Promise<{ key?: { id?: string } }>;
}
