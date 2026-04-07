'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, MoreHorizontal, Search } from 'lucide-react';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Post {
  postid: string;
  author: string;
  categoryid: string;
  description: string;
  mediaurl: string;
  title: string;
  type: string;
  createdat: string; // строка миллисекунд, например "1712498580000"
  likes: number;
  liked: boolean;
}

// ─── Категории ───────────────────────────────────────────────────────────────

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all',       label: 'Все'          },
  { key: 'food',      label: 'Питание'      },
  { key: 'mental',    label: 'Ментальное'   },
  { key: 'sport',     label: 'Спорт'        },
  { key: 'health',    label: 'Здоровье'     },
  { key: 'lifestyle', label: 'Образ жизни'  },
];

function getCategoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

// ─── Относительная дата ──────────────────────────────────────────────────────

function getRelativeTime(createdat: string): string {
  if (!createdat) return '';
  const ms = Number(createdat);
  if (!ms || isNaN(ms)) return '';
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1)   return '1 д назад';
  if (days < 7)     return `${days} д назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)    return `${weeks} нед назад`;
  const months = Math.floor(days / 30);
  if (months < 12)  return `${months} мес назад`;
  return `${Math.floor(months / 12)} г назад`;
}

// ─── Заглушка аватара ────────────────────────────────────────────────────────

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const colors = [
    '#01696f','#437a22','#006494','#7a39bb',
    '#d19900','#da7101','#a12c7b','#a13544',
  ];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        flexShrink: 0,
      }}
      aria-label={name}
    >
      {initials || '?'}
    </div>
  );
}

// ─── Карточка поста ──────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  onLike: (postid: string, liked: boolean) => void;
  onOpenComments: (postid: string) => void;
}

function PostCard({ post, onLike, onOpenComments }: PostCardProps) {
  const [imgError, setImgError] = useState(false);
  const relTime = getRelativeTime(post.createdat);
  const catLabel = getCategoryLabel(post.categoryid);

  return (
    <article
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid oklch(from var(--color-text) l c h / 0.08)',
      }}
    >
      {/* Медиа */}
      {post.mediaurl && !imgError ? (
        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--color-surface-offset)' }}>
          {post.type === 'video' ? (
            <video
              src={post.mediaurl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
              controls
            />
          ) : (
            <Image
              src={post.mediaurl}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, 600px"
            />
          )}
        </div>
      ) : null}

      {/* Тело карточки */}
      <div style={{ padding: '16px' }}>

        {/* Шапка: автор + дата + меню */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AuthorAvatar name={post.author} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--color-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {post.author}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {/* Категория */}
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  background: 'var(--color-primary-highlight)',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 8px',
                }}
              >
                {catLabel}
              </span>
              {/* Относительное время */}
              {relTime && (
                <>
                  <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>·</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {relTime}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            aria-label="Опции поста"
            style={{ color: 'var(--color-text-muted)', padding: 4 }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Заголовок */}
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {post.title}
        </h2>

        {/* Описание */}
        {post.description && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 1.55,
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.description}
          </p>
        )}

        {/* Действия: лайк + комментарий */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingTop: 10,
            borderTop: '1px solid oklch(from var(--color-text) l c h / 0.07)',
          }}
        >
          <button
            onClick={() => onLike(post.postid, post.liked)}
            aria-label={post.liked ? 'Убрать лайк' : 'Поставить лайк'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: post.liked ? 'var(--color-notification)' : 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: '6px 0',
              transition: 'color 180ms ease',
            }}
          >
            <Heart
              size={18}
              fill={post.liked ? 'currentColor' : 'none'}
              strokeWidth={post.liked ? 0 : 2}
            />
            <span>{post.likes}</span>
          </button>

          <button
            onClick={() => onOpenComments(post.postid)}
            aria-label="Комментарии"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: '6px 0',
            }}
          >
            <MessageCircle size={18} />
            <span>Комментарии</span>
          </button>
        </div>

      </div>
    </article>
  );
}

// ─── Скелетон загрузки ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid oklch(from var(--color-text) l c h / 0.08)',
      }}
    >
      <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%' }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 6 }} />
            <div className="skeleton skeleton-text" style={{ width: '25%', height: '0.75em' }} />
          </div>
        </div>
        <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '100%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

async function fetchPosts(category: string, userId: string): Promise<Post[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (userId) params.set('userId', userId);
  const url = `${API}/posts${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ошибка загрузки');
  return res.json();
}

async function toggleLike(
  postid: string,
  userId: string,
  isLiked: boolean
): Promise<{ likes: number; liked: boolean }> {
  const action = isLiked ? 'unlikepost' : 'likepost';
  const res = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, postId: postid, userId }),
  });
  if (!res.ok) throw new Error('Ошибка лайка');
  return res.json();
}

// ─── Главный экран ───────────────────────────────────────────────────────────

interface FeedScreenProps {
  userId?: string;
  onOpenComments?: (postid: string) => void;
}

export default function FeedScreen({ userId = '', onOpenComments }: FeedScreenProps) {
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [likePending, setLikePending]       = useState<Set<string>>(new Set());

  // ─── Загрузка постов ───────────────────────────────────────────────────────

  const loadPosts = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts(category, userId);
      // Сортировка по дате: новые сверху
      data.sort((a, b) => {
        const ta = Number(a.createdat) || 0;
        const tb = Number(b.createdat) || 0;
        return tb - ta;
      });
      setPosts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPosts(activeCategory);
  }, [activeCategory, loadPosts]);

  // ─── Лайк ─────────────────────────────────────────────────────────────────

  const handleLike = useCallback(async (postid: string, currentLiked: boolean) => {
    if (!userId) return;
    if (likePending.has(postid)) return; // защита от двойного клика

    // Оптимистичное обновление
    setPosts((prev) =>
      prev.map((p) =>
        p.postid === postid
          ? { ...p, liked: !currentLiked, likes: currentLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    setLikePending((s) => new Set(s).add(postid));

    try {
      const result = await toggleLike(postid, userId, currentLiked);
      // Синхронизируем с сервером
      setPosts((prev) =>
        prev.map((p) =>
          p.postid === postid ? { ...p, likes: result.likes, liked: result.liked } : p
        )
      );
    } catch {
      // Откат при ошибке
      setPosts((prev) =>
        prev.map((p) =>
          p.postid === postid
            ? { ...p, liked: currentLiked, likes: currentLiked ? p.likes + 1 : p.likes - 1 }
            : p
        )
      );
    } finally {
      setLikePending((s) => {
        const next = new Set(s);
        next.delete(postid);
        return next;
      });
    }
  }, [userId, likePending]);

  // ─── Фильтрация по поиску ──────────────────────────────────────────────────

  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  // ─── Рендер ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>

      {/* Шапка */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'oklch(from var(--color-bg) l c h / 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid oklch(from var(--color-text) l c h / 0.07)',
          padding: '12px 16px 0',
        }}
      >
        {/* Строка поиска */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface-offset)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 14px',
            marginBottom: 12,
          }}
        >
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Поиск по постам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Очистить поиск"
              style={{ color: 'var(--color-text-muted)', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Горизонтальный скролл категорий */}
        <div
          role="tablist"
          aria-label="Категории"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 12,
            scrollbarWidth: 'none',
          }}
        >
          {CATEGORIES.map(({ key, label }) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(key)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--color-text-muted)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-offset)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 180ms ease, color 180ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Контент */}
      <main style={{ padding: '16px', maxWidth: 640, margin: '0 auto' }}>

        {/* Загрузка */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Ошибка */}
        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--color-text-muted)',
            }}
          >
            <p style={{ marginBottom: 12, color: 'var(--color-error)' }}>{error}</p>
            <button
              onClick={() => loadPosts(activeCategory)}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Пусто */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 16px',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
              {searchQuery ? 'Ничего не найдено' : 'Пока нет публикаций'}
            </p>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              {searchQuery
                ? 'Попробуйте другой запрос'
                : 'Будьте первым, кто поделится'}
            </p>
          </div>
        )}

        {/* Посты */}
        {!loading && !error && filteredPosts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredPosts.map((post) => (
              <PostCard
                key={post.postid}
                post={post}
                onLike={handleLike}
                onOpenComments={onOpenComments ?? (() => {})}
              />
            ))}
          </div>
        )}

      </main>

      {/* Скелетон-стили */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--color-surface-offset) 25%,
            var(--color-surface-dynamic) 50%,
            var(--color-surface-offset) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: var(--radius-sm);
        }
        .skeleton-text   { height: 1em; margin-bottom: var(--space-2); }
        .skeleton-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
