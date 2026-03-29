const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type Post = {
  postid:      string;
  title:       string;
  description: string;
  mediaurl:    string;
  type:        string;
  categoryid:  string;
  author:      string;
  createdat:   string;
  likes:       number;
};

export type Comment = {
  commentid: string;
  postid:    string;
  author:    string;
  text:      string;
  createdat: string;
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listPosts(): Promise<Post[]> {
  return apiFetch<Post[]>(`${API_URL}/posts`);
}

export async function getPost(postid: string): Promise<Post> {
  return apiFetch<Post>(`${API_URL}/posts/${postid}`);
}

export async function listComments(postid: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`${API_URL}/posts/${postid}/comments`);
}

export async function addComment(postid: string, author: string, text: string): Promise<void> {
  return apiFetch<void>(`${API_URL}/posts/${postid}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });
}

export async function likePost(postid: string): Promise<{ likes: number }> {
  return apiFetch<{ likes: number }>(`${API_URL}/posts/${postid}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function createPost(data: {
  title: string;
  description: string;
  categoryid: string;
  author?: string;
  imageBase64?: string;
  imageName?: string;
  imageMime?: string;
  videoBase64?: string;
  videoName?: string;
}): Promise<Post> {
  return apiFetch<Post>(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}