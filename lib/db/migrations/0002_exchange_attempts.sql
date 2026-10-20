-- Development migration; managed production schema changes use Publish.
-- Preserve cancelled attempts and their messages while permitting fresh consent.
BEGIN;
ALTER TABLE kemis_matches DROP CONSTRAINT IF EXISTS kemis_matches_dress_a_dress_b_key;
CREATE UNIQUE INDEX IF NOT EXISTS kemis_matches_current_pair
  ON kemis_matches(dress_a,dress_b) WHERE status <> 'cancelled';
COMMIT;
