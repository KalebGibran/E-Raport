create extension if not exists pgcrypto;

-- Enums
DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'admin',
    'subject_teacher',
    'homeroom_teacher',
    'student',
    'parent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.gender_type AS ENUM ('male', 'female');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.period_status AS ENUM ('planned', 'active', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.enrollment_status AS ENUM (
    'active',
    'completed',
    'promoted',
    'retained',
    'transferred'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'sick',
    'permission',
    'absent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.score_type AS ENUM ('daily', 'uts', 'uas');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.report_card_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'published'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.parent_relation AS ENUM ('father', 'mother', 'guardian');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Common trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Master user profile mapped from auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  full_name text NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  teacher_code text UNIQUE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON public.teachers;
CREATE TRIGGER trg_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_parents_updated_at ON public.parents;
CREATE TRIGGER trg_parents_updated_at
BEFORE UPDATE ON public.parents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  nis text UNIQUE,
  nisn text UNIQUE,
  full_name text NOT NULL,
  gender public.gender_type,
  birth_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.student_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  relation public.parent_relation NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text NOT NULL UNIQUE,
  subject_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_level text NOT NULL CHECK (school_level IN ('sd', 'smp', 'sma')),
  grade_level smallint NOT NULL CHECK (grade_level >= 1),
  section text NOT NULL,
  classroom_name text NOT NULL,
  next_classroom_id uuid REFERENCES public.classrooms(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_level, grade_level, section)
);

DROP TRIGGER IF EXISTS trg_classrooms_updated_at ON public.classrooms;
CREATE TRIGGER trg_classrooms_updated_at
BEFORE UPDATE ON public.classrooms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

DROP TRIGGER IF EXISTS trg_academic_years_updated_at ON public.academic_years;
CREATE TRIGGER trg_academic_years_updated_at
BEFORE UPDATE ON public.academic_years
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.academic_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  semester smallint NOT NULL CHECK (semester IN (1, 2)),
  period_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.period_status NOT NULL DEFAULT 'planned',
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(academic_year_id, semester),
  CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_periods_single_current
ON public.academic_periods(is_current)
WHERE is_current = true;

DROP TRIGGER IF EXISTS trg_academic_periods_updated_at ON public.academic_periods;
CREATE TRIGGER trg_academic_periods_updated_at
BEFORE UPDATE ON public.academic_periods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.homeroom_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE RESTRICT,
  academic_period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, academic_period_id),
  UNIQUE(teacher_id, academic_period_id)
);

CREATE TABLE IF NOT EXISTS public.subject_teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE RESTRICT,
  academic_period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subject_id, classroom_id, academic_period_id)
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE RESTRICT,
  academic_period_id uuid NOT NULL REFERENCES public.academic_periods(id) ON DELETE RESTRICT,
  status public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_period_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_classroom_period
ON public.enrollments(classroom_id, academic_period_id);

DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER trg_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL,
  notes text,
  input_by_teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, subject_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_date
ON public.attendance_records(enrollment_id, attendance_date);

DROP TRIGGER IF EXISTS trg_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  score_type public.score_type NOT NULL,
  assessment_no int,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  notes text,
  input_by_teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (score_type = 'daily' AND assessment_no IS NOT NULL AND assessment_no > 0)
    OR
    (score_type IN ('uts', 'uas') AND assessment_no IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scores_no_duplicate_assessment
ON public.scores(enrollment_id, subject_id, score_type, COALESCE(assessment_no, 0));

CREATE INDEX IF NOT EXISTS idx_scores_enrollment_subject
ON public.scores(enrollment_id, subject_id);

DROP TRIGGER IF EXISTS trg_scores_updated_at ON public.scores;
CREATE TRIGGER trg_scores_updated_at
BEFORE UPDATE ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status public.report_card_status NOT NULL DEFAULT 'draft',
  approved_by_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_at timestamptz,
  pdf_url text,
  homeroom_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_report_cards_updated_at ON public.report_cards;
CREATE TRIGGER trg_report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.report_card_subject_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id uuid NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  final_score numeric(5,2) CHECK (final_score >= 0 AND final_score <= 100),
  grade_letter text,
  teacher_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_card_id, subject_id)
);

DROP TRIGGER IF EXISTS trg_report_card_subject_summaries_updated_at ON public.report_card_subject_summaries;
CREATE TRIGGER trg_report_card_subject_summaries_updated_at
BEFORE UPDATE ON public.report_card_subject_summaries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto activate period + move enrollments
CREATE OR REPLACE FUNCTION public.activate_period_and_rollover(p_target_period_id uuid)
RETURNS TABLE(created_enrollments integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_target_semester smallint;
  v_target_start date;
  v_target_year_id uuid;
  v_previous_period_id uuid;
  v_inserted integer := 0;
BEGIN
  SELECT semester, start_date, academic_year_id
  INTO v_target_semester, v_target_start, v_target_year_id
  FROM public.academic_periods
  WHERE id = p_target_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target academic period not found: %', p_target_period_id;
  END IF;

  IF v_target_semester = 2 THEN
    SELECT id
    INTO v_previous_period_id
    FROM public.academic_periods
    WHERE academic_year_id = v_target_year_id
      AND semester = 1
    LIMIT 1;
  ELSE
    SELECT id
    INTO v_previous_period_id
    FROM public.academic_periods
    WHERE semester = 2
      AND end_date < v_target_start
    ORDER BY end_date DESC
    LIMIT 1;
  END IF;

  UPDATE public.academic_periods
  SET is_current = false,
      status = CASE WHEN status = 'active' THEN 'closed' ELSE status END
  WHERE is_current = true;

  UPDATE public.academic_periods
  SET is_current = true,
      status = 'active'
  WHERE id = p_target_period_id;

  IF v_previous_period_id IS NULL THEN
    RETURN QUERY SELECT 0;
    RETURN;
  END IF;

  WITH inserted AS (
    INSERT INTO public.enrollments (
      student_id,
      classroom_id,
      academic_period_id,
      status
    )
    SELECT
      e.student_id,
      CASE
        WHEN v_target_semester = 2 THEN e.classroom_id
        ELSE COALESCE(c.next_classroom_id, e.classroom_id)
      END AS classroom_id,
      p_target_period_id,
      'active'::public.enrollment_status
    FROM public.enrollments e
    INNER JOIN public.classrooms c ON c.id = e.classroom_id
    WHERE e.academic_period_id = v_previous_period_id
      AND e.status IN ('active', 'completed', 'promoted', 'retained')
    ON CONFLICT (student_id, academic_period_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*)::integer INTO v_inserted FROM inserted;

  UPDATE public.enrollments e
  SET status = CASE
    WHEN v_target_semester = 1 THEN
      CASE
        WHEN c.next_classroom_id IS NULL THEN 'retained'::public.enrollment_status
        ELSE 'promoted'::public.enrollment_status
      END
    ELSE 'completed'::public.enrollment_status
  END
  FROM public.classrooms c
  WHERE e.classroom_id = c.id
    AND e.academic_period_id = v_previous_period_id
    AND e.status = 'active';

  RETURN QUERY SELECT v_inserted;
END;
$$;
