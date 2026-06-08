import { useReportStore } from '../../src/store/reportStore'

beforeEach(() => {
  useReportStore.setState({ currentReportId: null, currentTaskId: null })
})

test('initial state is null ids', () => {
  const s = useReportStore.getState()
  expect(s.currentReportId).toBeNull()
  expect(s.currentTaskId).toBeNull()
})

test('setCurrentTaskId updates taskId', () => {
  useReportStore.getState().setCurrentTaskId('task_001')
  expect(useReportStore.getState().currentTaskId).toBe('task_001')
})

test('setCurrentReportId updates reportId', () => {
  useReportStore.getState().setCurrentReportId('report_001')
  expect(useReportStore.getState().currentReportId).toBe('report_001')
})
