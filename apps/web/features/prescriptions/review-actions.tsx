'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Download } from 'lucide-react';

import { Alert, Button, Input } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Approve or reject a prescription. Opening the document mints a link that
 * expires in minutes and is written to the audit log (CLAUDE.md §5.5).
 */
export function PrescriptionReviewActions({ prescriptionId }: { prescriptionId: string }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function view() {
    setError(null);
    try {
      const token = await getToken();
      const link = await request<{ url: string }>(
        `/prescriptions/${prescriptionId}/download-link`,
        { method: 'POST', token },
      );
      window.open(link.url.startsWith('http') ? link.url : `${API_URL}${link.url}`, '_blank');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open the document.');
    }
  }

  async function decide(status: 'approved' | 'rejected') {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await request(`/admin/prescriptions/${prescriptionId}/review`, {
        method: 'POST',
        token,
        body: { status, reason: status === 'rejected' ? reason : null },
      });
      setRejecting(false);
      setReason('');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not record that decision.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <Alert tone="warning">{error}</Alert> : null}

      {rejecting ? (
        <div className="space-y-2">
          <Input
            label="Rejection reason"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            hint="The buyer sees this."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={busy}
              disabled={reason.trim().length === 0}
              onClick={() => decide('rejected')}
            >
              Confirm rejection
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={view}>
            <Download className="h-3.5 w-3.5" aria-hidden />
            View
          </Button>
          <Button size="sm" loading={busy} onClick={() => decide('approved')}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
