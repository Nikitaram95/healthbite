const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type Post = {
  postid: string;
  title: string;
  description: string;
  mediaurl: string;
  type: string;
  categoryid: string;
  author: string;
  createdat: number;
};

export type Comment = {
  commentid: string;
  postid: string;
  author: string;
  text: string;
  createdat: number;
};

export async function listPosts(category?: string): Promise<Post[]> {
  const url = category && category !== 'all'
    ? `${API_URL}/posts?category=${category}`
    : `${API_URL}/posts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ошибка загрузки постов');
  return res.json();
}

export async function getPost(id: string): Promise<Post> {
  const res = await fetch(`${API_URL}/posts/${id}`);
  if (!res.ok) throw new Error('Пост не найден');
  return res.json();
}

export async function listComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`${API_URL}/comments?postid=${postId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function addComment(postId: string, author: string, text: string): Promise<void> {
  await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'comment', postid: postId, author, text }),
  });
}