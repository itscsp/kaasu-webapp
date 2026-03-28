const BASE_URL = import.meta.env.VITE_WP_API_URL ?? "/wp-api";

let authHeader: string | null = null;

export function setAuth(username: string, appPassword: string) {
  authHeader = "Basic " + btoa(`${username}:${appPassword}`);
}

export function getAuth() {
  return authHeader;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface Budget {
  id: number;
  title: string;
  date: string;
  transactions?: Transaction[];
  plans?: Plan[];
  summary?: Summary;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: "income" | "expenses" | "loan";
  title?: string;
  description?: string;
  tags?: Tag[];
}

export interface Plan {
  id: number;
  title: string;
  amount: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Summary {
  total_income: number;
  total_expenses: number;
  total_loans: number;
  net_balance: number;
}

export interface TransactionBody {
  date: string;
  amount: number;
  type: "income" | "expenses" | "loan";
  title?: string;
  description?: string;
  tags?: number[];
}

export interface PlanBody {
  title: string;
  amount: number;
}

export const api = {
  budgets: {
    list: (year?: number) =>
      request<Budget[]>(`/budgets${year ? `?year=${year}` : ""}`),
    get: (id: number) => request<Budget>(`/budgets/${id}`),
    create: (title: string) =>
      request<Budget>("/budgets", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    update: (id: number, data: { transactions?: Transaction[]; plans?: Plan[] }) =>
      request<Budget>(`/budgets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/budgets/${id}`, { method: "DELETE" }),
    summary: (id: number) => request<Summary>(`/budgets/${id}/summary`),
  },

  transactions: {
    list: (budgetId: number, type?: string) =>
      request<Transaction[]>(
        `/budgets/${budgetId}/transactions${type ? `?type=${type}` : ""}`
      ),
    create: (budgetId: number, data: TransactionBody) =>
      request<Transaction>(`/budgets/${budgetId}/transactions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (budgetId: number, tid: number, data: TransactionBody) =>
      request<Transaction>(`/budgets/${budgetId}/transactions/${tid}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (budgetId: number, tid: number) =>
      request<void>(`/budgets/${budgetId}/transactions/${tid}`, {
        method: "DELETE",
      }),
  },

  plans: {
    list: (budgetId: number) =>
      request<Plan[]>(`/budgets/${budgetId}/plans`),
    create: (budgetId: number, data: PlanBody) =>
      request<Plan>(`/budgets/${budgetId}/plans`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (budgetId: number, pid: number, data: PlanBody) =>
      request<Plan>(`/budgets/${budgetId}/plans/${pid}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (budgetId: number, pid: number) =>
      request<void>(`/budgets/${budgetId}/plans/${pid}`, {
        method: "DELETE",
      }),
  },

  tags: {
    list: () => request<Tag[]>("/tags"),
    create: (name: string) =>
      request<Tag>("/tags", { method: "POST", body: JSON.stringify({ name }) }),
    delete: (id: number) =>
      request<void>(`/tags/${id}`, { method: "DELETE" }),
  },
};
