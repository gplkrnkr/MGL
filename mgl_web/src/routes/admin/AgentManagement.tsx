import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage, grantAgent, listAgents, revokeAgent } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { TextField } from '../../components/ui/TextField'
import { adminNavItems } from './nav'

export function AgentManagement() {
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState('')
  const agents = useQuery({ queryKey: ['admin-agents'], queryFn: listAgents })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-agents'] })

  const grantMutation = useMutation({
    mutationFn: () => grantAgent(phone),
    onSuccess: () => {
      setPhone('')
      refresh()
    },
  })
  const revokeMutation = useMutation({ mutationFn: revokeAgent, onSuccess: refresh })

  return (
    <PortalLayout title="Admin" navItems={adminNavItems}>
      <h1 className="text-2xl font-bold text-text mb-1">Field agents</h1>
      <p className="text-sm text-text-muted mb-4 max-w-2xl">
        Agents can register workers on their behalf. The person must have signed in once (at{' '}
        <code>/agent/login</code>) before you can give them agent access.
      </p>

      <Card className="max-w-2xl mb-6">
        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            grantMutation.mutate()
          }}
        >
          <TextField
            label="Mobile number"
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={grantMutation.isPending}>
            {grantMutation.isPending ? 'Adding…' : 'Make agent'}
          </Button>
        </form>
        {grantMutation.isError && (
          <div className="mt-2">
            <ErrorBanner message={apiErrorMessage(grantMutation.error, "Couldn't add this agent.")} />
          </div>
        )}
      </Card>

      {agents.isLoading && <p className="text-text-muted">Loading…</p>}
      {agents.isError && <ErrorBanner message="Couldn't load agents. Try refreshing the page." />}
      {agents.data?.length === 0 && <p className="text-text-muted">No agents yet.</p>}
      <div className="flex flex-col gap-2 max-w-2xl">
        {agents.data?.map((agent) => (
          <Card key={agent.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">{agent.fullName || agent.phone}</p>
              <p className="text-sm text-text-muted">{agent.phone}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => revokeMutation.mutate(agent.id)}
              disabled={revokeMutation.isPending}
            >
              Remove agent access
            </Button>
          </Card>
        ))}
      </div>
    </PortalLayout>
  )
}
