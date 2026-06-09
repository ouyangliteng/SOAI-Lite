import { useState, useEffect } from 'react'
import { View, Text, Image, Video, Textarea, Canvas } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { reportService } from '../../services'
import type { PoseTrackFrame, PoseTrackPoint, ReportFeedbackRole, TrainingReport } from '../../services/types'
import './index.scss'

type NavTab = 'assessment' | 'risks' | 'improvements'
const TAB_LABELS: Record<NavTab, string> = { assessment: '综合评价', risks: '安全提醒', improvements: '进步' }
const FEEDBACK_TAGS = ['姿态判断不准', '角度数据偏差', '安全评价需修正', '视频角度影响', '教练已确认']
const POSE_CANVAS_ID = 'poseTrackCanvas'
const VIDEO_HEIGHT_RPX = 360
const PAGE_PADDING_RPX = 28
const DISPLAY_POINT_KEYS = ['head', 'shoulder', 'elbow', 'waist', 'knee', 'heel', 'toe'] as const
const POSE_CONNECTIONS: [string, string][] = [
  ['head', 'shoulder'],
  ['shoulder', 'elbow'],
  ['shoulder', 'waist'],
  ['waist', 'knee'],
  ['knee', 'heel'],
  ['heel', 'toe'],
]
type DisplayPointKey = typeof DISPLAY_POINT_KEYS[number]
type DisplayPointMap = Record<DisplayPointKey, PoseTrackPoint | undefined>

function getNearestTrackFrame(frames: PoseTrackFrame[], timeMs: number): PoseTrackFrame {
  return frames.reduce((nearest, frame) => (
    Math.abs(frame.timeMs - timeMs) < Math.abs(nearest.timeMs - timeMs) ? frame : nearest
  ), frames[0])
}

function pointReady(point?: PoseTrackPoint) {
  return point && point.confidence >= 0.18
}

function averagePoint(points: Array<PoseTrackPoint | undefined>): PoseTrackPoint | undefined {
  const readyPoints = points.filter(pointReady) as PoseTrackPoint[]
  if (!readyPoints.length) return undefined
  const confidence = readyPoints.reduce((sum, point) => sum + point.confidence, 0) / readyPoints.length
  return {
    x: readyPoints.reduce((sum, point) => sum + point.x, 0) / readyPoints.length,
    y: readyPoints.reduce((sum, point) => sum + point.y, 0) / readyPoints.length,
    confidence,
    derived: readyPoints.some(point => point.derived),
  }
}

function getDisplayPoints(frame: PoseTrackFrame): DisplayPointMap {
  const p = frame.points
  return {
    head: p.head,
    shoulder: averagePoint([p.leftShoulder, p.rightShoulder]),
    elbow: averagePoint([p.leftElbow, p.rightElbow]),
    waist: p.waist,
    knee: averagePoint([p.leftKnee, p.rightKnee]),
    heel: averagePoint([p.leftHeel, p.rightHeel]),
    toe: averagePoint([p.leftToe, p.rightToe]),
  }
}

function drawPoseTrack(report: TrainingReport, currentTimeSec: number) {
  if (!shouldShowPoseOverlay(report)) return

  const systemInfo = Taro.getSystemInfoSync()
  const rpx = systemInfo.windowWidth / 750
  const canvasWidth = systemInfo.windowWidth - PAGE_PADDING_RPX * 2 * rpx
  const canvasHeight = VIDEO_HEIGHT_RPX * rpx
  const frame = getNearestTrackFrame(report.poseTrack.frames, currentTimeSec * 1000)
  const displayPoints = getDisplayPoints(frame)
  const ctx = Taro.createCanvasContext(POSE_CANVAS_ID)

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ctx.setStrokeStyle('rgba(34, 240, 200, 0.62)')
  ctx.setLineWidth(1.5)

  POSE_CONNECTIONS.forEach(([fromKey, toKey]) => {
    const from = displayPoints[fromKey as DisplayPointKey]
    const to = displayPoints[toKey as DisplayPointKey]
    if (!pointReady(from) || !pointReady(to)) return
    ctx.beginPath()
    ctx.moveTo(from.x * canvasWidth, from.y * canvasHeight)
    ctx.lineTo(to.x * canvasWidth, to.y * canvasHeight)
    ctx.stroke()
  })

  DISPLAY_POINT_KEYS.forEach((key) => {
    const point = displayPoints[key]
    if (!pointReady(point)) return
    const x = point.x * canvasWidth
    const y = point.y * canvasHeight
    const radius = key === 'toe' || key === 'heel' ? 3 : 4
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.setFillStyle(point.derived ? 'rgba(210, 153, 34, 0.92)' : 'rgba(34, 240, 200, 0.95)')
    ctx.fill()
    ctx.setStrokeStyle('rgba(255, 255, 255, 0.62)')
    ctx.setLineWidth(1)
    ctx.stroke()
    ctx.setStrokeStyle('rgba(34, 240, 200, 0.62)')
    ctx.setLineWidth(1.5)
  })

  ctx.draw()
}

function shouldShowPoseOverlay(report: TrainingReport) {
  return Boolean(
    report.videoVisibleToday &&
    report.videoUrl &&
    report.poseTrack?.quality === 'detected' &&
    report.poseTrack.frames?.length
  )
}

export default function ReportDetailPage() {
  const router = useRouter()
  const reportId = router.params.id ?? 'report_mock_001'
  const [report, setReport] = useState<TrainingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NavTab>('assessment')
  const [feedbackRole, setFeedbackRole] = useState<ReportFeedbackRole>('student')
  const [accuracyRating, setAccuracyRating] = useState(4)
  const [usefulnessRating, setUsefulnessRating] = useState(4)
  const [correctionText, setCorrectionText] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackTags, setFeedbackTags] = useState<string[]>([])
  const [aiLearningConsent, setAiLearningConsent] = useState(true)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [videoTimeSec, setVideoTimeSec] = useState(0)

  useEffect(() => {
    reportService.getReport(reportId)
      .then(r => { setReport(r); setLoading(false) })
      .catch(() => {
        setLoading(false)
        Taro.showToast({ title: '加载失败', icon: 'error' })
      })
  }, [reportId])

  useEffect(() => {
    if (!report) return
    Taro.nextTick(() => drawPoseTrack(report, videoTimeSec))
  }, [report, videoTimeSec])

  async function handleSaveScreenshot() {
    try {
      await Taro.authorize({ scope: 'scope.writePhotosAlbum' })
    } catch {
      Taro.showModal({
        title: '需要相册权限',
        content: '请在设置中开启相册权限后重试',
        showCancel: false,
      })
      return
    }
    Taro.showToast({ title: '截图功能开发中', icon: 'none', duration: 2000 })
  }

  function toggleFeedbackTag(tag: string) {
    setFeedbackTags(prev => (
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]
    ))
  }

  async function handleSubmitFeedback() {
    if (submittingFeedback || feedbackSubmitted) return
    if (!correctionText.trim() && !feedbackComment.trim()) {
      Taro.showToast({ title: '请填写评价或修正说明', icon: 'none' })
      return
    }
    setSubmittingFeedback(true)
    try {
      await reportService.submitReportFeedback(reportId, {
        role: feedbackRole,
        accuracyRating,
        usefulnessRating,
        correctionText: correctionText.trim(),
        comment: feedbackComment.trim(),
        tags: feedbackTags,
        aiLearningConsent,
      })
      setFeedbackSubmitted(true)
      Taro.showToast({ title: '已记录评价', icon: 'success' })
    } catch {
      Taro.showToast({ title: '提交失败，请稍后重试', icon: 'error' })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  function goHome() {
    Taro.switchTab({ url: '/pages/home/index' }).catch(() => {
      Taro.reLaunch({ url: '/pages/home/index' })
    })
  }

  if (loading) {
    return (
      <View className='page' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <View className='muted'>报告加载中…</View>
      </View>
    )
  }
  if (!report) return null

  const topAngles = report.jointAngles.slice(0, 4)
  const scoreEntries: [string, number][] = [
    ['姿态控制', report.scores.postureControl],
    ['节奏控制', report.scores.rhythmControl],
    ['稳定性',   report.scores.stability],
    ['辅助精度', report.scores.aidAccuracy],
    ['安全意识', report.scores.safetyAwareness],
  ]
  const safetyEvaluation = report.safetyRidingEvaluation?.length
    ? report.safetyRidingEvaluation
    : [
      report.problemPoints[0] || report.nextTrainingFocus,
      report.riskPoints[0] || '本次未发现明显高风险动作，但 AI 不能替代教练对马匹状态、场地和学员体感的现场判断。',
      '建议穿戴合规马术护具，训练中保持与教练耳机沟通，出现失衡、紧张或路线偏移时先减速确认。',
    ]

  return (
    <View className='report-detail-page'>
      <View className='report-page-header'>
        <View className='report-back-home' onClick={goHome}>‹ 返回首页</View>
        <Text className='report-page-title'>完整报告</Text>
      </View>

      {/* 得分头部 */}
      <View className='report-score-section'>
        <View className='card'>
          <View className='row'>
            <View>
              <Text className='score-big'>{report.overallScore}</Text>
              <Text className='score-unit'>分</Text>
            </View>
            <View className='tag'>{report.trainingDate}</View>
          </View>
          <View className='muted' style={{ marginTop: '8rpx' }}>
            追踪 {report.trackingFrames} 帧 · 置信度 {report.trackingConfidence}%
          </View>
        </View>
      </View>

      {/* 视频回放区 */}
      <View className='video-section'>
        <View className='video-label-row'>
          <Text className='video-section-title'>📹 训练视频回放</Text>
          <Text className='video-expire-tag'>当天可看 · 次日删除</Text>
        </View>
        {report.videoVisibleToday && report.videoUrl ? (
          <View className='video-track-shell'>
            <Video
              src={report.videoUrl}
              controls
              showFullscreenBtn
              initialTime={0}
              className='training-video'
              onTimeUpdate={(e) => setVideoTimeSec(e.detail.currentTime)}
            />
            {shouldShowPoseOverlay(report) && (
              <Canvas
                canvasId={POSE_CANVAS_ID}
                className='pose-track-canvas'
                disableScroll
              />
            )}
          </View>
        ) : (
          <View className='video-expired-placeholder'>
            <Text style={{ fontSize: '48rpx' }}>🎬</Text>
            <Text>视频已于次日自动删除</Text>
            <Text style={{ fontSize: '22rpx' }}>姿态数据已保留</Text>
          </View>
        )}
        <View className='video-meta-tags'>
          <View className='vmtag'>训练片段</View>
          <View className='vmtag'>{shouldShowPoseOverlay(report) ? '真实姿态追踪' : '仅视频回放'}</View>
          <View className='vmtag'>15 秒内</View>
        </View>
        {report.videoVisibleToday && report.videoUrl && !shouldShowPoseOverlay(report) && (
          <View className='muted' style={{ marginTop: '12rpx', fontSize: '22rpx' }}>
            真实模型未返回可用轨迹，本次不展示关节点。
          </View>
        )}
      </View>

      {/* AI 分析面板 */}
      <View className='analytics-panel'>
        <Image
          className='analytics-reference'
          src='/assets/report-analytics-reference.jpg'
          mode='widthFix'
        />
        <View className='analytics-overlay'>
          <View className='tracking-panel'>
            <View className='tracking-row'>
              <View className='tracking-dot' />
              <Text className='tracking-label'>TRACKING</Text>
            </View>
            <View className='tracking-row' style={{ marginTop: '4rpx' }}>
              <Text className='tracking-value'>{report.trackingFrames} frames · {report.trackingConfidence}% conf</Text>
            </View>
          </View>

        </View>
      </View>

      <View className='analysis-summary'>
        <View className='angle-grid'>
          {topAngles.map(a => (
            <View key={a.joint} className='angle-chip'>
              <View className='angle-chip-joint'>{a.joint}</View>
              <View className={`angle-chip-value ${a.status === 'warning' ? 'angle-chip-warn' : 'angle-chip-ok'}`}>
                {a.angle}°
              </View>
              <View className='angle-chip-joint'>{a.normal}</View>
            </View>
          ))}
        </View>

        <View className='metrics-card'>
          <View className='metrics-title'>5 维评分</View>
          {scoreEntries.map(([name, val]) => (
            <View key={name} className='metrics-row'>
              <Text className='metrics-name'>{name}</Text>
              <View className='metrics-track'>
                <View className='metrics-fill' style={{ width: `${val}%` }} />
              </View>
              <Text className='metrics-score'>{val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 内容 Tab */}
      <View className='report-content-section'>
        <View className='report-nav'>
          {(Object.keys(TAB_LABELS) as NavTab[]).map(tab => (
            <View
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </View>
          ))}
        </View>

        <View className='problem-list'>
          {activeTab === 'assessment' && safetyEvaluation.map((p, i) => (
            <View key={i} className='problem-item'>
              <Text className='problem-dot'>{i + 1}</Text>
              <Text>{p}</Text>
            </View>
          ))}
          {activeTab === 'risks' && report.riskPoints.map((p, i) => (
            <View key={i} className='problem-item'>
              <Text className='problem-dot risk-dot'>⚠</Text>
              <Text>{p}</Text>
            </View>
          ))}
          {activeTab === 'improvements' && report.improvements.map((p, i) => (
            <View key={i} className='problem-item'>
              <Text className='problem-dot improve-dot'>↑</Text>
              <Text>{p}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'assessment' && (
          <View className='card' style={{ marginTop: '28rpx' }}>
            <View className='muted'>下次训练重点</View>
            <View style={{ marginTop: '12rpx', color: '#e6edf3', fontSize: '28rpx', lineHeight: '1.6' }}>
              {report.nextTrainingFocus}
            </View>
          </View>
        )}

        <View className='feedback-card'>
          <View className='feedback-head'>
            <View>
              <View className='feedback-title'>报告评价</View>
              <View className='feedback-sub'>用于校准 AI 姿态识别与安全骑乘评价样本</View>
            </View>
            {feedbackSubmitted && <View className='feedback-status'>已提交</View>}
          </View>

          <View className='feedback-role-row'>
            {([
              ['student', '学员填写'],
              ['coach', '教练填写'],
            ] as [ReportFeedbackRole, string][]).map(([role, label]) => (
              <View
                key={role}
                className={`feedback-role ${feedbackRole === role ? 'feedback-role-active' : ''}`}
                onClick={() => setFeedbackRole(role)}
              >
                {label}
              </View>
            ))}
          </View>

          <View className='feedback-rating-row'>
            <Text className='feedback-label'>准确度</Text>
            <View className='rating-buttons'>
              {[1, 2, 3, 4, 5].map(score => (
                <View
                  key={score}
                  className={`rating-dot ${accuracyRating === score ? 'rating-dot-active' : ''}`}
                  onClick={() => setAccuracyRating(score)}
                >
                  {score}
                </View>
              ))}
            </View>
          </View>
          <View className='feedback-rating-row'>
            <Text className='feedback-label'>实用性</Text>
            <View className='rating-buttons'>
              {[1, 2, 3, 4, 5].map(score => (
                <View
                  key={score}
                  className={`rating-dot ${usefulnessRating === score ? 'rating-dot-active' : ''}`}
                  onClick={() => setUsefulnessRating(score)}
                >
                  {score}
                </View>
              ))}
            </View>
          </View>

          <View className='feedback-tags'>
            {FEEDBACK_TAGS.map(tag => (
              <View
                key={tag}
                className={`feedback-tag ${feedbackTags.includes(tag) ? 'feedback-tag-active' : ''}`}
                onClick={() => toggleFeedbackTag(tag)}
              >
                {tag}
              </View>
            ))}
          </View>

          <Textarea
            className='feedback-textarea'
            value={correctionText}
            maxlength={300}
            placeholder='哪些判断不准确？例如：小腿位置实际更稳定、视频角度导致膝盖识别偏差。'
            onInput={(e) => setCorrectionText(e.detail.value)}
          />
          <Textarea
            className='feedback-textarea'
            value={feedbackComment}
            maxlength={300}
            placeholder='补充现场事实或教练修正建议，可作为后续 AI 学习样本。'
            onInput={(e) => setFeedbackComment(e.detail.value)}
          />

          <View
            className='feedback-consent'
            onClick={() => setAiLearningConsent(!aiLearningConsent)}
          >
            <View className={`feedback-checkbox ${aiLearningConsent ? 'feedback-checkbox-active' : ''}`} />
            <Text>同意将本次评价作为 AI 准确性校准样本，仅用于内部模型与规则优化。</Text>
          </View>

          <View
            className={`feedback-submit ${feedbackSubmitted ? 'feedback-submit-disabled' : ''}`}
            onClick={handleSubmitFeedback}
          >
            {submittingFeedback ? '提交中…' : feedbackSubmitted ? '评价已记录' : '提交报告评价'}
          </View>
        </View>

        <View className='save-btn' onClick={handleSaveScreenshot}>
          <Text>📥</Text>
          <Text>保存报告截图到相册</Text>
        </View>

        <View className='report-bottom-actions'>
          <View className='btn btn-secondary' onClick={goHome}>返回首页</View>
        </View>
      </View>
    </View>
  )
}
