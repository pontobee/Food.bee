const BASE_URL = process.env.ASAAS_API_URL ?? "https://sandbox.asaas.com/api/v3";
const API_KEY  = process.env.ASAAS_API_KEY ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "access_token": API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  status: string;
}

export interface AsaasPayment {
  id: string;
  value: number;
  dueDate: string;
  status: string;
}

export interface AsaasPixQrCode {
  success: boolean;
  encodedImage: string; // base64
  payload: string;      // copia e cola
  expirationDate: string;
}

export function createCustomer(data: { name: string; email: string; cpfCnpj?: string }) {
  return request<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createSubscription(data: {
  customer: string;
  billingType: "PIX";
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: "MONTHLY";
  description: string;
}) {
  return request<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSubscriptionPayments(subscriptionId: string) {
  return request<{ data: AsaasPayment[] }>(
    `/subscriptions/${subscriptionId}/payments?status=PENDING`,
  );
}

export function getPixQrCode(paymentId: string) {
  return request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
