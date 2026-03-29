'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net';

const CATEGORIES = [
  { id: null, label: 'Все' },
  { id: 'ai', label: 'Работа с ИИ' },
  { id: 'nutrition', label: 'Питание' },
  { id: 'mindset', label: 'Мышление' },
];

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', categoryid: 'ai' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory]);

  async function fetchPosts(category) {
    setLoading(true);
    setError(null);
    try {
      const url = category
        ? `${API_URL}/posts?category=${category}`
        : `${API_URL}/posts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      setError('Не удалось загрузить посты');
    } finally {
      setLoading(false);
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      let imageBase64 = null;
      let imageName = null;
      let imageMime = null;

      if (selectedFile) {
        imageBase64 = await readFileAsBase64(selectedFile);
        imageName = selectedFile.name;
        imageMime = selectedFile.type;
      }

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createpost',
          title: form.title,
          description: form.description,
          categoryid: form.categoryid,
          author: 'admin',
          imageBase64,
          imageName,
          imageMime,
        }),
      });

      if (!res.ok) throw new Error('Ошибка создания поста');
      setSuccessMsg('Пост успешно создан!');
      setForm({ title: '', description: '', categoryid: 'ai' });
      setSelectedFile(null);
      setShowForm(false);
      fetchPosts(activeCategory);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'sans-serif' }}>
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e2dc',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#01696f', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15,
          }}>Hb</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Healtbite</div>
            <div style={{ fontSize: 12, color: '#7a7974' }}>здоровые привычки и ИИ-поддержка</div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#01696f', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontWeight: 600,
            cursor: 'pointer', fontSize: 14,
          }}
        >
          {showForm ? 'Закрыть' : '+ Новый пост'}
        </button>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', display: 'flex', gap: 24 }}>
        <aside style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7a7974', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            Категории
          </div>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px', borderRadius: 8, border: 'none',
              marginBottom: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: activeCategory === cat.id ? '#01696f' : 'transparent',
              color: activeCategory === cat.id ? '#fff' : '#28251d',
            }}>
              {cat.label}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1 }}>
          {showForm && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e5e2dc' }}>
              <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Новый пост</h2>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#7a7974' }}>Заголовок</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', marginBottom: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Название поста" />

                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#7a7974' }}>Описание</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', marginBottom: 12, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Текст поста" />

                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#7a7974' }}>Категория</label>
                <select value={form.categoryid} onChange={(e) => setForm({ ...form, categoryid: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', marginBottom: 12, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                  <option value="ai">Работа с ИИ</option>
                  <option value="nutrition">Питание</option>
                  <option value="mindset">Мышление</option>
                </select>

                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#7a7974' }}>Изображение (опционально)</label>
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ marginBottom: 16, fontSize: 14 }} />

                {successMsg && <div style={{ color: '#01696f', marginBottom: 12, fontSize: 14 }}>{successMsg}</div>}
                {error && <div style={{ color: '#a12c7b', marginBottom: 12, fontSize: 14 }}>{error}</div>}

                <button type="submit" disabled={submitting} style={{
                  background: submitting ? '#ccc' : '#01696f', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14,
                }}>
                  {submitting ? 'Публикация...' : 'Опубликовать'}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ color: '#7a7974', padding: 24 }}>Загрузка...</div>
          ) : error && !showForm ? (
            <div style={{ background: '#fde8f0', color: '#a12c7b', borderRadius: 8, padding: '14px 18px', fontSize: 14 }}>{error}</div>
          ) : posts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#7a7974', border: '1px solid #e5e2dc' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Постов пока нет</div>
              <div style={{ fontSize: 14 }}>Создайте первый пост, нажав кнопку выше</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map((post) => (
                <div key={post.postid} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', overflow: 'hidden' }}>
                  {post.mediaurl && post.type === 'image' && (
                    <img src={post.mediaurl} alt={post.title} style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#01696f', background: '#cedcd8', borderRadius: 4, padding: '2px 8px' }}>{post.categoryid}</span>
                      <span style={{ fontSize: 12, color: '#bab9b4' }}>{post.createdat ? new Date(post.createdat).toLocaleDateString('ru-RU') : ''}</span>
                    </div>
                    {post.title && <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#28251d' }}>{post.title}</h3>}
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: '#7a7974', margin: 0 }}>{post.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}