"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getProfile } from "./api";

interface UserContextType {
  user: any | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("lotifyx_access");
    if (!token) { setLoading(false); return; }
    try {
      const data = await getProfile();
      setUser(data.user || data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <UserContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
