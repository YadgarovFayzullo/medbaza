import { Badge } from '@/components/ui';

/** Jo‘natma/buyurtma holatlarining odamga tushunarli nomlari (CLAUDE.md §5.4). */
const LABELS: Record<string, string> = {
  pending_payment: 'To’lov kutilmoqda',
  payment_failed: 'To’lov amalga oshmadi',
  paid: 'To’landi',
  processing: 'Tayyorlanmoqda',
  shipped: 'Jo’natildi',
  partially_shipped: 'Qisman jo’natildi',
  delivered: 'Yetkazildi',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
  return_requested: 'Qaytarish so’raldi',
  returned: 'Qaytarildi',
  refunded: 'Pul qaytarildi',
  pending: 'Tekshiruv kutilmoqda',
  pending_review: 'Tekshiruv kutilmoqda',
  verified: 'Tasdiqlangan',
  approved: 'Tasdiqlandi',
  rejected: 'Rad etildi',
  suspended: 'To’xtatilgan',
  draft: 'Qoralama',
  active: 'Efirda',
  archived: 'Arxivlangan',
};

// Ijobiy holatlar teal tusini oladi, qolganlari neytral — palitra hech qachon
// to‘rtinchi rangga o‘smaydi (§9).
const HIGHLIGHTED = new Set([
  'paid',
  'shipped',
  'delivered',
  'completed',
  'verified',
  'approved',
  'active',
]);

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={HIGHLIGHTED.has(status) ? 'primary' : 'muted'}>
      {LABELS[status] ?? status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function statusLabel(status: string): string {
  return LABELS[status] ?? status.replace(/_/g, ' ');
}
