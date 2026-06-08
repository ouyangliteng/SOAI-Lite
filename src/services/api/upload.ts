import Taro from '@tarojs/taro'

const BASE = process.env.API_BASE_URL || 'http://127.0.0.1:8787'

function request<T>(path: string, opts: { method: 'POST'; body: object }): Promise<T> {
  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${BASE}${path}`,
      method: 'POST',
      data: opts.body,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode >= 400) {
          reject(new Error((res.data as any)?.message || `API ${res.statusCode}`))
        } else {
          resolve(res.data as T)
        }
      },
      fail: (err) => reject(new Error(err.errMsg)),
    })
  })
}

export async function getUploadToken(
  filename: string,
  sizeBytes: number
): Promise<{ uploadUrl: string; videoId: string }> {
  const data = await request<{ videoId: string; uploadUrl: string }>('/api/videos/upload-token', {
    method: 'POST',
    body: {
      fileName: filename,
      sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(1)),
      durationSec: 0,
      format: 'mp4',
      analysisConsent: true,
      caseConsent: false,
    },
  })
  return { uploadUrl: data.uploadUrl, videoId: data.videoId }
}

export async function doUpload(
  uploadUrl: string,
  filePath: string,
  onProgress: (p: number) => void
): Promise<void> {
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
  await request(`/api/videos/${videoId}/upload-status`, {
    method: 'POST',
    body: { uploadStatus: 'uploaded', uploadProgress: 100, uploadError: '' },
  })
}
