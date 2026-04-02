'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id:         string;
  phone:      string;
  name:       string;
  avatar_url: string;
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const token = getCookie('token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data))
      .catch(() => deleteCookie('token'))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    deleteCookie('token');
    setUser(null);
    router.push('/login');
  }

  function getToken() {
    return getCookie('token');
  }

  return { user, loading, logout, getToken };
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}