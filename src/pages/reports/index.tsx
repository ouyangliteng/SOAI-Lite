import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, getCurrentInstance } from '@tarojs/taro'
import { reportService } from '../../services'
import type { ReportListItem } from '../../services/types'
import './index.scss'

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(async () => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(1) } catch {}
    setLoading(true)
    const list = await reportService.listReports().catch(() => [])
    setReports([...list].sort((a, b) => b.trainingDate.localeCompare(a.trainingDate)))
    setLoading(false)
  })

  if (loading) {
    return <View className='page'><View className='empty-state'>加载中…</View></View>
  }

  return (
    <View className='page'>
      <View className='section-title'>训练报告</View>
      {reports.length === 0 ? (
        <View className='empty-state'>暂无报告，上传视频后生成</View>
      ) : (
        reports.map(r => (
          <View
            key={r.id}
            className='report-item'
            onClick={() => Taro.navigateTo({ url: `/pages/report-detail/index?id=${r.id}` })}
          >
            <View className='row'>
              <View>
                <Text className='report-item-score'>{r.overallScore}</Text>
                <Text className='score-unit'>分</Text>
              </View>
              <View style={{ textAlign: 'right' }}>
                <View className='report-item-date'>{r.trainingDate}</View>
                {r.riskCount > 0 && (
                  <View className='report-risk-badge' style={{ marginTop: '6rpx' }}>
                    风险 {r.riskCount}
                  </View>
                )}
              </View>
            </View>
            <View className='report-item-text'>{r.oneLineConclusion}</View>
          </View>
        ))
      )}
    </View>
  )
}
