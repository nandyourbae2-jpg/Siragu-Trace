import { PageHeader } from '@/components/layout/PageHeader';
export function ReleaseQueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Persetujuan Mutu (QA)" description="Verifikasi lot gula sebelum dirilis ke tahap pengemasan." />
      <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-emerald-800 font-medium">
        Pada sistem UMKM, seluruh lot gula oven otomatis dirilis ke pengemasan tanpa antrean QA berlapis.
      </div>
    </div>
  );
}
