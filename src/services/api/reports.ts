import type { ReportListItem, TrainingReport } from '../types'

const BASE = process.env.API_BASE_URL || 'https://lite.soai.yun/api/lite/v1'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function listReports(): Promise<ReportListItem[]> {
  return request('/reports')
}

export async function getReport(reportId: string): Promise<TrainingReport> {
  return request(`/reports/${reportId}`)
}
