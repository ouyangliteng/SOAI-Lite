import type { AnalysisTask } from '../types'

const BASE = process.env.API_BASE_URL || 'https://lite.soai.yun/api/lite/v1'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function createTask(videoId: string): Promise<AnalysisTask> {
  return request('/analysis/tasks', { method: 'POST', body: JSON.stringify({ videoId }) })
}

export async function getTask(taskId: string): Promise<AnalysisTask> {
  return request(`/analysis/tasks/${taskId}`)
}
