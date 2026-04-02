'use client';
import { useState, useRef } from 'react';

const API_URL = 'https://d5d5nab6rsitmnq0gb0o.i99u1wfk.apigw.yandexcloud.net/upload';

const CATEGORIES = [
  'Новости', 'Спорт', 'Технологии', 'Культура',
  'Образование', 'Развлечения', 'Путешествия', 'Другое',
];

export default function AdminPage() {
  const [file, setFile]               = useState(null);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [categoryid, setCategoryid]   = useState(CATEGORIES[0]);
  const [author, setAuthor]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);
  const fileRef = useRef();

  const toBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategoryid(CATEGORIES[0]);
    setAuthor('');
    setProgress(0);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(5);

    try {
      const isVideo = file.type.startsWith('video/');
      let postBody = {
        action:      'create_post',
        title:       title.trim(),
        description: description.trim(),
        categoryid,
        author:      author.trim() || 'admin',
      };

      if (isVideo) {
        setProgress(10);
        const urlRes = await fetch(API_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action:   'get_video_upload_url',
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

        const uploadRes = await fetch(uploadUrl, {
          method:  'PUT',
          headers: { 'Content-Type': file.type },
          body:    file,
        });

        if (!uploadRes.ok) throw new Error(`Ошибка загрузки видео: ${uploadRes.status}`);
        setProgress(80);

        postBody.videoPublicUrl = publicUrl;

      } else {
        setProgress(30);
        const base64 = await toBase64(file);
        setProgress(60);

        postBody.imageBase64 = base64;
        postBody.imageName   = file.name;
        postBody.imageMime   = file.type;
      }

      setProgress(85);
      const res  = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(postBody),
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
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Новый пост</h1>

        <form onSubmit={handleSubmit} style={s.form}>

          {/* Заголовок */}
          <Field label="Заголовок *">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Заголовок поста"
              maxLength={200}
              required
              style={s.input}
            />
            <span style={s.counter}>{title.length}/200</span>
          </Field>

          {/* Категория */}
          <Field label="Категория">
            <select
              value={categoryid}
              onChange={e => setCategoryid(e.target.value)}
              style={s.select}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          {/* Автор */}
          <Field label="Автор">
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="admin"
              maxLength={80}
              style={s.input}
            />
          </Field>

          {/* Описание */}
          <Field label="Описание">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Текст поста..."
              maxLength={2000}
              style={{ ...s.input, resize: 'vertical', padding: '10px 12px' }}
            />
            <span style={s.counter}>{description.length}/2000</span>
          </Field>

          {/* Файл */}
          <Field label="Видео или картинка *">
            <div
              style={s.dropzone}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div style={s.fileInfo}>
                  <span style={s.fileIcon}>
                    {file.type.startsWith('video/') ? '🎬' : '🖼️'}
                  </span>
                  <div>
                    <p style={s.fileName}>{file.name}</p>
                    <p style={s.fileMeta}>
                      {(file.size / 1024 / 1024).toFixed(1)} МБ · {file.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={s.removeFile}
                    onClick={e => { e.stopPropagation(); setFile(null); fileRef.current.value = ''; }}
                    aria-label="Удалить файл"
                  >✕</button>
                </div>
              ) : (
                <div style={s.dropzonePlaceholder}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bab9b4" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ color: '#bab9b4', fontSize: 14 }}>
                    Нажмите или перетащите файл
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*,image/*"
              onChange={e => setFile(e.target.files[0] || null)}
              style={{ display: 'none' }}
              required={!file}
            />
          </Field>

          {/* Прогресс */}
          {loading && (
            <div style={s.progressWrap}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${progress}%` }} />
              </div>
              <p style={s.progressLabel}>
                {progress < 30 ? 'Подготовка...' : progress < 80 ? 'Загрузка файла...' : 'Публикация...'}
                {' '}{progress}%
              </p>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div style={s.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Успех */}
          {result && (
            <div style={s.successBox}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>✅ Пост опубликован!</p>
              {result.postUrl && (
                <a href={result.postUrl} target="_blank" rel="noopener noreferrer" style={s.resultLink}>
                  {result.postUrl}
                </a>
              )}
              <button type="button" style={s.newPostBtn} onClick={reset}>
                + Новый пост
              </button>
            </div>
          )}

          {!result && (
            <button type="submit" disabled={loading} style={{ ...s.submitBtn, background: loading ? '#ccc' : '#01696f' }}>
              {loading ? 'Публикую...' : 'Опубликовать'}
            </button>
          )}

        </form>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: '#28251d' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page:             { minHeight: '100dvh', background: '#f7f6f2', padding: '40px 16px', fontFamily: 'system-ui,sans-serif' },
  card:             { maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,.06)' },
  heading:          { fontSize: 22, fontWeight: 800, color: '#28251d', marginBottom: 24 },
  form:             { display: 'flex', flexDirection: 'column', gap: 18 },
  input:            { height: 44, padding: '0 12px', border: '1.5px solid #e8e6e1', borderRadius: 8, fontSize: 15, color: '#28251d', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  select:           { height: 44, padding: '0 12px', border: '1.5px solid #e8e6e1', borderRadius: 8, fontSize: 15, color: '#28251d', outline: 'none', width: '100%', background: '#fff', cursor: 'pointer' },
  counter:          { fontSize: 12, color: '#bab9b4', textAlign: 'right' },
  dropzone:         { border: '1.5px dashed #d4d1ca', borderRadius: 10, padding: '1rem', cursor: 'pointer', transition: 'border-color .18s', minHeight: 80, display: 'flex', alignItems: 'center' },
  dropzonePlaceholder:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' },
  fileInfo:         { display: 'flex', alignItems: 'center', gap: 12, width: '100%' },
  fileIcon:         { fontSize: 28, flexShrink: 0 },
  fileName:         { fontSize: 14, fontWeight: 600, color: '#28251d', wordBreak: 'break-all' },
  fileMeta:         { fontSize: 12, color: '#bab9b4', marginTop: 2 },
  removeFile:       { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#bab9b4', flexShrink: 0 },
  progressWrap:     { display: 'flex', flexDirection: 'column', gap: 6 },
  progressBar:      { height: 5, background: '#f0f0ed', borderRadius: 4, overflow: 'hidden' },
  progressFill:     { height: '100%', background: '#01696f', transition: 'width .4s ease', borderRadius: 4 },
  progressLabel:    { fontSize: 13, color: '#7a7974' },
  errorBox:         { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff5f7', border: '1px solid #fcc', borderRadius: 8, color: '#a12c7b', fontSize: 14 },
  successBox:       { padding: 16, background: '#f0faf5', border: '1px solid #b3e0cc', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  resultLink:       { color: '#01696f', wordBreak: 'break-all', fontSize: 13 },
  newPostBtn:       { background: 'none', border: '1.5px solid #01696f', color: '#01696f', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
  submitBtn:        { height: 48, border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'background .18s' },
};