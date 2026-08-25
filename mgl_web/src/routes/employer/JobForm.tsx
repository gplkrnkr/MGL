import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createJob, getJob, updateJob } from '../../api/client'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { TextField } from '../../components/ui/TextField'
import { employerNavItems } from './nav'

export function JobForm() {
  const { jobId } = useParams<{ jobId: string }>()
  const isEdit = !!jobId
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existingJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: isEdit,
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [wageMin, setWageMin] = useState('0')
  const [wageMax, setWageMax] = useState('0')
  const [openings, setOpenings] = useState('1')
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title)
      setDescription(existingJob.description)
      setLocation(existingJob.location)
      setWageMin(String(existingJob.wageMin))
      setWageMax(String(existingJob.wageMax))
      setOpenings(String(existingJob.openings))
      setIsUrgent(existingJob.isUrgent)
    }
  }, [existingJob])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description,
        location,
        wageMin: Number(wageMin),
        wageMax: Number(wageMax),
        openings: Number(openings),
        isUrgent,
      }
      return isEdit ? updateJob(jobId!, payload) : createJob(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      navigate('/employer')
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => updateJob(jobId!, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
      navigate('/employer')
    },
  })

  return (
    <AppShell portalTitle="Employer dashboard" portalNavItems={employerNavItems}>
      <h1 className="text-2xl font-bold text-text mb-4">{isEdit ? 'Edit job' : 'Post a job'}</h1>
      <Card className="max-w-lg flex flex-col gap-4">
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text">Description</span>
          <textarea
            className="min-h-28 px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:border-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <TextField
            label="Wage min"
            type="number"
            value={wageMin}
            onChange={(e) => setWageMin(e.target.value)}
          />
          <TextField
            label="Wage max"
            type="number"
            value={wageMax}
            onChange={(e) => setWageMax(e.target.value)}
          />
          <TextField
            label="Openings"
            type="number"
            value={openings}
            onChange={(e) => setOpenings(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
          <span className="text-sm text-text">Urgent requirement</span>
        </label>
        <div className="flex gap-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title}>
            {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Post job'}
          </Button>
          {isEdit && existingJob?.status === 'open' && (
            <Button
              variant="secondary"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? 'Closing…' : 'Close job'}
            </Button>
          )}
        </div>
        {(saveMutation.isError || closeMutation.isError) && (
          <ErrorBanner message="Couldn't save this job. Try again." />
        )}
      </Card>
    </AppShell>
  )
}
