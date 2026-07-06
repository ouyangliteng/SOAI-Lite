import { useState, useEffect } from 'react'
import { View, Text, Image, Video, Textarea, CoverView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { reportService } from '../../services'
import type { PoseTrackFrame, PoseTrackPoint, ReportFeedbackRole, TrainingReport } from '../../services/types'
import './index.scss'

type NavTab = 'assessment' | 'risks' | 'improvements'
const TAB_LABELS: Record<NavTab, string> = { assessment: '综合评价', risks: '安全提醒', improvements: '进步' }
const FEEDBACK_TAGS = ['姿态判断不准', '角度数据偏差', '安全评价需修正', '视频角度影响', '教练已确认']
const RIDER_POINT_LABELS: Record<string, string> = {
  head: '头',
  shoulder: '肩',
  elbow: '肘',
  hand: '手',
  hip: '髋',
  leg: '腿',
  foot: '脚',
}
type RiderPointKey = keyof typeof RIDER_POINT_LABELS
type RiderPoint = { key: string; label?: string; point: PoseTrackPoint }
type PoseSegment = 'head' | 'torso' | 'arm' | 'leg'
type RiderLine = { key: string; from: PoseTrackPoint; to: PoseTrackPoint; segment: PoseSegment }
type OverlayPointStyle = { left: string; top: string }
type OverlayLineStyle = { left: string; top: string; width: string; transform: string }
type OverlayFrame = Pick<PoseTrackFrame, 'sourceWidth' | 'sourceHeight' | 'points' | 'confidence' | 'timeMs'>

const VIDEO_SHELL_WIDTH_RPX = 694
const VIDEO_SHELL_HEIGHT_RPX = 360
const RIDER_LINE_PAIRS = [
  ['head', 'shoulder', 'head'],
  ['shoulder', 'hip', 'torso'],
  ['shoulder', 'elbow', 'arm'],
  ['elbow', 'hand', 'arm'],
  ['hip', 'knee', 'leg'],
  ['knee', 'foot', 'leg'],
] as const

function shouldShowPoseOverlay(report: TrainingReport) {
  return Boolean(
    report.videoVisibleToday &&
    report.videoUrl &&
    !report.poseOverlayVideoUrl &&
    report.poseTrack?.frames?.length
  )
}

function hasPoseOverlayVideo(report: TrainingReport) {
  return Boolean(report.videoVisibleToday && report.videoUrl && report.poseOverlayVideoUrl)
}

function clonePoint(point: PoseTrackPoint): PoseTrackPoint {
  return {
    x: point.x,
    y: point.y,
    confidence: point.confidence,
    derived: point.derived,
  }
}

function interpolatePoint(from?: PoseTrackPoint, to?: PoseTrackPoint, progress = 0): PoseTrackPoint | undefined {
  if (pointVisible(from) && pointVisible(to)) {
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      confidence: Math.min(from.confidence, to.confidence),
      derived: Boolean(from.derived || to.derived),
    }
  }
  if (pointVisible(from)) return clonePoint(from)
  if (pointVisible(to)) return clonePoint(to)
  return undefined
}

function getInterpolatedTrackFrame(frames: PoseTrackFrame[], timeMs: number): OverlayFrame {
  const sortedFrames = frames.slice().sort((a, b) => a.timeMs - b.timeMs)
  const firstFrame = sortedFrames[0]
  const lastFrame = sortedFrames[sortedFrames.length - 1]
  if (!firstFrame || timeMs <= firstFrame.timeMs) return firstFrame
  if (timeMs >= lastFrame.timeMs) return lastFrame

  const nextIndex = sortedFrames.findIndex(frame => frame.timeMs >= timeMs)
  const prevFrame = sortedFrames[Math.max(0, nextIndex - 1)]
  const nextFrame = sortedFrames[nextIndex]
  const duration = Math.max(1, nextFrame.timeMs - prevFrame.timeMs)
  const progress = Math.max(0, Math.min(1, (timeMs - prevFrame.timeMs) / duration))
  const pointKeys = Array.from(new Set([
    ...Object.keys(prevFrame.points || {}),
    ...Object.keys(nextFrame.points || {}),
  ]))
  const points = pointKeys.reduce<Record<string, PoseTrackPoint>>((acc, key) => {
    const point = interpolatePoint(prevFrame.points?.[key], nextFrame.points?.[key], progress)
    if (point) acc[key] = point
    return acc
  }, {})

  return {
    timeMs,
    sourceWidth: prevFrame.sourceWidth || nextFrame.sourceWidth,
    sourceHeight: prevFrame.sourceHeight || nextFrame.sourceHeight,
    confidence: Math.min(Number(prevFrame.confidence || 0), Number(nextFrame.confidence || 0)),
    points,
  }
}

function averagePoint(points: Array<PoseTrackPoint | undefined>): PoseTrackPoint | undefined {
  const readyPoints = points.filter(point => point && point.confidence >= 0.18) as PoseTrackPoint[]
  if (!readyPoints.length) return undefined
  return {
    x: readyPoints.reduce((sum, point) => sum + point.x, 0) / readyPoints.length,
    y: readyPoints.reduce((sum, point) => sum + point.y, 0) / readyPoints.length,
    confidence: readyPoints.reduce((sum, point) => sum + point.confidence, 0) / readyPoints.length,
    derived: readyPoints.some(point => point.derived),
  }
}

function sideScore(points: Record<string, PoseTrackPoint | undefined>, side: 'left' | 'right') {
  const names = [`${side}Shoulder`, `${side}Elbow`, `${side}Wrist`, `${side}Knee`, `${side}Heel`, `${side}Toe`]
  const readyPoints = names.map(name => points[name]).filter(pointVisible)
  if (!readyPoints.length) return 0
  return readyPoints.reduce((sum, point) => sum + point.confidence, 0) / readyPoints.length
}

function getFrameOverlayPoints(frame?: OverlayFrame | null): Record<string, PoseTrackPoint | undefined> {
  if (!frame) return {}
  const points = frame.points || {}
  const side = sideScore(points, 'left') >= sideScore(points, 'right') ? 'left' : 'right'
  const otherSide = side === 'left' ? 'right' : 'left'
  return {
    head: points.head,
    shoulder: points[`${side}Shoulder`] || points[`${otherSide}Shoulder`],
    elbow: points[`${side}Elbow`] || points[`${otherSide}Elbow`],
    hand: points[`${side}Wrist`] || points[`${otherSide}Wrist`],
    hip: points[`${side}Hip`] || points.waist || points[`${otherSide}Hip`],
    knee: points[`${side}Knee`] || points[`${otherSide}Knee`],
    foot: averagePoint([points[`${side}Heel`], points[`${side}Toe`]]) ||
      averagePoint([points[`${otherSide}Heel`], points[`${otherSide}Toe`]]),
  }
}

function pointVisible(point?: PoseTrackPoint): point is PoseTrackPoint {
  return Boolean(point && point.confidence >= 0.3)
}

function getCurrentOverlayFrame(report: TrainingReport, currentTimeSec: number): OverlayFrame | null {
  if (!shouldShowPoseOverlay(report)) return null
  return getInterpolatedTrackFrame(report.poseTrack!.frames, currentTimeSec * 1000)
}

function getRiderPoints(frame: OverlayFrame | null): RiderPoint[] {
  if (!frame) return []
  const points = getFrameOverlayPoints(frame)
  const labelPoints: Array<{ key: RiderPointKey; point?: PoseTrackPoint }> = [
    { key: 'head', point: points.head },
    { key: 'shoulder', point: points.shoulder },
    { key: 'elbow', point: points.elbow },
    { key: 'hand', point: points.hand },
    { key: 'hip', point: points.hip },
    { key: 'leg', point: points.knee },
    { key: 'foot', point: points.foot },
  ]
  return labelPoints
    .filter(item => pointVisible(item.point))
    .map(item => ({ key: item.key, label: RIDER_POINT_LABELS[item.key], point: item.point! }))
}

function getRiderJointPoints(frame: OverlayFrame | null): RiderPoint[] {
  if (!frame) return []
  const points = getFrameOverlayPoints(frame)
  return Object.keys(points)
    .filter(key => pointVisible(points[key]))
    .map(key => ({ key, point: points[key] }))
}

function getRiderLines(frame: OverlayFrame | null): RiderLine[] {
  if (!frame) return []
  const points = getFrameOverlayPoints(frame)
  return RIDER_LINE_PAIRS
    .filter(([from, to]) => pointVisible(points[from]) && pointVisible(points[to]))
    .map(([from, to, segment]) => ({ key: `${from}-${to}`, from: points[from]!, to: points[to]!, segment }))
}

function getPointSegment(key: string): PoseSegment {
  if (key === 'head') return 'head'
  if (key === 'shoulder' || key === 'hip') return 'torso'
  if (key === 'elbow' || key === 'hand') return 'arm'
  return 'leg'
}

function mapOverlayPoint(point: PoseTrackPoint, frame: OverlayFrame | null): { x: number; y: number } {
  const sourceRatio = frame?.sourceWidth && frame?.sourceHeight
    ? frame.sourceWidth / frame.sourceHeight
    : 16 / 9
  const shellRatio = VIDEO_SHELL_WIDTH_RPX / VIDEO_SHELL_HEIGHT_RPX
  let rectX = 0
  let rectY = 0
  let rectW = 1
  let rectH = 1

  if (sourceRatio > shellRatio) {
    rectH = shellRatio / sourceRatio
    rectY = (1 - rectH) / 2
  } else {
    rectW = sourceRatio / shellRatio
    rectX = (1 - rectW) / 2
  }

  return {
    x: rectX + point.x * rectW,
    y: rectY + point.y * rectH,
  }
}

function getPointStyle(point: PoseTrackPoint, frame: OverlayFrame | null): OverlayPointStyle {
  const mapped = mapOverlayPoint(point, frame)
  return {
    left: `${Math.max(2, Math.min(98, mapped.x * 100))}%`,
    top: `${Math.max(2, Math.min(98, mapped.y * 100))}%`,
  }
}

function getLineStyle(line: RiderLine, frame: OverlayFrame | null): OverlayLineStyle {
  const from = mapOverlayPoint(line.from, frame)
  const to = mapOverlayPoint(line.to, frame)
  const dx = (to.x - from.x) * VIDEO_SHELL_WIDTH_RPX
  const dy = (to.y - from.y) * VIDEO_SHELL_HEIGHT_RPX
  const width = Math.sqrt(dx * dx + dy * dy) / VIDEO_SHELL_WIDTH_RPX * 100
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  return {
    left: `${from.x * 100}%`,
    top: `${from.y * 100}%`,
    width: `${width}%`,
    transform: `rotate(${angle}deg)`,
  }
}

export default function ReportDetailPage() {
  const router = useRouter()
  const reportId = router.params.id || ''
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
  const [exportingPdf, setExportingPdf] = useState(false)
  const [videoTimeSec, setVideoTimeSec] = useState(0)

  useEffect(() => {
    if (!reportId) {
      setLoading(false)
      Taro.showToast({ title: '未找到报告', icon: 'none' })
      Taro.redirectTo({ url: '/pages/reports/index' }).catch(() => {
        Taro.switchTab({ url: '/pages/reports/index' })
      })
      return
    }
    reportService.getReport(reportId)
      .then(r => { setReport(r); setLoading(false) })
      .catch(() => {
        setLoading(false)
        Taro.showToast({ title: '加载失败', icon: 'error' })
      })
  }, [reportId])

  async function downloadReportPdf() {
    if (!report) throw new Error('REPORT_EMPTY')
    const token = Taro.getStorageSync('token') || ''
    const download = await Taro.downloadFile({
      url: reportService.getReportPdfUrl(report.id),
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
    if (download.statusCode && download.statusCode >= 400) {
      throw new Error(`PDF ${download.statusCode}`)
    }
    return download.tempFilePath
  }

  async function previewReportPdf() {
    Taro.showLoading({ title: '生成 PDF' })
    try {
      const filePath = await downloadReportPdf()
      await Taro.openDocument({
        filePath,
        fileType: 'pdf',
      })
    } catch {
      Taro.showToast({ title: 'PDF 打开失败，请重试', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  async function shareReportPdf() {
    Taro.showLoading({ title: '准备转发' })
    try {
      const filePath = await downloadReportPdf()
      const shareFileMessage = (Taro as any).shareFileMessage
      if (typeof shareFileMessage !== 'function') {
        throw new Error('SHARE_FILE_UNSUPPORTED')
      }
      await shareFileMessage({
        filePath,
        fileName: `SOAI-EQ-${report?.trainingDate || 'report'}.pdf`,
      })
    } catch {
      Taro.showToast({ title: '当前微信版本不支持文件转发', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  async function handleExportPdf() {
    if (!report || exportingPdf) return
    setExportingPdf(true)
    try {
      const action = await Taro.showActionSheet({
        itemList: ['预览完整 PDF', '转发 PDF 给好友'],
      })
      if (action.tapIndex === 0) await previewReportPdf()
      if (action.tapIndex === 1) await shareReportPdf()
    } catch {
      // User cancelled the action sheet.
    } finally {
      setExportingPdf(false)
    }
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
  const currentOverlayFrame = getCurrentOverlayFrame(report, videoTimeSec)
  const currentRiderPoints = getRiderPoints(currentOverlayFrame)
  const currentJointPoints = getRiderJointPoints(currentOverlayFrame)
  const currentRiderLines = getRiderLines(currentOverlayFrame)

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
              objectFit='contain'
              className='training-video'
              onTimeUpdate={(e) => setVideoTimeSec(e.detail.currentTime)}
            />
            {currentRiderPoints.length > 0 && (
              <CoverView className='pose-cover-layer'>
                {currentRiderLines.map((line) => (
                  <CoverView
                    key={line.key}
                    className={`pose-cover-line pose-cover-line-${line.segment}`}
                    style={getLineStyle(line, currentOverlayFrame)}
                  />
                ))}
                {currentJointPoints.map(({ key, point }) => (
                  <CoverView
                    key={key}
                    className={`pose-cover-joint pose-cover-${getPointSegment(key)}`}
                    style={getPointStyle(point, currentOverlayFrame)}
                  >
                    <CoverView className='pose-cover-dot' />
                  </CoverView>
                ))}
                {currentRiderPoints.map(({ key, label, point }) => (
                  <CoverView
                    key={`label-${key}`}
                    className={`pose-cover-point pose-cover-${getPointSegment(key)}`}
                    style={getPointStyle(point, currentOverlayFrame)}
                  >
                    <CoverView className='pose-cover-label'>{label}</CoverView>
                  </CoverView>
                ))}
              </CoverView>
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
          <View className='vmtag'>{hasPoseOverlayVideo(report) || shouldShowPoseOverlay(report) ? '真实姿态跟随' : '仅视频回放'}</View>
          <View className='vmtag'>15 秒内</View>
        </View>
        {report.videoVisibleToday && report.videoUrl && !hasPoseOverlayVideo(report) && !shouldShowPoseOverlay(report) && (
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
          <View className='analytics-score-overlay'>
            <View className='analytics-overall-score'>
              <Text className='analytics-overall-value'>{report.overallScore}</Text>
              <Text className='analytics-overall-label'>/100</Text>
            </View>
            {scoreEntries.slice(0, 4).map(([name, value]) => (
              <View key={name} className='analytics-score-item'>
                <Text className='analytics-score-name'>{name}</Text>
                <Text className='analytics-score-value'>{value}</Text>
                <View className='analytics-score-track'>
                  <View className='analytics-score-fill' style={{ width: `${value}%` }} />
                </View>
              </View>
            ))}
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

        <View className={`save-btn ${exportingPdf ? 'save-btn-disabled' : ''}`} onClick={handleExportPdf}>
          <Text>PDF</Text>
          <Text>{exportingPdf ? '处理中' : '预览或转发完整 PDF'}</Text>
        </View>

        <View className='report-bottom-actions'>
          <View className='btn btn-secondary' onClick={goHome}>返回首页</View>
        </View>
      </View>
    </View>
  )
}
