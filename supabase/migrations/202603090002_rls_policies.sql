-- RLS policies for e-raport roles
-- Run after 202603090001_init_eraport.sql

-- Helper functions -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id
  FROM public.teachers t
  WHERE t.profile_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM public.students s
  WHERE s.profile_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_parent_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.parents p
  WHERE p.profile_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() = 'admin'::public.user_role
$$;

CREATE OR REPLACE FUNCTION public.can_subject_teacher_access_enrollment(
  p_enrollment_id uuid,
  p_subject_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    INNER JOIN public.enrollments e
      ON e.classroom_id = sta.classroom_id
     AND e.academic_period_id = sta.academic_period_id
    WHERE sta.teacher_id = public.current_teacher_id()
      AND sta.subject_id = p_subject_id
      AND e.id = p_enrollment_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_homeroom_access_enrollment(p_enrollment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homeroom_assignments ha
    INNER JOIN public.enrollments e
      ON e.classroom_id = ha.classroom_id
     AND e.academic_period_id = ha.academic_period_id
    WHERE ha.teacher_id = public.current_teacher_id()
      AND e.id = p_enrollment_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_parent_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_parents sp
    WHERE sp.student_id = p_student_id
      AND sp.parent_id = public.current_parent_id()
  )
$$;

-- Enable RLS ---------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_subject_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles -----------------------------------------------------------------

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all ON public.profiles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Master tables ------------------------------------------------------------

DROP POLICY IF EXISTS teachers_admin_all ON public.teachers;
CREATE POLICY teachers_admin_all ON public.teachers
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS teachers_self_read ON public.teachers;
CREATE POLICY teachers_self_read ON public.teachers
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS parents_admin_all ON public.parents;
CREATE POLICY parents_admin_all ON public.parents
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS parents_self_read ON public.parents;
CREATE POLICY parents_self_read ON public.parents
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS students_admin_all ON public.students;
CREATE POLICY students_admin_all ON public.students
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS students_self_read ON public.students;
CREATE POLICY students_self_read ON public.students
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS student_parents_admin_all ON public.student_parents;
CREATE POLICY student_parents_admin_all ON public.student_parents
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_parents_student_read ON public.student_parents;
CREATE POLICY student_parents_student_read ON public.student_parents
FOR SELECT TO authenticated
USING (student_id = public.current_student_id());

DROP POLICY IF EXISTS student_parents_parent_read ON public.student_parents;
CREATE POLICY student_parents_parent_read ON public.student_parents
FOR SELECT TO authenticated
USING (parent_id = public.current_parent_id());

DROP POLICY IF EXISTS subjects_read_authenticated ON public.subjects;
CREATE POLICY subjects_read_authenticated ON public.subjects
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS subjects_admin_write ON public.subjects;
CREATE POLICY subjects_admin_write ON public.subjects
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS classrooms_read_authenticated ON public.classrooms;
CREATE POLICY classrooms_read_authenticated ON public.classrooms
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS classrooms_admin_write ON public.classrooms;
CREATE POLICY classrooms_admin_write ON public.classrooms
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS academic_years_read_authenticated ON public.academic_years;
CREATE POLICY academic_years_read_authenticated ON public.academic_years
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS academic_years_admin_write ON public.academic_years;
CREATE POLICY academic_years_admin_write ON public.academic_years
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS academic_periods_read_authenticated ON public.academic_periods;
CREATE POLICY academic_periods_read_authenticated ON public.academic_periods
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS academic_periods_admin_write ON public.academic_periods;
CREATE POLICY academic_periods_admin_write ON public.academic_periods
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Assignments --------------------------------------------------------------

DROP POLICY IF EXISTS homeroom_assignments_admin_all ON public.homeroom_assignments;
CREATE POLICY homeroom_assignments_admin_all ON public.homeroom_assignments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS homeroom_assignments_teacher_read ON public.homeroom_assignments;
CREATE POLICY homeroom_assignments_teacher_read ON public.homeroom_assignments
FOR SELECT TO authenticated
USING (teacher_id = public.current_teacher_id());

DROP POLICY IF EXISTS subject_teacher_assignments_admin_all ON public.subject_teacher_assignments;
CREATE POLICY subject_teacher_assignments_admin_all ON public.subject_teacher_assignments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS subject_teacher_assignments_teacher_read ON public.subject_teacher_assignments;
CREATE POLICY subject_teacher_assignments_teacher_read ON public.subject_teacher_assignments
FOR SELECT TO authenticated
USING (teacher_id = public.current_teacher_id());

-- Enrollments --------------------------------------------------------------

DROP POLICY IF EXISTS enrollments_admin_all ON public.enrollments;
CREATE POLICY enrollments_admin_all ON public.enrollments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS enrollments_subject_teacher_read ON public.enrollments;
CREATE POLICY enrollments_subject_teacher_read ON public.enrollments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.subject_teacher_assignments sta
    WHERE sta.teacher_id = public.current_teacher_id()
      AND sta.classroom_id = enrollments.classroom_id
      AND sta.academic_period_id = enrollments.academic_period_id
  )
);

DROP POLICY IF EXISTS enrollments_homeroom_read ON public.enrollments;
CREATE POLICY enrollments_homeroom_read ON public.enrollments
FOR SELECT TO authenticated
USING (public.can_homeroom_access_enrollment(id));

DROP POLICY IF EXISTS enrollments_student_read ON public.enrollments;
CREATE POLICY enrollments_student_read ON public.enrollments
FOR SELECT TO authenticated
USING (student_id = public.current_student_id());

DROP POLICY IF EXISTS enrollments_parent_read ON public.enrollments;
CREATE POLICY enrollments_parent_read ON public.enrollments
FOR SELECT TO authenticated
USING (public.can_parent_access_student(student_id));

-- Attendance ---------------------------------------------------------------

DROP POLICY IF EXISTS attendance_admin_all ON public.attendance_records;
CREATE POLICY attendance_admin_all ON public.attendance_records
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS attendance_subject_teacher_select ON public.attendance_records;
CREATE POLICY attendance_subject_teacher_select ON public.attendance_records
FOR SELECT TO authenticated
USING (public.can_subject_teacher_access_enrollment(enrollment_id, subject_id));

DROP POLICY IF EXISTS attendance_subject_teacher_insert ON public.attendance_records;
CREATE POLICY attendance_subject_teacher_insert ON public.attendance_records
FOR INSERT TO authenticated
WITH CHECK (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS attendance_subject_teacher_update ON public.attendance_records;
CREATE POLICY attendance_subject_teacher_update ON public.attendance_records
FOR UPDATE TO authenticated
USING (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
)
WITH CHECK (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS attendance_subject_teacher_delete ON public.attendance_records;
CREATE POLICY attendance_subject_teacher_delete ON public.attendance_records
FOR DELETE TO authenticated
USING (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS attendance_homeroom_read ON public.attendance_records;
CREATE POLICY attendance_homeroom_read ON public.attendance_records
FOR SELECT TO authenticated
USING (public.can_homeroom_access_enrollment(enrollment_id));

DROP POLICY IF EXISTS attendance_student_read ON public.attendance_records;
CREATE POLICY attendance_student_read ON public.attendance_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = attendance_records.enrollment_id
      AND e.student_id = public.current_student_id()
  )
);

DROP POLICY IF EXISTS attendance_parent_read ON public.attendance_records;
CREATE POLICY attendance_parent_read ON public.attendance_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = attendance_records.enrollment_id
      AND public.can_parent_access_student(e.student_id)
  )
);

-- Scores -------------------------------------------------------------------

DROP POLICY IF EXISTS scores_admin_all ON public.scores;
CREATE POLICY scores_admin_all ON public.scores
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS scores_subject_teacher_select ON public.scores;
CREATE POLICY scores_subject_teacher_select ON public.scores
FOR SELECT TO authenticated
USING (public.can_subject_teacher_access_enrollment(enrollment_id, subject_id));

DROP POLICY IF EXISTS scores_subject_teacher_insert ON public.scores;
CREATE POLICY scores_subject_teacher_insert ON public.scores
FOR INSERT TO authenticated
WITH CHECK (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS scores_subject_teacher_update ON public.scores;
CREATE POLICY scores_subject_teacher_update ON public.scores
FOR UPDATE TO authenticated
USING (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
)
WITH CHECK (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS scores_subject_teacher_delete ON public.scores;
CREATE POLICY scores_subject_teacher_delete ON public.scores
FOR DELETE TO authenticated
USING (
  input_by_teacher_id = public.current_teacher_id()
  AND public.can_subject_teacher_access_enrollment(enrollment_id, subject_id)
);

DROP POLICY IF EXISTS scores_homeroom_read ON public.scores;
CREATE POLICY scores_homeroom_read ON public.scores
FOR SELECT TO authenticated
USING (public.can_homeroom_access_enrollment(enrollment_id));

DROP POLICY IF EXISTS scores_student_read ON public.scores;
CREATE POLICY scores_student_read ON public.scores
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = scores.enrollment_id
      AND e.student_id = public.current_student_id()
  )
);

DROP POLICY IF EXISTS scores_parent_read ON public.scores;
CREATE POLICY scores_parent_read ON public.scores
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = scores.enrollment_id
      AND public.can_parent_access_student(e.student_id)
  )
);

-- Report cards -------------------------------------------------------------

DROP POLICY IF EXISTS report_cards_admin_all ON public.report_cards;
CREATE POLICY report_cards_admin_all ON public.report_cards
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS report_cards_homeroom_select ON public.report_cards;
CREATE POLICY report_cards_homeroom_select ON public.report_cards
FOR SELECT TO authenticated
USING (public.can_homeroom_access_enrollment(enrollment_id));

DROP POLICY IF EXISTS report_cards_homeroom_insert ON public.report_cards;
CREATE POLICY report_cards_homeroom_insert ON public.report_cards
FOR INSERT TO authenticated
WITH CHECK (public.can_homeroom_access_enrollment(enrollment_id));

DROP POLICY IF EXISTS report_cards_homeroom_update ON public.report_cards;
CREATE POLICY report_cards_homeroom_update ON public.report_cards
FOR UPDATE TO authenticated
USING (public.can_homeroom_access_enrollment(enrollment_id))
WITH CHECK (public.can_homeroom_access_enrollment(enrollment_id));

DROP POLICY IF EXISTS report_cards_student_read ON public.report_cards;
CREATE POLICY report_cards_student_read ON public.report_cards
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = report_cards.enrollment_id
      AND e.student_id = public.current_student_id()
  )
);

DROP POLICY IF EXISTS report_cards_parent_read ON public.report_cards;
CREATE POLICY report_cards_parent_read ON public.report_cards
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = report_cards.enrollment_id
      AND public.can_parent_access_student(e.student_id)
  )
);

-- Report card summaries ----------------------------------------------------

DROP POLICY IF EXISTS report_card_summaries_admin_all ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_admin_all ON public.report_card_subject_summaries
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS report_card_summaries_homeroom_select ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_homeroom_select ON public.report_card_subject_summaries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND public.can_homeroom_access_enrollment(rc.enrollment_id)
  )
);

DROP POLICY IF EXISTS report_card_summaries_homeroom_write ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_homeroom_write ON public.report_card_subject_summaries
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND public.can_homeroom_access_enrollment(rc.enrollment_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND public.can_homeroom_access_enrollment(rc.enrollment_id)
  )
);

DROP POLICY IF EXISTS report_card_summaries_subject_teacher_select ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_subject_teacher_select ON public.report_card_subject_summaries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    INNER JOIN public.enrollments e ON e.id = rc.enrollment_id
    INNER JOIN public.subject_teacher_assignments sta
      ON sta.classroom_id = e.classroom_id
     AND sta.academic_period_id = e.academic_period_id
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.subject_id = report_card_subject_summaries.subject_id
  )
);

DROP POLICY IF EXISTS report_card_summaries_subject_teacher_write ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_subject_teacher_write ON public.report_card_subject_summaries
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    INNER JOIN public.enrollments e ON e.id = rc.enrollment_id
    INNER JOIN public.subject_teacher_assignments sta
      ON sta.classroom_id = e.classroom_id
     AND sta.academic_period_id = e.academic_period_id
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.subject_id = report_card_subject_summaries.subject_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    INNER JOIN public.enrollments e ON e.id = rc.enrollment_id
    INNER JOIN public.subject_teacher_assignments sta
      ON sta.classroom_id = e.classroom_id
     AND sta.academic_period_id = e.academic_period_id
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND sta.teacher_id = public.current_teacher_id()
      AND sta.subject_id = report_card_subject_summaries.subject_id
  )
);

DROP POLICY IF EXISTS report_card_summaries_student_read ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_student_read ON public.report_card_subject_summaries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    INNER JOIN public.enrollments e ON e.id = rc.enrollment_id
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND e.student_id = public.current_student_id()
  )
);

DROP POLICY IF EXISTS report_card_summaries_parent_read ON public.report_card_subject_summaries;
CREATE POLICY report_card_summaries_parent_read ON public.report_card_subject_summaries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.report_cards rc
    INNER JOIN public.enrollments e ON e.id = rc.enrollment_id
    WHERE rc.id = report_card_subject_summaries.report_card_id
      AND public.can_parent_access_student(e.student_id)
  )
);
