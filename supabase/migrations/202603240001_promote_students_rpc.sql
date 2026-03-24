-- Promote students from current period to target period.
-- Rules:
-- 1) same academic year -> stay in current classroom
-- 2) different academic year -> move to next_classroom_id (fallback current classroom if null)
-- 3) never update old enrollments
-- 4) skip duplicates on (student_id, academic_period_id)
CREATE OR REPLACE FUNCTION public.promote_students(
  p_current_period_id uuid,
  p_next_period_id uuid,
  p_excluded_student_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE (
  total_candidates integer,
  inserted_count integer,
  skipped_existing_count integer,
  moved_class_count integer,
  stayed_class_count integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_same_year boolean;
BEGIN
  IF p_current_period_id IS NULL OR p_next_period_id IS NULL THEN
    RAISE EXCEPTION 'Current period and target period are required.';
  END IF;

  IF p_current_period_id = p_next_period_id THEN
    RAISE EXCEPTION 'Current period and target period cannot be the same.';
  END IF;

  PERFORM 1
  FROM public.academic_periods
  WHERE id = p_current_period_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current academic period not found: %', p_current_period_id;
  END IF;

  PERFORM 1
  FROM public.academic_periods
  WHERE id = p_next_period_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target academic period not found: %', p_next_period_id;
  END IF;

  SELECT (cp.academic_year_id = np.academic_year_id)
  INTO v_same_year
  FROM public.academic_periods cp
  CROSS JOIN public.academic_periods np
  WHERE cp.id = p_current_period_id
    AND np.id = p_next_period_id;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      e.student_id,
      e.classroom_id AS current_classroom_id,
      CASE
        WHEN v_same_year THEN e.classroom_id
        ELSE COALESCE(c.next_classroom_id, e.classroom_id)
      END AS next_classroom_id
    FROM public.enrollments e
    INNER JOIN public.classrooms c ON c.id = e.classroom_id
    WHERE e.academic_period_id = p_current_period_id
      AND e.status IN ('active', 'completed', 'promoted', 'retained')
      AND (
        p_excluded_student_ids IS NULL
        OR e.student_id <> ALL(p_excluded_student_ids)
      )
  ),
  eligible AS (
    SELECT c.*
    FROM candidates c
    LEFT JOIN public.enrollments e_next
      ON e_next.student_id = c.student_id
     AND e_next.academic_period_id = p_next_period_id
    WHERE e_next.id IS NULL
  ),
  inserted AS (
    INSERT INTO public.enrollments (
      student_id,
      classroom_id,
      academic_period_id,
      status
    )
    SELECT
      e.student_id,
      e.next_classroom_id,
      p_next_period_id,
      'active'::public.enrollment_status
    FROM eligible e
    ON CONFLICT (student_id, academic_period_id) DO NOTHING
    RETURNING student_id
  )
  SELECT
    (SELECT count(*)::integer FROM candidates) AS total_candidates,
    (SELECT count(*)::integer FROM inserted) AS inserted_count,
    (
      (SELECT count(*)::integer FROM candidates)
      - (SELECT count(*)::integer FROM inserted)
    ) AS skipped_existing_count,
    (
      SELECT count(*)::integer
      FROM eligible e
      INNER JOIN inserted i ON i.student_id = e.student_id
      WHERE e.next_classroom_id IS DISTINCT FROM e.current_classroom_id
    ) AS moved_class_count,
    (
      SELECT count(*)::integer
      FROM eligible e
      INNER JOIN inserted i ON i.student_id = e.student_id
      WHERE e.next_classroom_id IS NOT DISTINCT FROM e.current_classroom_id
    ) AS stayed_class_count;
END;
$$;
