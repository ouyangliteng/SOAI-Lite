import { create } from 'zustand'

interface ReportState {
  currentTaskId: string | null
  currentReportId: string | null
  setCurrentTaskId: (id: string) => void
  setCurrentReportId: (id: string) => void
  clearTask: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  currentTaskId: null,
  currentReportId: null,
  setCurrentTaskId: (id) => set({ currentTaskId: id }),
  setCurrentReportId: (id) => set({ currentReportId: id }),
  clearTask: () => set({ currentTaskId: null }),
}))
