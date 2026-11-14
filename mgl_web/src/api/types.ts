export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  phone: string
}

export interface ProfileLocation {
  state: string
  district: string
  town: string
  pinCode: string
}

export interface Profile {
  id: string
  phone: string
  fullName: string
  preferredLanguage: string | null
  photoUrl: string | null
  dateOfBirth: string | null
  gender: string | null
  location: ProfileLocation | null
  skills: string[]
  skillExperience: Record<string, string>
  preferredWorkLocation: string | null
  preferredWorkTypes: string[]
  willingToRelocate: boolean | null
  availability: string | null
  governmentIdType: string | null
  workerId: string | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
  isEmployer: boolean
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  description: string
  location: string
  skillsRequired: string[]
  wageMin: number
  wageMax: number
  wagePeriod: 'daily' | 'monthly'
  employerName: string
  distanceKm: number
  openings: number
  isUrgent: boolean
  status: 'open' | 'closed'
  createdAt: string
}

export interface Application {
  id: string
  applicationId: string
  jobId: string
  profileId: string
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected'
  appliedAt: string
}

export interface Applicant {
  id: string
  applicationId: string
  jobId: string
  status: Application['status']
  appliedAt: string
  workerId: string | null
  fullName: string
  phone: string
  skills: string[]
  verificationStatus: Profile['verificationStatus']
}

export interface EmployerProfile {
  id: string
  profileId: string
  companyName: string
  companyDescription: string
  website: string | null
  gstin: string | null
  contactName: string | null
  contactPhone: string | null
  city: string | null
  createdAt: string
}

export interface RecentRegistration {
  displayName: string
  skill: string | null
  locationState: string | null
  verificationStatus: Profile['verificationStatus']
}

export interface WorkerSearchResult {
  id: string
  workerId: string | null
  fullName: string
  skills: string[]
  locationTown: string | null
  locationDistrict: string | null
  locationState: string | null
  verificationStatus: Profile['verificationStatus']
}

export interface Document {
  id: string
  profileId: string
  docType: 'id_proof' | 'certificate' | 'other'
  fileUrl: string
  status: Profile['verificationStatus']
  uploadedAt: string
}

export interface AdminDocument extends Document {
  workerId: string | null
  fullName: string
  phone: string
}

export interface AdminApplication {
  id: string
  applicationId: string
  jobId: string
  jobTitle: string
  profileId: string
  status: Application['status']
  appliedAt: string
  workerId: string | null
  fullName: string
  phone: string
}
