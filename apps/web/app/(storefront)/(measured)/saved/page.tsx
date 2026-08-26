import { PageHeader } from '@/components/domain/section';
import { SavedList } from '@/features/saved/saved-list';

// Saralanganlar brauzerda saqlanadi, shuning uchun sahifa keshlanmaydi.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Saralangan' };

export default function SavedPage() {
  return (
    <div>
      <PageHeader
        title="Saralangan"
        description="Ro’yxat shu brauzerda saqlanadi. Narx va qoldiq har doim jonli ko’rsatiladi."
      />
      <SavedList />
    </div>
  );
}
