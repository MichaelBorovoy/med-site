import { ServicesManager } from "@/components/admin/ServicesManager";
import { listDoctors, listServices } from "@/lib/db";

export default async function AdminServicesPage() {
  const initialServices = await listServices();
  const doctors = await listDoctors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Services
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Catalog care offerings by specialty and assign the doctors who provide
          them.
        </p>
      </div>
      <ServicesManager initialServices={initialServices} doctors={doctors} />
    </div>
  );
}
