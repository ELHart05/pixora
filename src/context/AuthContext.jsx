import { createContext, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '../lib/trpc';

const AuthContext = createContext(null);
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function buildAuthUrl(provider) {
  const url = new URL(`${API_BASE_URL}/api/auth/${provider}`, window.location.origin);
  url.searchParams.set('redirect', window.location.origin);
  return url.toString();
}

export function AuthProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const utils = trpc.useUtils();

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      utils.user.me.invalidate();
      utils.canvas.myList.invalidate();
      utils.canvas.sharedWithMe.invalidate();
      utils.canvas.feed.invalidate();
    },
  });

  // After OAuth redirect, clear the ?auth=success param and refresh user
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'success') {
      utils.auth.me.invalidate();
      setSearchParams({}, { replace: true });
    } else if (authParam === 'error') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function signInWithGitHub() {
    window.location.href = buildAuthUrl('github');
  }

  function signInWithGoogle() {
    window.location.href = buildAuthUrl('google');
  }

  function signOut() {
    logoutMutation.mutate();
  }

  return (
    <AuthContext.Provider
      value={{ user: user ?? null, isLoading, signInWithGitHub, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** @returns {{ user: object|null, isLoading: boolean, signInWithGitHub: ()=>void, signInWithGoogle: ()=>void, signOut: ()=>void }} */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
