// lib/api.ts

export type Post = {
  postid:     string;
  title:      string;
  description: string;
  author?:    string;
  categoryid: string;
  mediaurl?:  string;
  createdat:  number | string;
};

export type Comment = {
  postid:    string;
  commentid: string;
  author:    string;
  text:      string;
  createdat: number | string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function listPosts(): Promise<Post[]> {
  const res = await fetch(`${BASE}/posts`);
  if (!res.ok) throw new Error(`listPosts: ${res.status}`);
  return res.json();
}

export async function listComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`${BASE}/comments?postId=${postId}`);
  if (!res.ok) throw new Error(`listComments: ${res.status}`);
  return res.json();
}

export async function addComment(postId: string, author: string, text: string): Promise<void> {
  const res = await fetch(`${BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, author, text }),
  });
  if (!res.ok) throw new Error(`addComment: ${res.status}`);
}