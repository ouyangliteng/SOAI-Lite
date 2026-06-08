import { listReports, getReport } from '../../src/services/mock/reports'

test('listReports returns array with items', async () => {
  const list = await listReports()
  expect(list.length).toBeGreaterThan(0)
  expect(list[0]).toHaveProperty('overallScore')
  expect(list[0]).toHaveProperty('trainingDate')
})

test('getReport returns full report with correct id', async () => {
  const report = await getReport('report_mock_001')
  expect(report.id).toBe('report_mock_001')
  expect(report.scores).toHaveProperty('postureControl')
  expect(report.jointAngles.length).toBeGreaterThan(0)
})
