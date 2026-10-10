-- Atomic 6-member limit per Gia đình under concurrency.
-- Uses transaction-level advisory locks scoped to the household_code
-- to serialize concurrent additions without locking unrelated households.
-- Legacy households with > 6 members are preserved; SELECT and DELETE remain unaffected.
BEGIN;

CREATE OR REPLACE FUNCTION public.check_household_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Acquire exclusive transaction lock on the specific household code
  PERFORM pg_advisory_xact_lock(hashtext(NEW.household_code));

  SELECT count(*)
  INTO member_count
  FROM public.member
  WHERE household_code = NEW.household_code;

  IF member_count >= 6 THEN
    RAISE EXCEPTION 'household_member_limit_reached' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_member_limit ON public.member;
CREATE TRIGGER trg_member_limit
  BEFORE INSERT ON public.member
  FOR EACH ROW
  EXECUTE FUNCTION public.check_household_member_limit();

COMMIT;
