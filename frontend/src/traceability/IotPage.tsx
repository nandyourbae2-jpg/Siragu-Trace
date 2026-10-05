import { PageHeader } from '@/components/layout/PageHeader';
export function IotPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sensor & Layanan IoT" description="Integrasi pembacaan alat berat, termometer oven, dan timbangan digital." />
      <div className="p-6 bg-surface border border-border rounded-lg text-center text-muted-foreground">
        Halaman Integrasi IoT sedang dalam tahap pengembangan (Tahap 6).
      </div>
    </div>
  );
}
