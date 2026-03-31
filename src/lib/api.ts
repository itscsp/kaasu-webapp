const BASE_URL = import.meta.env.VITE_WP_API_URL ?? "/wp-api";

let authHeader: string | null = null;

/** Registered by App.tsx — called whenever the server returns rest_not_logged_in */
let sessionExpiredCallback: (() => void) | null = null;

export function onSessionExpired(cb: () => void) {
  sessionExpiredCallback = cb;
}

export function setAuth(token: string) {
  authHeader = "Bearer " + token;
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
    let errorMessage = `API error ${res.status}: ${text}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        errorMessage = parsed.message;
      }
      if (parsed.code === "rest_not_logged_in" || res.status === 401) {
        sessionExpiredCallback?.();
      }
    } catch {
      // Ignore if not JSON
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export interface Budget {
  id: number;
  title: string;
  author: number;
  date: string;
  transactions?: Transaction[];
  plans?: Plan[];
  summary?: Summary;
}

export interface Account {
  id: number;
  name: string;
  group: "Cash" | "Accounts" | "Investment" | "Loan" | "Insurance" | "Saving";
  balance?: number;
  amount?: number;
  description?: string;
  is_connected?: boolean;
  transaction_count?: number;
}

export interface Transaction {
  id: string; // UUID
  date: string;
  amount: number;
  type: "income" | "expenses" | "transfer";
  title?: string;
  notes?: string;
  tags?: number[];        // array of tag IDs
  tag_objects?: Tag[];   // full tag details
  account_id?: number;
  to_account_id?: number;
}

export interface Plan {
  id: number;
  title: string;
  amount: number;
  status?: "DONE" | "PENDING";
}

export interface Tag {
  id: number;
  name: string;
  slug?: string;
}

export interface Summary {
  budget_id?: number;
  month?: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  accounts: Account[];
}

export interface TransactionBody {
  date: string;
  amount: number;
  type: "income" | "expenses" | "transfer";
  title?: string;
  notes?: string;
  tags?: number[]; // array of tag IDs to attach
  account_id?: number;
  to_account_id?: number;
}

export interface AccountBody {
  name: string;
  group: "Cash" | "Accounts" | "Investment" | "Loan" | "Insurance" | "Saving";
  amount: number;
  description?: string;
}

export interface PlanBody {
  title: string;
  amount: number;
  status?: "DONE" | "PENDING";
}

export interface RegisterBody {
  phone: string;
  name: string;
  email: string;
}

export const api = {
  auth: {
    googleSignIn: (token: string) =>
      request<{ success: boolean; user: { name: string; email: string } }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  },

  accounts: {
    list: () => request<Account[]>("/accounts"),
    get: (id: number) => request<Account>(`/accounts/${id}`),
    create: (data: AccountBody) =>
      request<Account>("/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<AccountBody>) =>
      request<Account>(`/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/accounts/${id}`, { method: "DELETE" }),
    transactions: (id: number) =>
      request<Transaction[]>(`/accounts/${id}/transactions`),
  },

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
    update: (id: number, data: { name?: string }) =>
      request<Tag>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/tags/${id}`, { method: "DELETE" }),
  },
};
