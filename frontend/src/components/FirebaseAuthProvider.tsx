"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const authProvider = typeof window !== 'undefined' ? localStorage.getItem("auth_provider") : null;
      
      if (!firebaseUser && authProvider === "firebase") {
        // Not logged in via Firebase, but they used Firebase to log in
        // Clear local session if we are on a protected route
        if (pathname && !pathname.startsWith('/login') && pathname !== '/' && !pathname.startsWith('/api')) {
           localStorage.removeItem("auth_provider");
           router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return <>{children}</>;
}
