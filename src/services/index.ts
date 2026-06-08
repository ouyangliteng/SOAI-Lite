import * as mockAuth from './mock/auth'
import * as mockUpload from './mock/upload'
import * as mockAnalysis from './mock/analysis'
import * as mockReports from './mock/reports'

import * as realAuth from './api/auth'
import * as realUpload from './api/upload'
import * as realAnalysis from './api/analysis'
import * as realReports from './api/reports'

const USE_MOCK = process.env.USE_MOCK !== 'false'

export const authService     = USE_MOCK ? mockAuth : realAuth
export const uploadService   = USE_MOCK ? mockUpload   : realUpload
export const analysisService = USE_MOCK ? mockAnalysis : realAnalysis
export const reportService   = USE_MOCK ? mockReports  : realReports
