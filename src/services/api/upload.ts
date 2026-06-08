const BASE = process.env.API_BASE_URL || 'https://lite.soai.yun/api/lite/v1'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function getUploadToken(
  filename: string,
  sizeBytes: number
): Promise<{ uploadUrl: string; videoId: string }> {
  return request('/upload/token', {
    method: 'POST',
    body: JSON.stringify({ filename, sizeBytes }),
  })
}

export async function notifyUploaded(videoId: string): Promise<void> {
  await request(`/upload/notify/${videoId}`, { method: 'POST' })
}
