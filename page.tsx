'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listPosts, listComments, addComment } from './lib/api';
import type { Post, Comment } from './lib/api';

type User = { phone: string };
type CommentsMap = Record<string, Comment[]>;

const CATEGORIES = [
  { id: 'all',  name: 'Все' },
  { id: 'ai',   name: 'Работа с ИИ' },
  { id: 'food', name: 'Питание' },
  { id: 'mind', name: 'Мышление' },
];

export default function AppPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [authStep, setAuthStep]   = useState<'phone' | 'code'>('phone');
  const [phone, setPhone]         = useState('');
  const [code, setCode]           = useState('');
  const [authError, setAuthError] = useState('');

  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts]                   = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts]     = useState(false);
  const [postsError, setPostsError]         = useState('');

  const [comments, setComments]               = useState<CommentsMap>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment]           = useState<Record<string, string>>({});

  // ── Авторизация ────────────────────────────────────────────────────────
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setAuthStep('code');
    setAuthError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '1234') {
      setUser({ phone });
      setAuthError('');
    } else {
      setAuthError('Неверный код. Попробуй 1234 🙂');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthStep('phone');
    setPhone('');
    setCode('');
    setAuthError('');
  };

  // ── Загрузка постов ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoadingPosts(true);
    setPostsError('');

    listPosts()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime(),
        );
        setPosts(sorted);
      })
      .catch((err) => {
        console.error(err);
        setPostsError('Не удалось загрузить посты');
      })
      .finally(() => setLoadingPosts(false));
  }, [user]);

  const visiblePosts = posts.filter(
    (p) => activeCategory === 'all' || p.categoryid === activeCategory,
  );

  // ── Комментарии ───────────────────────────────────────────────────────
  const loadCommentsForPost = async (postId: string) => {
    if (comments[postId] !== undefined) return;
    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await listComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newComment[postId]?.trim();
    if (!user || !text) return;
    try {
      const created = await addComment(postId, user.phone, text);
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить комментарий');
    }
  };

  // ── Экран логина ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e2dc', padding: 32, width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#28251d' }}>Вход в Healtbite</h1>

          {authStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#7a7974' }}>Номер телефона</label>
              <input
                type="tel"
                placeholder="+7 900 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', fontSize: 15, outline: 'none' }}
              />
              <button type="submit" style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 600, cursor: 'pointer', fontSize: 15, marginTop: 4 }}>
                Получить код (тест)
              </button>
            </form>
          )}

          {authStep === 'code' && (
            <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#7a7974', margin: 0 }}>
                Мы «отправили» код на {phone}. Для входа введи <strong>1234</strong>.
              </p>
              <label style={{ fontSize: 13, color: '#7a7974' }}>Код из SMS</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', fontSize: 15, outline: 'none' }}
              />
              {authError && <p style={{ color: '#a12c7b', fontSize: 13, margin: 0 }}>{authError}</p>}
              <button type="submit" style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 600, cursor: 'pointer', fontSize: 15, marginTop: 4 }}>
                Войти
              </button>
              <button type="button" onClick={() => { setAuthStep('phone'); setCode(''); setAuthError(''); }}
                style={{ background: 'none', border: '1px solid #d4d1ca', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 14, color: '#7a7974' }}>
                Изменить номер
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // ── Основное приложение ───────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'sans-serif' }}>
      {/* Шапка */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e2dc', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#01696f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>Hb</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Healtbite</div>
            <div style={{ fontSize: 11, color: '#7a7974' }}>здоровые привычки и ИИ‑поддержка</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#7a7974' }}>{user.phone}</span>
          <button onClick={handleLogout} style={{ border: '1px solid #d4d1ca', background: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#28251d' }}>
            Выйти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', display: 'flex', gap: 24 }}>
        {/* Сайдбар */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7a7974', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Категории</div>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: 'none', marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, background: activeCategory === cat.id ? '#01696f' : 'transparent', color: activeCategory === cat.id ? '#fff' : '#28251d' }}>
              {cat.name}
            </button>
          ))}
        </aside>

        {/* Лента */}
        <section style={{ flex: 1 }}>
          {loadingPosts && <p style={{ color: '#7a7974', padding: 24 }}>Загружаем посты…</p>}

          {postsError && (
            <div style={{ background: '#fde8f0', color: '#a12c7b', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>{postsError}</div>
          )}

          {!loadingPosts && !postsError && visiblePosts.map((post) => (
            <article key={post.postid} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', overflow: 'hidden', marginBottom: 16 }}>
              {post.mediaurl && post.type === 'image' && (
                <img src={post.mediaurl} alt={post.title} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 16, color: '#28251d', margin: 0, marginBottom: 4 }}>{post.title}</h2>
                    <p style={{ fontSize: 12, color: '#bab9b4', margin: 0 }}>
                      {post.author || 'Healtbite'} · {new Date(post.createdat).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#01696f', background: '#cedcd8', borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    {CATEGORIES.find((c) => c.id === post.categoryid)?.name ?? post.categoryid}
                  </span>
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#28251d', margin: 0, marginBottom: 12 }}>{post.description}</p>

                <Link href={`/post/${post.postid}`} style={{ fontSize: 13, color: '#01696f', textDecoration: 'none', fontWeight: 500 }}>
                  Читать полностью →
                </Link>

                {/* Комментарии */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0ede8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#28251d' }}>Комментарии</span>
                    <button type="button" onClick={() => loadCommentsForPost(post.postid)}
                      style={{ background: 'none', border: '1px solid #d4d1ca', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, color: '#7a7974' }}>
                      Обновить
                    </button>
                  </div>

                  {commentsLoading[post.postid] && <p style={{ fontSize: 13, color: '#7a7974' }}>Загружаем…</p>}

                  {(comments[post.postid] || []).map((c) => (
                    <div key={c.commentid} style={{ background: '#f9f8f5', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#28251d', marginBottom: 2 }}>{c.author}</div>
                      <div style={{ fontSize: 13, color: '#7a7974' }}>{c.text}</div>
                    </div>
                  ))}

                  {!commentsLoading[post.postid] && (!comments[post.postid] || comments[post.postid].length === 0) && (
                    <p style={{ fontSize: 13, color: '#bab9b4' }}>Пока нет комментариев — будь первым.</p>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Добавить комментарий..."
                      value={newComment[post.postid] || ''}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [post.postid]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.postid)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d4d1ca', fontSize: 13, outline: 'none' }}
                    />
                    <button onClick={() => handleAddComment(post.postid)}
                      style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      ↩
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!loadingPosts && !postsError && visiblePosts.length === 0 && (
            <p style={{ color: '#7a7974', padding: 24 }}>В этой категории пока нет постов.</p>
          )}
        </section>
      </div>
    </main>
  );
}