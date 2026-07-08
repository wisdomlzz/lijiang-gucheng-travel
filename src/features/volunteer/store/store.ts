import { create } from "zustand"
import type { VolunteerState } from "./types"
import { createVolunteerSlice } from "./volunteer-store"
import { createActivitySlice } from "./activity-store"
import { createSignUpSlice } from "./signup-store"
import { createDailyRecordSlice } from "./daily-record-store"
import { seedVolunteers, seedActivities, seedSignUps, seedDailyRecords } from "./seed"
import { initTimerStore } from "./timers"

export const useVolunteerStore = create<VolunteerState>((set, get) => ({
  volunteers: seedVolunteers,
  activities: seedActivities,
  signUps: seedSignUps,
  dailyRecords: seedDailyRecords,

  ...createVolunteerSlice(set, get),
  ...createActivitySlice(set, get),
  ...createSignUpSlice(set, get),
  ...createDailyRecordSlice(set, get),
}))

// Wire timers to the store (avoid circular dependency)
initTimerStore(useVolunteerStore)

// auto-start timers
if (typeof window !== "undefined") {
  useVolunteerStore.getState().startActivityTimers()
}