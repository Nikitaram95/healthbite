const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type Post = {
  postid:      string;
  title:       string;
  description: string;
  mediaurl:    string;
  type:        string;
  categoryid:  string;
  author:      string;
  createdat:   string; // ISO строка из YDB Timestamp
};

export type Comment = {
  commentid: string;
  postid:    string;
  author:    string;
  text:      string;
  createdat: string; // ISO строка
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    throw new Error(error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listPosts(category?: string): Promise<Post[]> {
  const url = category && category !== 'all'
    ? `${API_URL}/posts?category=${category}`
    : `${API_URL}/posts`;
  return apiFetch<Post[]>(url);
}

export async function getPost(id: string): Promise<Post> {
  return apiFetch<Post>(`${API_URL}/posts/${id}`);
}

export async function listComments(postId: string): Promise<Comment[]> {
  try {
    return await apiFetch<Comment[]>(`${API_URL}/comments?postid=${postId}`);
  } catch {
    return [];
  }
}

export async function addComment(
  postId: string,
  author: string,
  text: string,
): Promise<Comment> {
  return apiFetch<Comment>(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'comment', postid: postId, author, text }),
  });
}

export async function createPost(data: {
  title: string;
  description: string;
  categoryid: string;
  author?: string;
  imageBase64?: string | null;
  imageName?: string | null;
  imageMime?: string | null;
}): Promise<{ postId: string; mediaUrl: string; type: string }> {
  return apiFetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createpost', ...data }),
  });
}