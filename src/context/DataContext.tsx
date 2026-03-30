import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { api, Budget, Summary, Tag, Plan, Account } from "@/lib/api";

type BudgetDetails = {
  budget: Budget;
  summary: Summary;
};

interface DataContextType {
  budgets: Budget[] | null;
  tags: Tag[] | null;
  accounts: Account[] | null;
  budgetDetails: Record<number, BudgetDetails>;
  plans: Record<number, Plan[]>;

  fetchBudgets: (force?: boolean) => Promise<void>;
  fetchTags: (force?: boolean) => Promise<void>;
  fetchAccounts: (force?: boolean) => Promise<void>;
  fetchBudgetDetails: (budgetId: number, force?: boolean) => Promise<void>;
  fetchPlans: (budgetId: number, force?: boolean) => Promise<void>;
  
  // Expose setters or invalidation tools if needed
  invalidateBudgets: () => void;
  invalidateTags: () => void;
  invalidateAccounts: () => void;
  invalidateBudgetDetails: (budgetId: number) => void;
  invalidatePlans: (budgetId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [budgetDetails, setBudgetDetails] = useState<Record<number, BudgetDetails>>({});
  const [plans, setPlans] = useState<Record<number, Plan[]>>({});

  const fetchedBudgets = useRef(false);
  const fetchedTags = useRef(false);
  const fetchedAccounts = useRef(false);
  const fetchedBudgetDetails = useRef<Set<number>>(new Set());
  const fetchedPlans = useRef<Set<number>>(new Set());

  const fetchBudgets = useCallback(async (force = false) => {
    if (!force && fetchedBudgets.current) return;
    fetchedBudgets.current = true; // Mark as fetching/fetched
    try {
      const data = await api.budgets.list();
      setBudgets(data);
    } catch (e) {
      fetchedBudgets.current = false;
      throw e;
    }
  }, []);

  const fetchTags = useCallback(async (force = false) => {
    if (!force && fetchedTags.current) return;
    fetchedTags.current = true;
    try {
      const data = await api.tags.list();
      setTags(data);
    } catch (e) {
      fetchedTags.current = false;
      throw e;
    }
  }, []);

  const fetchAccounts = useCallback(async (force = false) => {
    if (!force && fetchedAccounts.current) return;
    fetchedAccounts.current = true;
    try {
      const data = await api.accounts.list();
      setAccounts(data);
    } catch (e) {
      fetchedAccounts.current = false;
      throw e;
    }
  }, []);

  const fetchBudgetDetails = useCallback(async (budgetId: number, force = false) => {
    if (!force && fetchedBudgetDetails.current.has(budgetId)) return;
    
    // Add to fetching/fetched set
    fetchedBudgetDetails.current.add(budgetId);
    try {
      const [b, s] = await Promise.all([
        api.budgets.get(budgetId),
        api.budgets.summary(budgetId)
      ]);
      setBudgetDetails(prev => ({ ...prev, [budgetId]: { budget: b, summary: s } }));
    } catch (e) {
      fetchedBudgetDetails.current.delete(budgetId);
      throw e;
    }
  }, []);

  const fetchPlans = useCallback(async (budgetId: number, force = false) => {
    if (!force && fetchedPlans.current.has(budgetId)) return;
    
    fetchedPlans.current.add(budgetId);
    try {
      const p = await api.plans.list(budgetId);
      setPlans(prev => ({ ...prev, [budgetId]: p }));
    } catch (e) {
      fetchedPlans.current.delete(budgetId);
      throw e;
    }
  }, []);

  const invalidateBudgets = useCallback(() => {
    fetchedBudgets.current = false;
  }, []);

  const invalidateTags = useCallback(() => {
    fetchedTags.current = false;
  }, []);

  const invalidateAccounts = useCallback(() => {
    fetchedAccounts.current = false;
  }, []);

  const invalidateBudgetDetails = useCallback((budgetId: number) => {
    fetchedBudgetDetails.current.delete(budgetId);
  }, []);

  const invalidatePlans = useCallback((budgetId: number) => {
    fetchedPlans.current.delete(budgetId);
  }, []);


  return (
    <DataContext.Provider value={{
      budgets,
      tags,
      accounts,
      budgetDetails,
      plans,
      fetchBudgets,
      fetchTags,
      fetchAccounts,
      fetchBudgetDetails,
      fetchPlans,
      invalidateBudgets,
      invalidateTags,
      invalidateAccounts,
      invalidateBudgetDetails,
      invalidatePlans,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
