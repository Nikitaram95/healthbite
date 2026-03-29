'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { listPosts, listComments, addComment, likePost, Post, Comment } from '../../lib/api';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    listPosts()
      .then(posts => {
        const found = posts.find(p => p.postid === id);
        if (found) {
          setPost(found);
          setLikes(found.likes ?? 0);
        }
      })
      .finally(() => setLoading(false));

    listComments(id).then(setComments).catch(() => {});

    const savedLiked = localStorage.getItem(`liked_${id}`);
    setLiked(savedLiked === 'true');
  }, [id]);

  async function handleLike() {
    if (liked || !id) return;
    try {
      const res = await likePost(id);
      setLikes(res.likes);
      setLiked(true);
      localStorage.setItem(`liked_${id}`, 'true');
    } catch {
      alert('Не удалось поставить лайк');
    }
  }

  async function handleSend() {
    if (!commentText.trim() || !id) return;
    setSending(true);
    const name = authorName.trim() || 'Пользователь';
    try {
      await addComment(id, name, commentText);
      setCommentText('');
      const updated = await listComments(id);
      setComments(updated);
    } catch {
      alert('Не удалось отправить комментарий');
    } finally {
      setSending(false);
    }
  }

  const CATEGORY_NAMES: Record<string, string> = {
    ai:   'Работа с ИИ',
    food: 'Питание',
    mind: 'Мышление',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#aaa', fontSize: 16 }}>Загрузка...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 18, color: '#555' }}>Пост не найден</div>
        <a href="/" style={{ color: '#00897b' }}>← На главную</a>
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

      <div style={{ maxWidth: 750, margin: '0 auto', padding: '32px 16px' }}>

        {/* КАРТИНКА */}
        {post.mediaurl && (
          <img
            src={post.mediaurl}
            alt={post.title}
            style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }}
          />
        )}

        {/* ТЕКСТ ПОСТА */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, color: '#333' }}>ПОСТ</span>
            <span style={{ backgroundColor: '#e0f2f1', color: '#00897b', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              {CATEGORY_NAMES[post.categoryid] ?? post.categoryid}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>{post.author} · {post.createdat}</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#111' }}>{post.title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap' }}>{post.description}</p>
        </div>

        {/* ЛАЙКИ */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: '14px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <button
            onClick={handleLike}
            disabled={liked}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: liked ? '#e0f2f1' : '#f5f5f5',
              border: liked ? '1.5px solid #00897b' : '1.5px solid #e0e0e0',
              borderRadius: 8, padding: '8px 20px',
              cursor: liked ? 'default' : 'pointer',
              fontSize: 20, color: liked ? '#00897b' : '#555',
              fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            {liked ? '❤️' : '🤍'}
            <span style={{ fontSize: 15 }}>{likes}</span>
          </button>
          <span style={{ fontSize: 13, color: '#aaa' }}>
            {liked ? 'Вам понравилось' : 'Нравится? Поставь лайк!'}
          </span>
        </div>

        {/* КОММЕНТАРИИ */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            Комментарии {comments.length > 0 && `(${comments.length})`}
          </div>

          {comments.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>Пока нет комментариев — будь первым.</div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {comments.map(c => (
                <div key={c.commentid} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      backgroundColor: '#00897b', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {(c.author || 'П')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author || 'Пользователь'}</span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{c.createdat}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#333', paddingLeft: 36 }}>{c.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* ФОРМА */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Ваше имя (необязательно)"
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Написать комментарий..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}
              />
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  backgroundColor: sending ? '#aaa' : '#00897b',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 18px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                }}
              >
                ↵
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}