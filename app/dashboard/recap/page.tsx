import { RecapView } from "@/components/recap/RecapView";
import { getRecapData } from "@/lib/recap/service";

type RecapPageProps = {
  searchParams: Promise<{
    period_id?: string;
    classroom_id?: string;
    student_id?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RecapPage({ searchParams }: RecapPageProps) {
  const params = await searchParams;
  const data = await getRecapData({
    periodId: params.period_id,
    classroomId: params.classroom_id,
    studentId: params.student_id,
  });

  return <RecapView data={data} />;
}

