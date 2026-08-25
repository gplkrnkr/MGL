import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAllDocuments, updateAdminDocumentStatus } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { API_ORIGIN } from '../../lib/config'
import type { Document } from '../../api/types'
import { adminNavItems } from './nav'

const STATUS_OPTIONS: Document['status'][] = ['pending', 'verified', 'rejected']

export function DocumentReview() {
  const queryClient = useQueryClient()

  const {
    data: documents,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['admin-documents'], queryFn: listAllDocuments })

  const statusMutation = useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: Document['status'] }) =>
      updateAdminDocumentStatus(documentId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-documents'] }),
  })

  return (
    <PortalLayout title="Admin" navItems={adminNavItems}>
      <h1 className="text-2xl font-bold text-text mb-4">Document review</h1>

      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load documents. Try refreshing the page." />}
      <div className="flex flex-col gap-2 max-w-2xl">
        {documents?.map((doc) => (
          <Card key={doc.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">{doc.fullName || doc.phone}</p>
              <p className="text-sm text-text-muted">
                {doc.phone} · {doc.workerId ?? 'No worker ID yet'}
              </p>
              <p className="text-sm text-text-muted">
                {doc.docType.replace('_', ' ')} ·{' '}
                <a
                  href={`${API_ORIGIN}${doc.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-semibold"
                >
                  View document
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={doc.status} />
              <select
                className="h-9 px-2 rounded-md border border-border bg-background text-sm text-text"
                value={doc.status}
                onChange={(e) =>
                  statusMutation.mutate({
                    documentId: doc.id,
                    status: e.target.value as Document['status'],
                  })
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>
      {documents && documents.length === 0 && (
        <p className="text-text-muted">No documents uploaded yet.</p>
      )}
    </PortalLayout>
  )
}
