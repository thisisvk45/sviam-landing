"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type ForkPath = "seeker" | "hirer" | null;

interface ForkContextValue {
  path: ForkPath;
  setPath: (path: ForkPath) => void;
}

const ForkContext = createContext<ForkContextValue>({
  path: null,
  setPath: () => {},
});

export function useFork() {
  return useContext(ForkContext);
}

export function ForkProvider({ children }: { children: ReactNode }) {
  const [path, setPathState] = useState<ForkPath>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("sviam-fork");
      if (saved === "seeker" || saved === "hirer") {
        setPathState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setPath = (p: ForkPath) => {
    setPathState(p);
    try {
      if (p) {
        sessionStorage.setItem("sviam-fork", p);
      } else {
        sessionStorage.removeItem("sviam-fork");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ForkContext.Provider value={{ path, setPath }}>
      {children}
    </ForkContext.Provider>
  );
}
