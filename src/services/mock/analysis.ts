import type { AnalysisTask, AnalysisStatus } from '../types'

const tasks = new Map<string, { task: AnalysisTask; callCount: number }>()

const PROGRESS: { status: AnalysisStatus; text: string }[] = [
  { status: 'queued',             text: '排队等待中…' },
  { status: 'analyzing',         text: 'AI 分析骨骼关键点…' },
  { status: 'analyzing',         text: '计算关节角度和节奏…' },
  { status: 'generating_report', text: '生成报告内容…' },
  { status: 'completed',         text: '分析完成' },
]

export async function createTask(videoId: string): Promise<AnalysisTask> {
  await delay(200)
  const id = `task_${Date.now()}`
  const task: AnalysisTask = {
    id,
    videoId,
    status: 'queued',
    progressText: '排队等待中…',
    createdAt: new Date().toISOString(),
  }
  tasks.set(id, { task, callCount: 0 })
  return { ...task }
}

export async function getTask(taskId: string): Promise<AnalysisTask> {
  await delay(200)
  const entry = tasks.get(taskId)
  if (!entry) {
    return {
      id: taskId,
      videoId: 'unknown',
      status: 'completed',
      progressText: '分析完成',
      reportId: 'report_mock_001',
      createdAt: new Date().toISOString(),
    }
  }
  const step = Math.min(entry.callCount, PROGRESS.length - 1)
  const p = PROGRESS[step]
  entry.callCount++
  entry.task.status = p.status
  entry.task.progressText = p.text
  if (p.status === 'completed') {
    entry.task.reportId = 'report_mock_001'
  }
  return { ...entry.task }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
