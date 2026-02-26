"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useUser } from "@clerk/nextjs";

interface CreditsContextValue {
  credits: number | null;
  refreshCredits: () => Promise<void>;
  deductCredit: () => void;
}

const CreditsContext = createContext<CreditsContextValue>({
  credits: null,
  refreshCredits: async () => {},
  deductCredit: () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const [credits, setCredits] = useState<number | null>(null);

  const refreshCredits = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/credits/balance");
      const data = await res.json();
      setCredits(data.credits ?? 0);
    } catch {
      // silently fail
    }
  }, [isSignedIn]);

  // Optimistic deduction — instantly shows -1 without waiting for API
  const deductCredit = useCallback(() => {
    setCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
  }, []);

  // Fetch on mount and when sign-in state changes
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  return (
    <CreditsContext.Provider value={{ credits, refreshCredits, deductCredit }}>
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => useContext(CreditsContext);
