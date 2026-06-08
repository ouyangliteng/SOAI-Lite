import { useState, useEffect } from 'react'
import { View, Text, Image, Video } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { reportService } from '../../services'
import type { TrainingReport } from '../../services/types'
import './index.scss'

type NavTab = 'problems' | 'risks' | 'improvements'
const TAB_LABELS: Record<NavTab, string> = { problems: '问题点', risks: '风险点', improvements: '进步' }

export default function ReportDetailPage() {
  const router = useRouter()
  const reportId = router.params.id ?? 'report_mock_001'
  const [report, setReport] = useState<TrainingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NavTab>('problems')

  useEffect(() => {
    reportService.getReport(reportId)
      .then(r => { setReport(r); setLoading(false) })
      .catch(() => {
        setLoading(false)
        Taro.showToast({ title: '加载失败', icon: 'error' })
      })
  }, [reportId])

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

  return (
    <View>
      {/* 得分头部 */}
      <View style={{ padding: '28rpx 28rpx 0' }}>
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
          <Video
            src={report.videoUrl}
            controls
            showFullscreenBtn
            initialTime={0}
            style={{ width: '100%', borderRadius: '16rpx' }}
          />
        ) : (
          <View className='video-expired-placeholder'>
            <Text style={{ fontSize: '48rpx' }}>🎬</Text>
            <Text>视频已于次日自动删除</Text>
            <Text style={{ fontSize: '22rpx' }}>姿态数据已保留</Text>
          </View>
        )}
        <View className='video-meta-tags'>
          <View className='vmtag'>训练片段</View>
          <View className='vmtag'>AI 精华截取</View>
          <View className='vmtag'>100MB 以内</View>
        </View>
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

          <View className='angle-chips'>
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

          <View className='metrics-bar'>
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
      </View>

      {/* 内容 Tab */}
      <View style={{ padding: '0 28rpx 100rpx' }}>
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
          {activeTab === 'problems' && report.problemPoints.map((p, i) => (
            <View key={i} className='problem-item'>
              <Text className='problem-dot'>•</Text>
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

        {activeTab === 'problems' && (
          <View className='card' style={{ marginTop: '28rpx' }}>
            <View className='muted'>下次训练重点</View>
            <View style={{ marginTop: '12rpx', color: '#e6edf3', fontSize: '28rpx', lineHeight: '1.6' }}>
              {report.nextTrainingFocus}
            </View>
          </View>
        )}

        <View className='save-btn' onClick={handleSaveScreenshot}>
          <Text>📥</Text>
          <Text>保存报告截图到相册</Text>
        </View>
      </View>
    </View>
  )
}
