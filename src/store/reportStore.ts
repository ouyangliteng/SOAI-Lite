import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface ReportState {
  currentTaskId: string | null
  currentReportId: string | null
  setCurrentTaskId: (id: string) => void
  setCurrentReportId: (id: string) => void
  clearTask: () => void
}

const CURRENT_TASK_KEY = 'soai_current_task_id'
const CURRENT_REPORT_KEY = 'soai_current_report_id'

function readStorage(key: string): string | null {
  try {
    return Taro.getStorageSync(key) || null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value) {
      Taro.setStorageSync(key, value)
    } else {
      Taro.removeStorageSync(key)
    }
  } catch {
    // Storage can fail in dev tools edge cases; in-memory state still works.
  }
}

export const useReportStore = create<ReportState>((set) => ({
  currentTaskId: readStorage(CURRENT_TASK_KEY),
  currentReportId: readStorage(CURRENT_REPORT_KEY),
  setCurrentTaskId: (id) => {
    writeStorage(CURRENT_TASK_KEY, id)
    set({ currentTaskId: id })
  },
  setCurrentReportId: (id) => {
    writeStorage(CURRENT_REPORT_KEY, id)
    writeStorage(CURRENT_TASK_KEY, null)
    set({ currentReportId: id, currentTaskId: null })
  },
  clearTask: () => {
    writeStorage(CURRENT_TASK_KEY, null)
    set({ currentTaskId: null })
  },
}))
