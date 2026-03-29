'use client';

import { useEffect, useState } from 'react';
import { listPosts, listComments, addComment, Post, Comment } from '../lib/api';

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
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError]     = useState('');

  const [comments, setComments]             = useState<CommentsMap>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment]         = useState<Record<string, string>>({});

  // ── Авторизация ──────────────────────────────────────────────────────────

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

  // ── Загрузка постов ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    setLoadingPosts(true);
    setPostsError('');

    listPosts()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => Number(b.createdat) - Number(a.createdat),
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

  // ── Комментарии ───────────────────────────────────────────────────────────

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
      await addComment(postId, user.phone, text);
      setComments((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          {
            postid:    postId,
            commentid: `c-${Date.now()}`,
            author:    user.phone,
            text,
            createdat: Date.now(),
          },
        ],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить комментарий');
    }
  };

  // ── Экран логина ─────────────────────────────────────────────────────────

  if (!user) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-card__title">Вход в Healtbite</h1>

          {authStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="form-group">
              <label className="form-label" htmlFor="phone">Номер телефона</label>
              <input
                id="phone"
                type="tel"
                placeholder="+7 900 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                required
              />
              <button type="submit" className="btn btn-primary btn-full">
                Получить код (тест)
              </button>
            </form>
          )}

          {authStep === 'code' && (
            <form onSubmit={handleCodeSubmit} className="form-group">
              <p className="auth-card__hint">
                Мы «отправили» код на {phone}. Для входа введи{' '}
                <strong>1234</strong>.
              </p>
              <label className="form-label" htmlFor="code">Код из SMS</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input"
                required
              />
              {authError && (
                <p className="alert-error">{authError}</p>
              )}
              <button type="submit" className="btn btn-primary btn-full">
                Войти
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-full"
                onClick={() => { setAuthStep('phone'); setCode(''); setAuthError(''); }}
              >
                Изменить номер телефона
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // ── Основное приложение ───────────────────────────────────────────────────

  return (
    <main>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-logo">
            <div className="app-logo__mark">Hb</div>
            <div>
              <div className="app-logo__name">Healtbite</div>
              <div className="app-logo__sub">здоровые привычки и ИИ‑поддержка</div>
            </div>
          </div>
          <div className="header-user">
            <span className="header-user__phone">{user.phone}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Боковая панель */}
        <aside>
          <nav className="sidebar">
            <div className="sidebar__title">Категории</div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`cat-btn${activeCategory === cat.id ? ' active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Лента постов */}
        <section className="feed">
          {loadingPosts && (
            <p className="feed__empty">Загружаем посты…</p>
          )}

          {postsError && (
            <p className="alert-error">{postsError}</p>
          )}

          {!loadingPosts && !postsError && visiblePosts.map((post) => (
            <article key={post.postid} className="post-card">
              <header className="post-card__header">
                <div>
                  <h2 className="post-card__title">{post.title}</h2>
                  <p className="post-card__meta">
                    {post.author || 'Healtbite'} ·{' '}
                    {new Date(Number(post.createdat)).toLocaleString('ru-RU')}
                  </p>
                </div>
                <span className="post-card__badge">
                  {CATEGORIES.find((c) => c.id === post.categoryid)?.name ?? 'Без категории'}
                </span>
              </header>

              <p className="post-card__body">{post.description}</p>

              {/* Комментарии */}
              <div className="comments">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="comments__title">Комментарии</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => loadCommentsForPost(post.postid)}
                  >
                    Обновить
                  </button>
                </div>

                {commentsLoading[post.postid] && (
                  <p className="comments__empty">Загружаем комментарии…</p>
                )}

                {(comments[post.postid] || []).map((c) => (
                  <div key={c.commentid} className="comment">
                    <div className="comment__author">{c.author}</div>
                    <div className="comment__text">{c.text}</div>
                  </div>
                ))}

                {!commentsLoading[post.postid] &&
                  (!comments[post.postid] || comments[post.postid].length === 0) && (
                  <p className="comments__empty">Пока нет комментариев — будь первым.</p>
                )}

                <div className="comment-form">
                  <input
                    type="text"
                    placeholder="Добавить комментарий..."
                    value={newComment[post.postid] || ''}
                    onChange={(e) =>
                      setNewComment((prev) => ({ ...prev, [post.postid]: e.target.value }))
                    }
                    className="input"
                  />
                  <button
                    onClick={() => handleAddComment(post.postid)}
                    className="btn btn-primary btn-sm"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!loadingPosts && !postsError && visiblePosts.length === 0 && (
            <p className="feed__empty">В этой категории пока нет постов.</p>
          )}
        </section>
      </div>
    </main>
  );
}