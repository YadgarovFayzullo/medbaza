import { BadgeCheck, FileText, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui';

/** E’longa biriktirilgan CE / FDA / ISO belgilari. */
export function CertificationBadges({ certifications }: { certifications: string[] }) {
  if (certifications.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {certifications.map((certification) => (
        <Badge key={certification} tone="muted">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {certification}
        </Badge>
      ))}
    </div>
  );
}

export function VerifiedSellerBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <Badge tone="primary">
      <BadgeCheck className="h-3 w-3" aria-hidden />
      Tasdiqlangan sotuvchi
    </Badge>
  );
}

export function PrescriptionBadge({ required }: { required: boolean }) {
  if (!required) return null;
  return (
    <Badge tone="neutral">
      <FileText className="h-3 w-3" aria-hidden />
      Retsept talab qilinadi
    </Badge>
  );
}

export function StockIndicator({ stock, inStock }: { stock: number; inStock: boolean }) {
  if (!inStock || stock === 0) {
    return <span className="text-xs font-medium text-accent/50">Mavjud emas</span>;
  }
  if (stock <= 5) {
    return <span className="text-xs font-medium text-primary-ink">Atigi {stock} ta qoldi</span>;
  }
  return <span className="text-xs font-medium text-primary-ink">Mavjud</span>;
}
