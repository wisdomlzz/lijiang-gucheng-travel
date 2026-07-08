import type {
  Volunteer,
  VolunteerActivity,
  VolunteerSignUp,
  VolunteerDailyRecord,
} from "@/shared/types"

export type VolunteerState = {
  volunteers: Volunteer[]
  activities: VolunteerActivity[]
  signUps: VolunteerSignUp[]
  dailyRecords: VolunteerDailyRecord[]

  // volunteer certification
  register: (
    userId: string,
    name: string,
    phone: string,
    politicalStatus: string,
    workUnit: string,
    credentialImages: string[]
  ) => { ok: boolean; msg: string }
  getByUserId: (userId: string) => Volunteer | undefined
  approveVolunteer: (volunteerId: string) => { ok: boolean; msg: string }
  rejectVolunteer: (volunteerId: string, reason: string) => { ok: boolean; msg: string }
  resubmitVolunteer: (volunteerId: string, credentialImages: string[]) => { ok: boolean; msg: string }
  searchVolunteers: (keyword: string) => Volunteer[]
  demoApprove: (volunteerId: string) => { ok: boolean; msg: string }

  // activity lifecycle
  addActivity: (act: Omit<VolunteerActivity, "id" | "createdAt" | "status">) => string
  editActivity: (activityId: string, fields: Partial<Omit<VolunteerActivity, "id" | "createdAt" | "status">>) => void
  publishActivity: (activityId: string) => { ok: boolean; msg: string }
  cancelActivity: (activityId: string) => { ok: boolean; msg: string }
  forceEndActivity: (activityId: string) => { ok: boolean; msg: string }
  deleteActivity: (activityId: string) => void

  // sign-up (creates daily records)
  signUp: (volunteerId: string, activityId: string) => { ok: boolean; msg: string }
  cancelSignUp: (signUpId: string) => { ok: boolean; msg: string }

  // daily check-in / check-out
  checkIn: (dailyRecordId: string) => { ok: boolean; msg: string }
  checkOut: (dailyRecordId: string) => { ok: boolean; msg: string }

  // admin resolve daily abnormal
  resolveAbnormal: (
    dailyRecordId: string,
    checkInTime: string,
    checkOutTime: string,
    reviewNote: string
  ) => { ok: boolean; msg: string }

  // helpers
  getSignUpCount: (activityId: string) => number
  getActiveSignUps: (volunteerId: string) => VolunteerSignUp[]
  getDailyRecords: (signUpId: string) => VolunteerDailyRecord[]
  getDailyRecordsByActivity: (activityId: string) => VolunteerDailyRecord[]
  getServiceHours: (volunteerId: string, activityId: string) => number
  getTimeConflicts: (volunteerId: string, activityId: string) => string[]

  startActivityTimers: () => void
  clearAllTimers: () => void
}