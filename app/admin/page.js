'use client';
import { useState, useRef } from 'react';

const API_URL = 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net/upload';

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const toBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !description) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(5);

    try {
      const isVideo = file.type.startsWith('video/');
      let postBody = { action: 'create_post', description };

      if (isVideo) {
        // Шаг 1: получить presigned URL для видео
        setProgress(10);
        const urlRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_video_upload_url',
            filename: file.name,
            fileSize: file.size,
          }),
        });

        if (!urlRes.ok) {
          const d = await urlRes.json().catch(() => ({}));
          throw new Error(d.error || `Ошибка получения URL: ${urlRes.status}`);
        }

        const { uploadUrl, publicUrl } = await urlRes.json();
        setProgress(30);

        // Шаг 2: загрузить видео напрямую в S3 (без лимита 3.5 МБ)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error(`Ошибка загрузки видео: ${uploadRes.status}`);
        setProgress(80);

        postBody.videoPublicUrl = publicUrl;

      } else {
        // Картинка: base64 (обычно < 3 МБ — влезает в лимит)
        setProgress(30);
        const base64 = await toBase64(file);
        setProgress(60);

        postBody.imageBase64 = base64;
        postBody.imageName = file.name;
        postBody.imageMime = file.type;
      }

      // Шаг 3: создать пост
      setProgress(85);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Ошибка сервера: ${res.status}`);

      setProgress(100);
      setResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 32, fontSize: 24, fontWeight: 700 }}>Новый пост</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Видео или картинка
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="video/*,image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%' }}
            required
          />
          {file && (
            <p style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ ·{' '}
              {file.type.startsWith('video/') ? '🎬 Видео' : '🖼️ Картинка'}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Напиши описание поста..."
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, resize: 'vertical' }}
            required
          />
        </div>

        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#01696f', transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ marginTop: 6, fontSize: 13, color: '#666' }}>
              {progress < 30 ? 'Подготовка...' : progress < 80 ? 'Загрузка файла...' : 'Публикация...'}
              {' '}{progress}%
            </p>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, color: '#c00', fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <div style={{ marginBottom: 16, padding: '14px', background: '#f0faf5', border: '1px solid #b3e0cc', borderRadius: 8 }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>✅ Пост опубликован!</p>
            <a href={result.postUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#01696f', wordBreak: 'break-all' }}>
              {result.postUrl}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? '#ccc' : '#01696f',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Публикую...' : 'Опубликовать'}
        </button>
      </form>
    </main>
  );
}