'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPost, listComments, addComment, Post, Comment } from '../../lib/api';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPost(id).then(setPost);
    listComments(id).then(setComments);
  }, [id]);

  async function handleSend() {
    if (!commentText.trim() || !id) return;
    setSending(true);
    try {
      await addComment(id, 'Аноним', commentText);
      setCommentText('');
      const updated = await listComments(id);
      setComments(updated);
    } catch {
      alert('Не удалось отправить комментарий');
    } finally {
      setSending(false);
    }
  }

  if (!post) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#aaa' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
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
        <a href="/" style={{ color: '#00897b', fontSize: 14, textDecoration: 'none' }}>← Назад</a>
      </header>

      {/* КОНТЕНТ */}
      <div style={{ maxWidth: 750, margin: '0 auto', padding: '32px 16px' }}>
        {/* КАРТИНКА */}
        {post.mediaurl && (
          <img
            src={post.mediaurl}
            alt={post.title}
            style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }}
          />
        )}

        {/* ПОСТ */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>ПОСТ</span>
            <span style={{ backgroundColor: '#e0f2f1', color: '#00897b', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {post.categoryid}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>{post.author} · {post.createdat}</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{post.title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333' }}>{post.description}</p>
        </div>

        {/* КОММЕНТАРИИ */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Комментарии</span>
            <button
              onClick={() => listComments(id).then(setComments)}
              style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}
            >
              Обновить
            </button>
          </div>

          {comments.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>Пока нет комментариев — будь первым.</div>
          ) : (
            comments.map(c => (
              <div key={c.commentid} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{c.author} · {c.createdat}</div>
                <div style={{ fontSize: 14, color: '#333' }}>{c.text}</div>
              </div>
            ))
          )}

          {/* ФОРМА КОММЕНТАРИЯ */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Добавить комментарий..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}
            />
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                backgroundColor: '#00897b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: 18,
              }}
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}