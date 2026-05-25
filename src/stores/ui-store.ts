import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  postSort: "hot" | "new" | "top" | "rising"
  setPostSort: (sort: "hot" | "new" | "top" | "rising") => void

  postTimeFilter: "all" | "day" | "week" | "month" | "year"
  setPostTimeFilter: (filter: "all" | "day" | "week" | "month" | "year") => void

  feedType: "home" | "popular" | "all"
  setFeedType: (type: "home" | "popular" | "all") => void

  compactMode: boolean
  setCompactMode: (compact: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      postSort: "hot",
      setPostSort: (postSort) => set({ postSort }),

      postTimeFilter: "all",
      setPostTimeFilter: (postTimeFilter) => set({ postTimeFilter }),

      feedType: "home",
      setFeedType: (feedType) => set({ feedType }),

      compactMode: false,
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    { name: "nexus-ui-store", partialize: (s) => ({ compactMode: s.compactMode, postSort: s.postSort }) }
  )
)
