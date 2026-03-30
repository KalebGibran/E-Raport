CREATE TABLE IF NOT EXISTS public.daily_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.subject_teacher_assignments(id) ON DELETE CASCADE,
  academic_period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  assessment_no int NOT NULL CHECK (assessment_no > 0),
  task_date date NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  description text,
  created_by_teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, assessment_no)
);

CREATE INDEX IF NOT EXISTS idx_daily_assessments_assignment
ON public.daily_assessments(assignment_id);

CREATE INDEX IF NOT EXISTS idx_daily_assessments_period_date
ON public.daily_assessments(academic_period_id, task_date);

DROP TRIGGER IF EXISTS trg_daily_assessments_updated_at ON public.daily_assessments;
CREATE TRIGGER trg_daily_assessments_updated_at
BEFORE UPDATE ON public.daily_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_assessments_admin_all ON public.daily_assessments;
CREATE POLICY daily_assessments_admin_all ON public.daily_assessments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS daily_assessments_teacher_select ON public.daily_assessments;
CREATE POLICY daily_assessments_teacher_select ON public.daily_assessments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.id = daily_assessments.assignment_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.academic_period_id = daily_assessments.academic_period_id
  )
);

DROP POLICY IF EXISTS daily_assessments_teacher_insert ON public.daily_assessments;
CREATE POLICY daily_assessments_teacher_insert ON public.daily_assessments
FOR INSERT TO authenticated
WITH CHECK (
  created_by_teacher_id = public.current_teacher_id()
  AND EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.id = daily_assessments.assignment_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.academic_period_id = daily_assessments.academic_period_id
  )
);

DROP POLICY IF EXISTS daily_assessments_teacher_update ON public.daily_assessments;
CREATE POLICY daily_assessments_teacher_update ON public.daily_assessments
FOR UPDATE TO authenticated
USING (
  created_by_teacher_id = public.current_teacher_id()
  AND EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.id = daily_assessments.assignment_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.academic_period_id = daily_assessments.academic_period_id
  )
)
WITH CHECK (
  created_by_teacher_id = public.current_teacher_id()
  AND EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.id = daily_assessments.assignment_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.academic_period_id = daily_assessments.academic_period_id
  )
);

DROP POLICY IF EXISTS daily_assessments_teacher_delete ON public.daily_assessments;
CREATE POLICY daily_assessments_teacher_delete ON public.daily_assessments
FOR DELETE TO authenticated
USING (
  created_by_teacher_id = public.current_teacher_id()
  AND EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.id = daily_assessments.assignment_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.academic_period_id = daily_assessments.academic_period_id
  )
);
