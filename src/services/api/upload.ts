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

export async function doUpload(
  uploadUrl: string,
  filePath: string,
  onProgress: (p: number) => void
): Promise<void> {
  const Taro = (await import('@tarojs/taro')).default
  return new Promise((resolve, reject) => {
    const task = Taro.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'file',
      success: () => resolve(),
      fail: (e: { errMsg: string }) => reject(new Error(e.errMsg)),
    })
    task.onProgressUpdate((p: { progress: number }) => onProgress(p.progress))
  })
}

export async function notifyUploaded(videoId: string): Promise<void> {
  await request(`/upload/notify/${videoId}`, { method: 'POST' })
}
