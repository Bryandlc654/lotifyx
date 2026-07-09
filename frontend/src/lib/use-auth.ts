"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./user-context";

export function useAuth() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  return { user, loading, isAuthenticated: !!user };
}
