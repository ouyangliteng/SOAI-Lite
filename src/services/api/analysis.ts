import Taro from '@tarojs/taro'
import type { AnalysisTask, AnalysisStatus } from '../types'

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

function mapStatus(s: string): AnalysisStatus {
  if (s === 'completed') return 'completed'
  if (s === 'failed') return 'failed'
  if (s === 'generating_report') return 'generating_report'
  if (s === 'queued') return 'queued'
  return 'analyzing'
}

export async function createTask(videoId: string): Promise<AnalysisTask> {
  const data = await request<{ taskId: string; status: string; reportId?: string; progressText?: string; createdAt?: string }>('/analysis/tasks', {
    method: 'POST',
    body: { videoId },
  })
  return {
    id: data.taskId,
    videoId,
    status: mapStatus(data.status),
    progressText: data.progressText || '排队等待中…',
    reportId: data.reportId,
    createdAt: data.createdAt || new Date().toISOString(),
  }
}

export async function getTask(taskId: string): Promise<AnalysisTask> {
  const data = await request<any>(`/analysis/tasks/${taskId}`)
  return {
    id: data.taskId,
    videoId: data.videoId || '',
    status: mapStatus(data.status),
    progressText: data.progressText || '',
    reportId: data.reportId || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
  }
}
