'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

import { StatusBadge } from '@/components/domain/status-badge';
import { Alert, Button, Card, EmptyState, Spinner } from '@/components/ui';
import { useSession } from '@/features/auth/session-provider';
import { ApiError, request } from '@/lib/api-client';
import type { Prescription } from '@/lib/api-client/endpoints';
import { formatDate } from '@/lib/utils/money';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function PrescriptionManager({ prescriptions }: { prescriptions: Prescription[] }) {
  const router = useRouter();
  const { getToken } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      await request('/prescriptions', { method: 'POST', formData, token });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function download(id: string) {
    setError(null);
    try {
      const token = await getToken();
      const link = await request<{ url: string }>(`/prescriptions/${id}/download-link`, {
        method: 'POST',
        token,
      });
      // The link is single-use and expires within minutes (CLAUDE.md §5.5).
      window.open(link.url.startsWith('http') ? link.url : `${API_URL}${link.url}`, '_blank');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not open that document.');
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert tone="warning" title="Something went wrong">
          {error}
        </Alert>
      ) : null}

      <Card className="p-6">
        <label htmlFor="rx-upload" className="block text-sm font-medium">
          Retsept yuklash
        </label>
        <input
          id="rx-upload"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/heic"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="mt-2 w-full rounded-lg border border-dashed border-accent/25 bg-base px-3 py-6 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-ink file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        <p className="mt-2 text-xs text-accent/60">
          PDF or a photo, up to 10 MB. Stored encrypted; the seller never sees it.
        </p>
        {uploading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-accent/60">
            <Spinner className="text-primary-ink" /> Uploading…
          </p>
        ) : null}
      </Card>

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No prescriptions uploaded"
          description="Upload one ahead of time and it will be ready to attach at checkout."
        />
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((prescription) => (
            <Card as="li" key={prescription.id} className="flex flex-wrap items-center gap-4 p-5">
              <FileText className="h-5 w-5 shrink-0 text-accent/30" aria-hidden />
              <div className="min-w-40 flex-1">
                <p className="text-sm font-medium">{prescription.original_filename}</p>
                <p className="text-xs text-accent/50">
                  Uploaded {formatDate(prescription.created_at)} ·{' '}
                  {Math.round(prescription.byte_size / 1024)} KB
                </p>
                {prescription.rejection_reason ? (
                  <p className="mt-1 text-xs text-accent">{prescription.rejection_reason}</p>
                ) : null}
              </div>
              <StatusBadge status={prescription.status} />
              <Button variant="secondary" size="sm" onClick={() => download(prescription.id)}>
                <Download className="h-3.5 w-3.5" aria-hidden />
                View
              </Button>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
