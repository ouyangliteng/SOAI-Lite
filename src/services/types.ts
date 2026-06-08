export interface StudentProfile {
  id: string
  name: string
  phone: string
  currentLevel: string
  avatarUrl?: string
  coachName?: string
  clubName?: string
  analysisConsent: boolean
  caseConsent: boolean
}

export type UploadStatus = 'selected' | 'validating' | 'uploading' | 'uploaded' | 'failed'

export interface TrainingVideo {
  id: string
  studentId: string
  filename: string
  fileSizeBytes: number
  durationSeconds: number
  uploadStatus: UploadStatus
  cosUrl?: string
  createdAt: string
}

export interface UploadQuota {
  limit: number
  used: number
  remaining: number
  date: string
}

export type AnalysisStatus =
  | 'queued'
  | 'analyzing'
  | 'generating_report'
  | 'completed'
  | 'failed'

export interface AnalysisTask {
  id: string
  videoId: string
  status: AnalysisStatus
  progressText: string
  reportId?: string
  createdAt: string
}

export interface ScoreDimensions {
  postureControl: number
  rhythmControl: number
  stability: number
  aidAccuracy: number
  safetyAwareness: number
}

export interface JointAngle {
  joint: string
  angle: number
  normal: string
  status: 'normal' | 'warning' | 'error'
}

export interface PoseTrackPoint {
  x: number
  y: number
  confidence: number
  derived?: boolean
}

export interface PoseTrackFrame {
  frameIndex: number
  timeMs: number
  confidence: number
  visibilityQuality: 'usable' | 'low' | string
  points: Record<string, PoseTrackPoint>
}

export interface PoseTrack {
  version: number
  coordinateSystem: 'normalized'
  pointLabels: Record<string, string>
  frames: PoseTrackFrame[]
}

export interface TrainingReport {
  id: string
  studentId: string
  videoId: string
  videoVisibleToday: boolean
  videoUrl?: string
  overallScore: number
  scores: ScoreDimensions
  jointAngles: JointAngle[]
  poseTrack?: PoseTrack
  trackingFrames: number
  trackingConfidence: number
  problemPoints: string[]
  riskPoints: string[]
  safetyRidingEvaluation?: string[]
  improvements: string[]
  nextTrainingFocus: string
  trendSummary?: string
  trainingDate: string
  createdAt: string
}

export interface ReportListItem {
  id: string
  overallScore: number
  trainingDate: string
  oneLineConclusion: string
  riskCount: number
}

export type ReportFeedbackRole = 'student' | 'coach'

export interface ReportFeedbackPayload {
  role: ReportFeedbackRole
  accuracyRating: number
  usefulnessRating: number
  correctionText: string
  comment: string
  tags: string[]
  aiLearningConsent: boolean
}

/* ── Service interfaces ── */

export interface AuthService {
  sendCode(phone: string): Promise<void>
  verifyCode(phone: string, code: string): Promise<{ token: string; profile: StudentProfile }>
  loginWithWx(code: string, anonymousId: string): Promise<{ token: string; profile: StudentProfile }>
}

export interface UploadService {
  getUploadQuota(): Promise<UploadQuota>
  getUploadToken(filename: string, sizeBytes: number, durationSec: number): Promise<{ uploadUrl: string; videoId: string }>
  doUpload(uploadUrl: string, filePath: string, onProgress: (p: number) => void): Promise<void>
  notifyUploaded(videoId: string): Promise<void>
}

export interface AnalysisService {
  createTask(videoId: string): Promise<AnalysisTask>
  getTask(taskId: string): Promise<AnalysisTask>
}

export interface ReportService {
  listReports(): Promise<ReportListItem[]>
  getReport(reportId: string): Promise<TrainingReport>
  submitReportFeedback(reportId: string, payload: ReportFeedbackPayload): Promise<void>
}
