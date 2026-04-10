'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id:         string;
  phone:      string;
  name:       string;
  avatar_url: string;   // ← было avatarurl
  isAdmin:    boolean;
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const token = getCookie('auth-token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = data.user ?? data;
        setUser({
          id:         raw.id         ?? raw.phone ?? '',
          phone:      raw.phone      ?? '',
          name:       raw.name       ?? '',
          avatar_url: raw.avatar_url ?? '',   // ← было raw.avatarurl
          isAdmin:    raw.isAdmin    ?? false,
        });
      })
      .catch(() => {
        deleteCookie('auth-token');
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    deleteCookie('auth-token');
    setUser(null);
    router.push('/login');
  }

  function getToken() {
    return getCookie('auth-token');
  }

  return { user, loading, logout, getToken };
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}