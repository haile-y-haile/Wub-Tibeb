-- Development migration. Managed production schema changes use Publish.
BEGIN;
CREATE TABLE IF NOT EXISTS kemis_profiles (
 id text PRIMARY KEY, name text NOT NULL DEFAULT 'Member', neighborhood text NOT NULL DEFAULT 'Addis Ababa',
 language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','am')),
 measurements jsonb, role text NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
 demo boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS kemis_listings (
 id text PRIMARY KEY, owner_id text NOT NULL REFERENCES kemis_profiles(id),
 data jsonb NOT NULL, status text NOT NULL DEFAULT 'active'
 CHECK(status IN ('active','reserved','swapped','archived','hidden')),
 demo boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kemis_listings_owner ON kemis_listings(owner_id);
CREATE INDEX IF NOT EXISTS kemis_listings_status ON kemis_listings(status);
CREATE TABLE IF NOT EXISTS kemis_swipes (
 user_id text NOT NULL REFERENCES kemis_profiles(id),
 offered_id text NOT NULL REFERENCES kemis_listings(id),
 target_id text NOT NULL REFERENCES kemis_listings(id),
 direction text NOT NULL CHECK(direction IN ('like','pass')),
 PRIMARY KEY(user_id,offered_id,target_id)
);
CREATE TABLE IF NOT EXISTS kemis_passes (
 user_id text NOT NULL REFERENCES kemis_profiles(id),
 target_id text NOT NULL REFERENCES kemis_listings(id),
 PRIMARY KEY(user_id,target_id)
);
CREATE TABLE IF NOT EXISTS kemis_matches (
 id text PRIMARY KEY, dress_a text NOT NULL REFERENCES kemis_listings(id),
 dress_b text NOT NULL REFERENCES kemis_listings(id),
 user_a text NOT NULL REFERENCES kemis_profiles(id), user_b text NOT NULL REFERENCES kemis_profiles(id),
 status text NOT NULL DEFAULT 'matched' CHECK(status IN ('matched','proposed','accepted','completed','cancelled')),
 proposal text NOT NULL DEFAULT '', accepted_by text[] NOT NULL DEFAULT '{}',
 completed_by text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(dress_a,dress_b), CHECK(dress_a < dress_b), CHECK(user_a <> user_b)
);
CREATE TABLE IF NOT EXISTS kemis_messages (
 id text PRIMARY KEY, match_id text NOT NULL REFERENCES kemis_matches(id),
 sender_id text NOT NULL REFERENCES kemis_profiles(id), text text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kemis_messages_match ON kemis_messages(match_id,created_at);
CREATE TABLE IF NOT EXISTS kemis_blocks (
 blocker text NOT NULL REFERENCES kemis_profiles(id), blocked text NOT NULL REFERENCES kemis_profiles(id),
 PRIMARY KEY(blocker,blocked), CHECK(blocker <> blocked)
);
CREATE TABLE IF NOT EXISTS kemis_notifications (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES kemis_profiles(id), text text NOT NULL,
 read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kemis_notifications_user ON kemis_notifications(user_id,created_at);
CREATE TABLE IF NOT EXISTS kemis_reports (
 id text PRIMARY KEY, reporter text NOT NULL REFERENCES kemis_profiles(id),
 listing_id text NOT NULL REFERENCES kemis_listings(id), reason text NOT NULL,
 status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kemis_uploads (
 path text PRIMARY KEY, owner_id text NOT NULL REFERENCES kemis_profiles(id),
 content_type text NOT NULL, size integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
