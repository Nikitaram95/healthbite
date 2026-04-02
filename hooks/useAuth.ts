// hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';

interface User {
  id:          string;
  name:        string;
  phone:       string;
  avatar_url?: string;
}

interface AuthState {
  user:     User | null | undefined;  // undefined = ещё загружается, null = не авторизован
  getToken: () => string | null;
  logout:   () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    // Декодируем payload из JWT (без верификации — только для UI)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id:         payload.sub  || payload.id   || 'unknown',
        name:       payload.name || payload.phone || '',
        phone:      payload.phone || '',
        avatar_url: payload.avatar_url,
      });
    } catch {
      setUser(null);
    }
  }, []);

  function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Ищем токен в cookie
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function logout() {
    // Удаляем cookie
    document.cookie = 'token=; Max-Age=0; path=/';
    setUser(null);
  }

  return { user, getToken, logout };
}