'use client';

import { useEffect, useState } from 'react';
import { listPosts, createPost, Post } from './lib/api';

const CATEGORIES = ['Все', 'Работа с ИИ', 'Питание', 'Мышление'];
const CATEGORY_IDS: Record<string, string> = {
  'Работа с ИИ': 'ai',
  'Питание': 'food',
  'Мышление': 'mind',
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState('Все');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryid: 'ai',
    mediaurl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listPosts().then(setPosts);
  }, []);

  const filtered = category === 'Все'
    ? posts
    : posts.filter(p => p.categoryid === CATEGORY_IDS[category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPost({
        title: form.title,
        description: form.description,
        categoryid: form.categoryid,
        mediaurl: form.mediaurl,
        type: 'post',
        author: 'admin',
      });
      setForm({ title: '', description: '', categoryid: 'ai', mediaurl: '' });
      setShowForm(false);
      const updated = await listPosts();
      setPosts(updated);
    } catch (err) {
      alert('Ошибка при создании поста');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* ШАПКА */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Healtbite</div>
          <div style={{ fontSize: 12, color: '#888' }}>здоровые привычки и ИИ-поддержка</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: '#00897b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {showForm ? '✕ Закрыть' : '+ Новый пост'}
          </button>
        </div>
      </header>

      {/* ФОРМА СОЗДАНИЯ ПОСТА */}
      {showForm && (
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '20px 24px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Новый пост</div>
            <input
              placeholder="Заголовок"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
            />
            <textarea
              placeholder="Текст поста..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14, resize: 'vertical' }}
            />
            <input
              placeholder="Ссылка на картинку (необязательно)"
              value={form.mediaurl}
              onChange={e => setForm({ ...form, mediaurl: e.target.value })}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
            />
            <select
              value={form.categoryid}
              onChange={e => setForm({ ...form, categoryid: e.target.value })}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
            >
              <option value="ai">Работа с ИИ</option>
              <option value="food">Питание</option>
              <option value="mind">Мышление</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#00897b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                alignSelf: 'flex-start',
              }}
            >
              {submitting ? 'Публикую...' : 'Опубликовать'}
            </button>
          </form>
        </div>
      )}

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px', gap: 24 }}>
        {/* КАТЕГОРИИ */}
        <aside style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#888', marginBottom: 12, letterSpacing: 1 }}>КАТЕГОРИИ</div>
          {CATEGORIES.map(cat => (
            <div
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 4,
                backgroundColor: category === cat ? '#00897b' : 'transparent',
                color: category === cat ? '#fff' : '#333',
                fontWeight: category === cat ? 600 : 400,
              }}
            >
              {cat}
            </div>
          ))}
        </aside>

        {/* ПОСТЫ */}
        <main style={{ flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#aaa', marginTop: 40, textAlign: 'center' }}>Постов пока нет</div>
          )}
          {filtered.map(post => (
            <div key={post.postid} style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {post.mediaurl && (
                <img src={post.mediaurl} alt={post.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
              )}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>ПОСТ</span>
                  <span style={{ backgroundColor: '#e0f2f1', color: '#00897b', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                    {Object.entries(CATEGORY_IDS).find(([, v]) => v === post.categoryid)?.[0] ?? post.categoryid}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{post.author} · {post.createdat}</div>
                <div style={{ fontSize: 15, marginBottom: 12 }}>{post.description?.slice(0, 120)}{(post.description?.length ?? 0) > 120 ? '...' : ''}</div>
                <a href={`/post/${post.postid}`} style={{ color: '#00897b', fontSize: 14 }}>Читать полностью →</a>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}