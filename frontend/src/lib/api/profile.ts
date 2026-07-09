import { API_URL, authFetch, getAccessToken, getRefreshToken, refreshAccessToken, removeTokens } from "./client";
import { emitSessionExpired } from "../session";

export async function getMyPlan(): Promise<any> {
  const res = await authFetch(`${API_URL}/auth/my-plan`);
  if (!res.ok) throw new Error("Error");
  return res.json();
}

export async function selectPlan(planId: string): Promise<any> {
  const res = await authFetch(`${API_URL}/auth/select-plan`, {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!res.ok) throw new Error("Error al seleccionar plan");
  return res.json();
}

export async function getBankAccounts() {
  const res = await authFetch(`${API_URL}/auth/bank-accounts`);
  if (!res.ok) throw new Error("Error al obtener cuentas bancarias");
  return res.json();
}

export async function saveBankAccount(dto: { bank_name: string; account_number: string; account_holder?: string; account_type?: string }) {
  const res = await authFetch(`${API_URL}/auth/bank-account`, { method: "POST", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al guardar cuenta bancaria");
  return res.json();
}

export async function updateBankAccount(id: string, dto: { bank_name?: string; account_number?: string; account_holder?: string; account_type?: string }) {
  const res = await authFetch(`${API_URL}/auth/bank-account/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  if (!res.ok) throw new Error("Error al actualizar cuenta");
  return res.json();
}

export async function deleteBankAccount(id: string) {
  const res = await authFetch(`${API_URL}/auth/bank-account/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar cuenta");
  return res.json();
}

export async function submitPlanPayment(data: {
  operation_number: string;
  amount: number;
  origin_account_id?: string;
  proof: File;
}) {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("operation_number", data.operation_number);
  fd.append("amount", String(data.amount));
  if (data.origin_account_id) fd.append("origin_account_id", data.origin_account_id);
  fd.append("proof", data.proof);

  let res = await fetch(`${API_URL}/auth/submit-payment`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}/auth/submit-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${newToken}` },
        body: fd,
      });
    } else {
      removeTokens();
      emitSessionExpired();
    }
  }

  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message);
  return res.json();
}
