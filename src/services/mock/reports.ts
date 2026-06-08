import type { ReportFeedbackPayload, ReportListItem, TrainingReport } from '../types'

const MOCK_REPORT: TrainingReport = {
  id: 'report_mock_001',
  studentId: 'student_001',
  videoId: 'video_001',
  videoVisibleToday: true,
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  overallScore: 83,
  scores: {
    postureControl: 85,
    rhythmControl: 80,
    stability: 86,
    aidAccuracy: 78,
    safetyAwareness: 82,
  },
  jointAngles: [
    { joint: '左膝',  angle: 112, normal: '90–110°', status: 'warning' },
    { joint: '右膝',  angle: 98,  normal: '90–110°', status: 'normal'  },
    { joint: '上臂',  angle: 25,  normal: '15–30°',  status: 'normal'  },
    { joint: '前臂',  angle: 142, normal: '130–150°', status: 'normal' },
  ],
  trackingFrames: 248,
  trackingConfidence: 94,
  problemPoints: ['左膝角度偏大，坐骨重心偏后', '收缰时手腕有轻微锁死'],
  riskPoints: ['长期膝盖过伸可能导致关节压力积累'],
  improvements: ['节奏稳定性较上次提升', '上身直立保持良好'],
  nextTrainingFocus: '专注放松左膝，练习随步半活动坐骨',
  trendSummary: '近 3 次训练综合分稳定在 80+ 分，稳定性维度持续进步。',
  trainingDate: '2026-06-07',
  createdAt: new Date().toISOString(),
}

const MOCK_LIST: ReportListItem[] = [
  { id: 'report_mock_001', overallScore: 83, trainingDate: '2026-06-07', oneLineConclusion: '整体稳定，左膝角度需关注', riskCount: 1 },
  { id: 'report_mock_002', overallScore: 78, trainingDate: '2026-05-31', oneLineConclusion: '节奏控制有改善空间', riskCount: 2 },
  { id: 'report_mock_003', overallScore: 75, trainingDate: '2026-05-24', oneLineConclusion: '上身前倾问题持续', riskCount: 2 },
]

export async function listReports(): Promise<ReportListItem[]> {
  await delay(300)
  return MOCK_LIST
}

export async function getReport(reportId: string): Promise<TrainingReport> {
  await delay(400)
  return { ...MOCK_REPORT, id: reportId }
}

export async function submitReportFeedback(_reportId: string, _payload: ReportFeedbackPayload): Promise<void> {
  await delay(200)
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
