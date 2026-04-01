import { StudentsDashboardView } from "@/components/dashboard/StudentsDashboardView";
import { StudentOverviewView } from "@/components/student/StudentOverviewView";
import { getDashboardSession } from "@/lib/auth/dashboard";
import { getDashboardOverview } from "@/lib/dashboard/data";
import { getStudentOverviewData } from "@/lib/student-progress/service";

type DashboardPageProps = {
  searchParams: Promise<{
    period_id?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const session = await getDashboardSession();

  if (session.role === "murid") {
    const overview = await getStudentOverviewData({
      periodId: params.period_id,
    });

    return <StudentOverviewView data={overview} />;
  }

  const overview = await getDashboardOverview();

  return <StudentsDashboardView role={overview.user.role} stats={overview.stats} students={overview.students} />;
}
