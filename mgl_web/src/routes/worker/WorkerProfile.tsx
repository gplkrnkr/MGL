import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  completeRegistration,
  getRecentRegistrations,
  listDocuments,
  updateMyProfile,
  uploadDocument,
} from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { Field } from '../../components/ui/Field'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../context/AuthContext'
import { workerNavItems } from './nav'

const STEPS = ['Basic Info', 'Location & Skill', 'ID Verification']

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const n = i + 1
        const filled = n <= current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  filled ? 'bg-primary text-text-inverse' : 'bg-primary-light text-text-muted'
                }`}
              >
                {n}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${n === current ? 'text-primary' : 'text-text-muted'}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && <div className="w-10 sm:w-16 h-px bg-border mx-2 mb-5" />}
          </div>
        )
      })}
    </div>
  )
}

export function WorkerProfile() {
  const { profile, refresh } = useAuth()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage ?? 'en')
  const [skillsInput, setSkillsInput] = useState(profile?.skills.join(', ') ?? '')
  const [locationState, setLocationState] = useState(profile?.location?.state ?? '')
  const [locationDistrict, setLocationDistrict] = useState(profile?.location?.district ?? '')
  const [locationTown, setLocationTown] = useState(profile?.location?.town ?? '')
  const [locationPinCode, setLocationPinCode] = useState(profile?.location?.pinCode ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const skills = skillsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const buildPayload = () => ({
    fullName,
    preferredLanguage,
    skills,
    location:
      locationState || locationDistrict || locationTown || locationPinCode
        ? {
            state: locationState,
            district: locationDistrict,
            town: locationTown,
            pinCode: locationPinCode,
          }
        : null,
  })

  const saveMutation = useMutation({
    mutationFn: () => updateMyProfile(buildPayload()),
    onSuccess: async () => {
      await refresh()
      queryClient.invalidateQueries()
    },
  })

  const completeMutation = useMutation({
    mutationFn: completeRegistration,
    onSuccess: async () => {
      await refresh()
      queryClient.invalidateQueries()
    },
  })

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
    enabled: !profile?.workerId,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument('id_proof', file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  const recentRegistrationsQuery = useQuery({
    queryKey: ['recent-registrations'],
    queryFn: getRecentRegistrations,
    enabled: !profile?.workerId,
  })

  if (!profile) return null

  const registered = Boolean(profile.workerId)

  if (registered) {
    return (
      <PortalLayout title="Find work" homeTo="/jobs" navItems={workerNavItems}>
        <h1 className="text-2xl font-bold text-text mb-4">My profile</h1>
        <Card className="max-w-md flex flex-col gap-4">
          <TextField label="Phone" value={profile.phone} disabled />
          <TextField label="Worker ID" value={profile.workerId!} disabled />
          <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <TextField label="State" value={locationState} onChange={(e) => setLocationState(e.target.value)} />
          <TextField label="District" value={locationDistrict} onChange={(e) => setLocationDistrict(e.target.value)} />
          <TextField label="Town" value={locationTown} onChange={(e) => setLocationTown(e.target.value)} />
          <TextField label="Pin code" value={locationPinCode} onChange={(e) => setLocationPinCode(e.target.value)} />
          <TextField
            label="Skills (comma-separated)"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="construction, electrical, loading"
          />
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-fit">
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {saveMutation.isSuccess && <p className="text-sm text-success">Saved.</p>}
          {saveMutation.isError && <ErrorBanner message="Couldn't save your profile. Try again." />}
        </Card>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title="Find work" homeTo="/jobs" navItems={workerNavItems}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text mb-1 text-center">Complete your registration</h1>
        <p className="text-text-muted mb-6 text-center">Create your MGL worker ID.</p>

        <StepIndicator current={step} />

        <Card className="flex flex-col gap-5 p-6">
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-primary text-center mb-1">Personal Details</h2>
              <Field label="Preferred language">
                <select
                  className="h-14 px-4 rounded-lg border border-border bg-background text-text focus:outline-none focus:border-primary"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Phone number">
                <TextField value={profile.phone} disabled />
              </Field>
              <Field label="Full name">
                <TextField
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per Aadhaar"
                />
              </Field>
              <Button
                onClick={() => saveMutation.mutate(undefined, { onSuccess: () => setStep(2) })}
                disabled={!fullName.trim() || saveMutation.isPending}
                className="w-fit self-center"
              >
                {saveMutation.isPending ? 'Saving…' : 'Next →'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-primary text-center mb-1">Location & Skill</h2>
              <Field label="State">
                <TextField value={locationState} onChange={(e) => setLocationState(e.target.value)} />
              </Field>
              <Field label="District">
                <TextField value={locationDistrict} onChange={(e) => setLocationDistrict(e.target.value)} />
              </Field>
              <Field label="Town">
                <TextField value={locationTown} onChange={(e) => setLocationTown(e.target.value)} />
              </Field>
              <Field label="Pin code">
                <TextField value={locationPinCode} onChange={(e) => setLocationPinCode(e.target.value)} />
              </Field>
              <Field label="Skills (comma-separated)">
                <TextField
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="construction, electrical, loading"
                />
              </Field>
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" onClick={() => setStep(1)} className="w-fit">
                  ← Back
                </Button>
                <Button
                  onClick={() => saveMutation.mutate(undefined, { onSuccess: () => setStep(3) })}
                  disabled={!locationState.trim() || !locationTown.trim() || skills.length === 0 || saveMutation.isPending}
                  className="w-fit"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Next →'}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-bold text-primary text-center mb-1">ID Verification</h2>
              <p className="text-sm text-text-muted text-center">
                Upload a photo of your Aadhaar or another government ID for verification.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="mx-auto"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                }}
              />
              {uploadMutation.isPending && <p className="text-sm text-text-muted text-center">Uploading…</p>}
              {uploadMutation.isError && <ErrorBanner message="Couldn't upload the document. Try again." />}

              {documentsQuery.data && documentsQuery.data.length > 0 && (
                <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
                  {documentsQuery.data.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm">
                      <span className="text-text">{doc.docType.replace('_', ' ')}</span>
                      <Badge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="secondary" onClick={() => setStep(2)} className="w-fit">
                  ← Back
                </Button>
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="w-fit"
                >
                  {completeMutation.isPending ? 'Generating…' : 'Generate worker ID'}
                </Button>
              </div>
              {completeMutation.isError && (
                <ErrorBanner message="Couldn't generate your worker ID. Make sure your name, location and skills are filled in." />
              )}
              {completeMutation.isSuccess && completeMutation.data.workerId && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border items-center">
                  <p className="text-success font-semibold">Your worker ID: {completeMutation.data.workerId}</p>
                  <Link to="/jobs">
                    <Button className="w-fit">Continue to jobs</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </Card>

        {recentRegistrationsQuery.data && recentRegistrationsQuery.data.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-bold tracking-widest text-text-muted uppercase text-center mb-3">
              Recent registrations
            </p>
            <div className="flex flex-col gap-2">
              {recentRegistrationsQuery.data.map((r, i) => (
                <Card key={i} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-text">{r.displayName}</span>
                    <span className="text-sm text-text-muted">
                      {' '}
                      {[r.skill, r.locationState].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <Badge status={r.verificationStatus} />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
