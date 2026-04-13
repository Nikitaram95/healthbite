'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  { id: 'ai',     label: 'AI' },
  { id: 'health', label: 'Здоровье' },
  { id: 'food',   label: 'Питание' },
  { id: 'sport',  label: 'Спорт' },
  { id: 'mental', label: 'Ментальное' },
];

const AUTHORS = [
  { id: 'healthbite', label: 'HealthBite' },
  { id: 'author1',    label: 'Девочка 1' },
  { id: 'author2',    label: 'Девочка 2' },
];

const API = process.env.NEXT_PUBLIC_API_URL || '';

const MAX_IMAGE_MB = 20;
const MAX_VIDEO_MB = 800;

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading, getToken } = useAuth();

  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [category, setCategory] = useState('health');
  const [author, setAuthor]     = useState(AUTHORS[0].label);
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isVideo = file?.type.startsWith('video/');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.isAdmin) router.replace('/feed');
  }, [user, authLoading, router]);

  if (authLoading || !user || !user.isAdmin) {
    return (
      <div style={s.loaderPage}>
        <div style={s.loaderSpinner} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxMb = f.type.startsWith('video/') ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (f.size > maxMb * 1024 * 1024) {
      setError(`Файл слишком большой. Максимум ${maxMb} МБ`);
      return;
    }
    setFile(f);
    setError('');
    setPreview(URL.createObjectURL(f));
  }

  function removeFile() {
    setFile(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Введите заголовок'); return; }
    setError('');
    setLoading(true);

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let mediaurl = '';

      if (file && isVideo) {
        const urlRes = await fetch(`${API}/upload`, {
          method: 'POST', headers,
          body: JSON.stringify({ action: 'getvideouploadurl', filename: file.name }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.error || 'Ошибка получения URL');

        const uploadRes = await fetch(urlData.uploadUrl, {
          method: 'PUT', body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadRes.ok) throw new Error('Ошибка загрузки видео в S3');
        mediaurl = urlData.publicUrl;
      }

      if (file && !isVideo) {
        const b64 = await toBase64(file);
        const imgRes = await fetch(`${API}/upload`, {
          method: 'POST', headers,
          body: JSON.stringify({
            action: 'uploadimage',
            imageBase64: b64,
            imageName: file.name,
            imageMime: file.type,
          }),
        });
        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.error || 'Ошибка загрузки картинки');
        mediaurl = imgData.publicUrl;
      }

      const res = await fetch(`${API}/upload`, {
        method: 'POST', headers,
        body: JSON.stringify({
          action: 'addpost',
          author: author,
          title: title.trim(),
          description: description.trim(),
          categoryid: category,
          mediaurl: mediaurl,
          type: isVideo ? 'video' : (file ? 'image' : 'text'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при публикации');

      router.push(`/post/${data.postid}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.back} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          <h1 style={s.headerTitle}>Новый пост</h1>
          <div style={{ width: 80 }} />
        </div>
      </header>

      <main style={s.main}>
        <form onSubmit={handleSubmit} style={s.form} noValidate>

          {/* Автор */}
          <div style={s.fg}>
            <label style={s.label}>Автор</label>
            <div style={s.catGrid}>
              {AUTHORS.map(a => (
                <button
                  key={a.id}
                  type="button"
                  style={{ ...s.catChip, ...(author === a.label ? s.catChipActive : {}) }}
                  onClick={() => setAuthor(a.label)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Медиафайл */}
          <div style={s.fg}>
            <label style={s.label}>Медиафайл</label>
            {!file ? (
              <button type="button" style={s.dropzone} onClick={() => fileRef.current?.click()}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bab9b4" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span style={s.dzText}>Нажмите чтобы выбрать</span>
                <span style={s.dzHint}>Фото до {MAX_IMAGE_MB} МБ · Видео до {MAX_VIDEO_MB} МБ</span>
              </button>
            ) : (
              <div style={s.previewWrap}>
                {isVideo
                  ? <video src={preview} style={s.previewMedia} controls muted />
                  : <img src={preview} alt="preview" style={s.previewMedia} />}
                <button type="button" style={s.removeBtn} onClick={removeFile} aria-label="Удалить">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
                <span style={s.fileName}>{file.name}</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,video/*"
              style={{ display: 'none' }} onChange={handleFile} />
          </div>

          {/* Заголовок */}
          <div style={s.fg}>
            <label style={s.label} htmlFor="title">
              Заголовок <span style={{ color: '#e05c8a' }}>*</span>
            </label>
            <input id="title" type="text" placeholder="Введите заголовок"
              value={title} onChange={e => setTitle(e.target.value)}
              maxLength={120} style={s.input} />
            <span style={s.counter}>{title.length} / 120</span>
          </div>

          {/* Описание */}
          <div style={s.fg}>
            <label style={s.label} htmlFor="desc">Описание</label>
            <textarea id="desc" placeholder="Расскажите подробнее..."
              value={description} onChange={e => setDesc(e.target.value)}
              maxLength={1000} rows={4} style={s.textarea} />
            <span style={s.counter}>{description.length} / 1000</span>
          </div>

          {/* Категория */}
          <div style={s.fg}>
            <label style={s.label}>Категория</label>
            <div style={s.catGrid}>
              {CATEGORIES.map(c => (
                <button key={c.id} type="button"
                  style={{ ...s.catChip, ...(category === c.id ? s.catChipActive : {}) }}
                  onClick={() => setCategory(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? <><Spinner /> Публикуем...</> : 'Опубликовать'}
          </button>

        </form>
      </main>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:          { minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui,sans-serif' },
  loaderPage:    { minHeight: '100dvh', background: '#f7f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loaderSpinner: { width: 32, height: 32, border: '3px solid #d4d1ca', borderTopColor: '#01696f', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  header:        { background: '#fff', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:   { maxWidth: 640, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back:          { display: 'flex', alignItems: 'center', gap: '.25rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.875rem', color: '#7a7974', width: 80 },
  headerTitle:   { fontSize: '1rem', fontWeight: 700, color: '#28251d' },
  main:          { maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 4rem' },
  form:          { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  fg:            { display: 'flex', flexDirection: 'column', gap: '.375rem' },
  label:         { fontSize: '.875rem', fontWeight: 500, color: '#28251d' },
  dropzone:      { border: '2px dashed #d4d1ca', borderRadius: 12, padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', cursor: 'pointer', background: '#fafaf8', width: '100%' },
  dzText:        { fontSize: '.9375rem', fontWeight: 500, color: '#28251d' },
  dzHint:        { fontSize: '.8125rem', color: '#bab9b4' },
  previewWrap:   { position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#111' },
  previewMedia:  { width: '100%', maxHeight: 320, objectFit: 'cover' as const, display: 'block' },
  removeBtn:     { position: 'absolute', top: '.5rem', right: '.5rem', background: 'rgba(0,0,0,.65)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' },
  fileName:      { position: 'absolute', bottom: '.5rem', left: '.5rem', fontSize: '.75rem', color: '#fff', background: 'rgba(0,0,0,.5)', padding: '.2rem .5rem', borderRadius: 6 },
  input:         { height: 48, padding: '0 .875rem', border: '1.5px solid #d4d1ca', borderRadius: 8, fontSize: '1rem', color: '#28251d', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  textarea:      { padding: '.75rem .875rem', border: '1.5px solid #d4d1ca', borderRadius: 8, fontSize: '.9375rem', color: '#28251d', background: '#fff', outline: 'none', width: '100%', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const, lineHeight: 1.6 },
  counter:       { fontSize: '.75rem', color: '#bab9b4', textAlign: 'right' as const },
  catGrid:       { display: 'flex', flexWrap: 'wrap' as const, gap: '.5rem' },
  catChip:       { padding: '.375rem .875rem', borderRadius: 999, border: '1.5px solid #d4d1ca', background: 'none', fontSize: '.875rem', color: '#7a7974', cursor: 'pointer', fontWeight: 500 },
  catChipActive: { background: '#01696f', borderColor: '#01696f', color: '#fff' },
  error:         { fontSize: '.875rem', color: '#a12c7b', background: '#f9f2f6', padding: '.625rem .875rem', borderRadius: 8 },
  submitBtn:     { height: 52, background: '#01696f', color: '#fff', fontSize: '1rem', fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' },
};