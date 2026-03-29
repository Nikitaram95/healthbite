'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPost, listComments, addComment } from '../../lib/api';
import type { Post, Comment } from '../../lib/api';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getPost(id).then(setPost).catch(() => null),
      listComments(id).then(setComments).catch(() => []),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSending(true);
    try {
      const newComment = await addComment(id, 'Аноним', commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch {
      alert('Не удалось отправить комментарий');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7a7974', fontFamily: 'sans-serif' }}>
      Загрузка...
    </div>
  );

  if (!post) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#7a7974', marginBottom: 16 }}>Пост не найден</p>
      <button onClick={() => router.back()} style={{ background: '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
        ← Назад
      </button>
    </div>
  );

  const s = { fontFamily: 'sans-serif' };

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#f5f4f0' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e2dc', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#7a7974', lineHeight: 1 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#01696f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>Hb</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Healtbite</div>
            <div style={{ fontSize: 11, color: '#7a7974' }}>здоровые привычки и ИИ-поддержка</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
        {/* Пост */}
        <article style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', overflow: 'hidden', marginBottom: 24 }}>
          {post.mediaurl && post.type === 'image' && (
            <img src={post.mediaurl} alt={post.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#01696f', background: '#cedcd8', borderRadius: 4, padding: '2px 8px' }}>
                {post.categoryid}
              </span>
              <span style={{ fontSize: 12, color: '#bab9b4' }}>
                {post.createdat ? new Date(post.createdat).toLocaleDateString('ru-RU') : ''}
              </span>
            </div>
            {post.title && <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#28251d', lineHeight: 1.3 }}>{post.title}</h1>}
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#28251d', margin: 0 }}>{post.description}</p>
            <div style={{ marginTop: 16, fontSize: 13, color: '#bab9b4' }}>
              Автор: {post.author || 'Healtbite'} · {comments.length} комментариев
            </div>
          </div>
        </article>

        {/* Форма комментария */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e2dc', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#28251d' }}>Написать комментарий</h2>
          <form onSubmit={handleComment}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Ваш комментарий..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d4d1ca', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'sans-serif' }}
            />
            <button
              type="submit"
              disabled={sending || !commentText.trim()}
              style={{ background: sending ? '#ccc' : '#01696f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontSize: 14 }}
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </div>

        {/* Список комментариев */}
        {comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#28251d', margin: 0, marginBottom: 4 }}>Комментарии ({comments.length})</h2>
            {comments.map(c => (
              <div key={c.commentid} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e2dc', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#28251d' }}>{c.author}</span>
                  <span style={{ fontSize: 12, color: '#bab9b4' }}>{c.createdat ? new Date(c.createdat).toLocaleDateString('ru-RU') : ''}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#7a7974', margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#bab9b4', padding: '24px 0', fontSize: 14 }}>
            Будьте первым, кто оставит комментарий 💬
          </div>
        )}
      </div>
    </div>
  );
}