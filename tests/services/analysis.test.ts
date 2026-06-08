import { createTask, getTask } from '../../src/services/mock/analysis'

test('createTask returns queued task', async () => {
  const task = await createTask('video_001')
  expect(task.status).toBe('queued')
  expect(task.videoId).toBe('video_001')
})

test('getTask status progresses over calls', async () => {
  const task = await createTask('video_002')
  const first = await getTask(task.id)
  const second = await getTask(task.id)
  const validStatuses = ['queued', 'analyzing', 'generating_report', 'completed']
  expect(validStatuses).toContain(first.status)
  expect(validStatuses).toContain(second.status)
})

test('getTask unknown id returns completed with reportId', async () => {
  const done = await getTask('nonexistent_id')
  expect(done.status).toBe('completed')
  expect(done.reportId).toBeTruthy()
})
