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
  poseTrack: {
    version: 1,
    coordinateSystem: 'normalized',
    quality: 'estimated',
    pointLabels: {
      head: '头部',
      leftShoulder: '左肩',
      rightShoulder: '右肩',
      leftElbow: '左肘',
      rightElbow: '右肘',
      waist: '腰部',
      leftKnee: '左腿',
      rightKnee: '右腿',
      leftHeel: '左脚跟',
      rightHeel: '右脚跟',
      leftToe: '左脚尖',
      rightToe: '右脚尖',
    },
    frames: Array.from({ length: 18 }).map((_, index) => {
      const phase = index / 17
      const sway = Math.sin(phase * Math.PI * 2) * 0.018
      return {
        frameIndex: index + 1,
        timeMs: index * 500,
        confidence: 0.86,
        visibilityQuality: 'usable',
        points: {
          head: { x: 0.54 + sway, y: 0.22, confidence: 0.88 },
          leftShoulder: { x: 0.48 + sway, y: 0.36, confidence: 0.86 },
          rightShoulder: { x: 0.58 + sway, y: 0.36, confidence: 0.86 },
          leftElbow: { x: 0.43 + sway, y: 0.52, confidence: 0.8 },
          rightElbow: { x: 0.55 + sway, y: 0.52, confidence: 0.8 },
          waist: { x: 0.55 + sway, y: 0.66, confidence: 0.84 },
          leftKnee: { x: 0.47 - sway, y: 0.82, confidence: 0.78 },
          rightKnee: { x: 0.59 - sway, y: 0.82, confidence: 0.78 },
          leftHeel: { x: 0.38 - sway, y: 0.94, confidence: 0.56, derived: true },
          rightHeel: { x: 0.52 - sway, y: 0.94, confidence: 0.56, derived: true },
          leftToe: { x: 0.5 - sway, y: 0.95, confidence: 0.56, derived: true },
          rightToe: { x: 0.64 - sway, y: 0.95, confidence: 0.56, derived: true },
        },
      }
    }),
  },
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

export function getReportPdfUrl(reportId: string): string {
  return `https://api.soai.yun/api/lite/v1/reports/${encodeURIComponent(reportId)}/pdf`
}

export async function submitReportFeedback(_reportId: string, _payload: ReportFeedbackPayload): Promise<void> {
  await delay(200)
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
