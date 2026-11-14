import axios from 'axios'
import { API_BASE_URL } from '../lib/config'
import { clearToken, getToken } from '../lib/session'
import type {
  AdminApplication,
  AdminDocument,
  Applicant,
  Application,
  Document,
  EmployerProfile,
  Job,
  Profile,
  RecentRegistration,
  TokenResponse,
  WorkerSearchResult,
} from './types'

export const http = axios.create({ baseURL: API_BASE_URL })

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
      clearToken()
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.assign('/')
      }
    }
    return Promise.reject(error)
  },
)

// ---- Auth ----

// Exchanges a Firebase phone-auth ID token (see lib/phoneAuth.ts) for the backend's session.
export const verifyFirebaseToken = (idToken: string) =>
  http.post<TokenResponse>('/api/auth/firebase/verify', { idToken }).then((r) => r.data)

// ---- Profile ----

export const getMyProfile = () => http.get<Profile>('/api/profile/me').then((r) => r.data)

export const selectEmployerRole = () =>
  http.post<Profile>('/api/profile/me/role', { role: 'employer' }).then((r) => r.data)

export const updateMyProfile = (payload: Partial<Profile>) =>
  http.put<Profile>('/api/profile/me', payload).then((r) => r.data)

export const completeRegistration = () =>
  http.post<Profile>('/api/profile/me/complete-registration').then((r) => r.data)

export const getRecentRegistrations = () =>
  http.get<RecentRegistration[]>('/api/profile/recent-registrations').then((r) => r.data)

export const lookupWorker = (workerId: string) =>
  http
    .get<RecentRegistration>('/api/profile/lookup', { params: { worker_id: workerId } })
    .then((r) => r.data)

// ---- Documents ----

export const listDocuments = () => http.get<Document[]>('/api/documents').then((r) => r.data)

export const uploadDocument = (docType: string, file: File) => {
  const form = new FormData()
  form.append('doc_type', docType)
  form.append('file', file)
  return http.post<Document>('/api/documents', form).then((r) => r.data)
}

// ---- Jobs (public / worker) ----

export const listJobs = () => http.get<Job[]>('/api/jobs').then((r) => r.data)

export const getJob = (jobId: string) => http.get<Job>(`/api/jobs/${jobId}`).then((r) => r.data)

// ---- Applications (worker) ----

export const listMyApplications = () =>
  http.get<Application[]>('/api/applications/me').then((r) => r.data)

export const applyToJob = (jobId: string) =>
  http.post<Application>('/api/applications', { jobId }).then((r) => r.data)

// ---- Employer ----

export const getEmployerProfile = () =>
  http.get<EmployerProfile>('/api/employer/me').then((r) => r.data)

export const updateEmployerProfile = (payload: Partial<EmployerProfile>) =>
  http.put<EmployerProfile>('/api/employer/me', payload).then((r) => r.data)

export interface JobCreateInput {
  title: string
  description?: string
  location?: string
  skillsRequired?: string[]
  wageMin?: number
  wageMax?: number
  wagePeriod?: 'daily' | 'monthly'
  openings?: number
  isUrgent?: boolean
}

export const listMyJobs = () => http.get<Job[]>('/api/employer/jobs').then((r) => r.data)

export interface WorkerSearchParams {
  skill?: string
  location?: string
  verifiedOnly?: boolean
}

export const searchWorkers = (params: WorkerSearchParams) =>
  http
    .get<WorkerSearchResult[]>('/api/employer/workers', {
      params: {
        skill: params.skill || undefined,
        location: params.location || undefined,
        verified_only: params.verifiedOnly || undefined,
      },
    })
    .then((r) => r.data)

export const createJob = (payload: JobCreateInput) =>
  http.post<Job>('/api/employer/jobs', payload).then((r) => r.data)

export const updateJob = (jobId: string, payload: Partial<JobCreateInput & { status: Job['status'] }>) =>
  http.patch<Job>(`/api/employer/jobs/${jobId}`, payload).then((r) => r.data)

export const listApplicants = (jobId: string) =>
  http.get<Applicant[]>(`/api/employer/jobs/${jobId}/applicants`).then((r) => r.data)

export const updateApplicantStatus = (applicationId: string, status: Application['status']) =>
  http
    .patch<Applicant>(`/api/employer/applications/${applicationId}`, { status })
    .then((r) => r.data)

// ---- Admin ----

export const listAllDocuments = () =>
  http.get<AdminDocument[]>('/api/admin/documents').then((r) => r.data)

export const updateAdminDocumentStatus = (documentId: string, status: Document['status']) =>
  http.patch<AdminDocument>(`/api/admin/documents/${documentId}`, { status }).then((r) => r.data)

export const listAllApplications = () =>
  http.get<AdminApplication[]>('/api/admin/applications').then((r) => r.data)

export const updateAdminApplicationStatus = (
  applicationId: string,
  status: Application['status'],
) =>
  http
    .patch<AdminApplication>(`/api/admin/applications/${applicationId}`, { status })
    .then((r) => r.data)
