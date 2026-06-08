import Taro from '@tarojs/taro'
import type { UploadQuota } from '../types'

const BASE = process.env.API_BASE_URL || 'https://api.soai.yun/api/lite/v1'

function request<T>(path: string, opts?: { method?: 'POST'; body?: object }): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = Taro.getStorageSync('token') || ''
    Taro.request({
      url: `${BASE}${path}`,
      method: opts?.method || 'GET',
      data: opts?.body,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
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

export async function getUploadQuota(): Promise<UploadQuota> {
  return request<UploadQuota>('/upload/quota')
}

export async function getUploadToken(
  filename: string,
  sizeBytes: number,
  durationSec: number
): Promise<{ uploadUrl: string; videoId: string; reused?: boolean; reportId?: string; message?: string }> {
  const data = await request<{ videoId: string; uploadUrl: string; reused?: boolean; reportId?: string; message?: string }>('/videos/upload-token', {
    method: 'POST',
    body: {
      fileName: filename,
      sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(1)),
      durationSec: Math.round(durationSec),
      format: 'mp4',
      analysisConsent: true,
      caseConsent: false,
    },
  })
  return {
    uploadUrl: data.uploadUrl,
    videoId: data.videoId,
    reused: data.reused,
    reportId: data.reportId,
    message: data.message,
  }
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
  await request(`/videos/${videoId}/upload-status`, {
    method: 'POST',
    body: { uploadStatus: 'uploaded', uploadProgress: 100, uploadError: '' },
  })
}
