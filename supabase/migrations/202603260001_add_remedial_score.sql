ALTER TABLE public.scores
ADD COLUMN IF NOT EXISTS remedial_score numeric(5,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scores_remedial_score_range_check'
  ) THEN
    ALTER TABLE public.scores
    ADD CONSTRAINT scores_remedial_score_range_check
    CHECK (remedial_score IS NULL OR (remedial_score >= 0 AND remedial_score <= 100));
  END IF;
END $$;
