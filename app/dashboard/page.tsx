import { StudentsDashboardView } from "@/components/dashboard/StudentsDashboardView";
import { getDashboardOverview } from "@/lib/dashboard/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return <StudentsDashboardView role={overview.user.role} stats={overview.stats} students={overview.students} />;
}
