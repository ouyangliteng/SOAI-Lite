import Taro from '@tarojs/taro'
import type { TrainingReport, ReportListItem, JointAngle } from '../types'

const BASE = process.env.API_BASE_URL || 'https://api.soai.yun/api/lite/v1'

function request<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = Taro.getStorageSync('token') || ''
    Taro.request({
      url: `${BASE}${path}`,
      method: 'GET',
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

function fixVideoUrl(url: string): string {
  if (!url) return ''
  // backend local storage uses local://soai/ prefix; remap to the lite API storage route.
  if (url.startsWith('local://soai/')) {
    return `${BASE}/storage/${url.slice('local://soai/'.length)}`
  }
  return url
}

const RULE_META: Record<string, { joint: string; normal: string }> = {
  upper_body_stability: { joint: '上身稳定', normal: '肩髋垂直' },
  lower_leg_stability:  { joint: '小腿位置', normal: '踝髋对齐' },
  arm_aid:              { joint: '手臂扶助', normal: '前臂水平' },
  left_right_symmetry:  { joint: '左右对称', normal: '对称平衡' },
  rhythm_control:       { joint: '节奏控制', normal: '步频均匀' },
}

function toJointAngles(ruleResults: any[]): JointAngle[] {
  return ruleResults.slice(0, 4).map(r => ({
    joint: RULE_META[r.ruleId]?.joint || r.metricName,
    angle: Math.round(r.measuredValue ?? 0),
    normal: RULE_META[r.ruleId]?.normal || `目标≤${r.targetValue}`,
    status: r.score >= 84 ? 'normal' : r.score >= 72 ? 'warning' : 'error',
  }))
}

export async function getReport(reportId: string): Promise<TrainingReport> {
  const { report: r } = await request<{ report: any }>(`/reports/${reportId}`)
  return {
    id: r.id,
    studentId: r.studentId,
    videoId: r.videoId,
    videoVisibleToday: !!r.videoVisibleToday,
    videoUrl: fixVideoUrl(r.videoPath || r.videoUrl || ''),
    overallScore: r.summary?.overallScore ?? 0,
    scores: r.scores,
    jointAngles: toJointAngles(r.ruleResults || []),
    trackingFrames: r.poseSummary?.frameCount ?? 0,
    trackingConfidence: Math.round((r.poseSummary?.averageConfidence ?? 0) * 100),
    problemPoints: (r.problemPoints || []).map((p: any) => p.detail || p.title),
    riskPoints: (r.riskPoints || []).map((p: any) => p.detail || p.title),
    safetyRidingEvaluation: Array.isArray(r.safetyRidingEvaluation)
      ? r.safetyRidingEvaluation
      : Array.isArray(r.summary?.safetyRidingEvaluation)
        ? r.summary.safetyRidingEvaluation
        : [],
    improvements: r.improvements || [],
    nextTrainingFocus: Array.isArray(r.nextTrainingFocus)
      ? r.nextTrainingFocus.join('；')
      : (r.nextTrainingFocus || ''),
    trendSummary: r.trendSummary,
    trainingDate: r.summary?.trainingDate || (r.createdAt || '').slice(0, 10),
    createdAt: r.createdAt || new Date().toISOString(),
  }
}

export async function listReports(): Promise<ReportListItem[]> {
  const data = await request<{ items?: any[] }>(`/reports?limit=10`)
  return (data.items || []).map(item => ({
    id: item.reportId,
    overallScore: item.overallScore,
    trainingDate: item.trainingDate,
    oneLineConclusion: item.oneLineConclusion || item.summary?.oneLineConclusion || '',
    riskCount: item.riskCount ?? 0,
  }))
}
