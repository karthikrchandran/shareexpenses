import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const redirectToLogin = () => {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
    };

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        redirectToLogin();
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        redirectToLogin();
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  return { user, loading };
}

export async function logout() {
  await supabase.auth.signOut();
}
