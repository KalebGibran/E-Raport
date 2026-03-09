-- Sample master data for local/dev use

INSERT INTO public.subjects (subject_code, subject_name)
VALUES
  ('MTK', 'Matematika'),
  ('BIN', 'Bahasa Indonesia'),
  ('IPA', 'Ilmu Pengetahuan Alam')
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO public.classrooms (school_level, grade_level, section, classroom_name)
VALUES
  ('sd', 4, 'A', '4A'),
  ('sd', 5, 'A', '5A')
ON CONFLICT (school_level, grade_level, section) DO NOTHING;

UPDATE public.classrooms c4
SET next_classroom_id = c5.id
FROM public.classrooms c5
WHERE c4.school_level = 'sd'
  AND c4.grade_level = 4
  AND c4.section = 'A'
  AND c5.school_level = 'sd'
  AND c5.grade_level = 5
  AND c5.section = 'A';

INSERT INTO public.academic_years (year_name, start_date, end_date, is_active)
VALUES
  ('2025/2026', '2025-07-01', '2026-06-30', true),
  ('2026/2027', '2026-07-01', '2027-06-30', false)
ON CONFLICT (year_name) DO NOTHING;

INSERT INTO public.academic_periods (
  academic_year_id,
  semester,
  period_name,
  start_date,
  end_date,
  status,
  is_current
)
SELECT ay.id, 1, ay.year_name || ' - Semester 1', ay.start_date, (ay.start_date + INTERVAL '5 months 29 days')::date, 'active', true
FROM public.academic_years ay
WHERE ay.year_name = '2025/2026'
ON CONFLICT (academic_year_id, semester) DO NOTHING;

INSERT INTO public.academic_periods (
  academic_year_id,
  semester,
  period_name,
  start_date,
  end_date,
  status,
  is_current
)
SELECT ay.id, 2, ay.year_name || ' - Semester 2', (ay.start_date + INTERVAL '6 months')::date, ay.end_date, 'planned', false
FROM public.academic_years ay
WHERE ay.year_name = '2025/2026'
ON CONFLICT (academic_year_id, semester) DO NOTHING;
