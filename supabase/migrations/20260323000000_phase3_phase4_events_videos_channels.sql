-- Phase 3 & 4: Events overhaul + Video/Channel overhaul
-- Adds approval_status to events and videos, seeds team/creator channels

-- ============================================================
-- 1. Add approval_status to events table
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS submitter_email text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitter_phone text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS submitter_social_links jsonb;

-- ============================================================
-- 2. Add approval_status to videos table
-- ============================================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- ============================================================
-- 3. Add handle column to creator_channels for URL routing
-- ============================================================
ALTER TABLE creator_channels ADD COLUMN IF NOT EXISTS handle text;

-- Create unique index on handle for channel URL routing
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_channels_handle ON creator_channels (handle)
  WHERE handle IS NOT NULL;

-- ============================================================
-- 4. Delete all existing video records (Phase 4 requirement)
-- ============================================================
DELETE FROM video_views;
DELETE FROM video_likes;
DELETE FROM videos;

-- ============================================================
-- 5. Seed Team Channels
-- ============================================================

-- NCAA / College Teams
INSERT INTO creator_channels (channel_name, slug, handle, description, channel_type, league, sport_focus, location, verified, status, follower_count, total_views, owner_user_id)
VALUES
  ('UCLA Bruins', 'ucla-bruins', 'uclabruins', 'Official UCLA Bruins women''s sports channel — highlights, game recaps, and behind-the-scenes content from Westwood.', 'team', 'Big Ten', 'Multi-sport', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('USC Trojans', 'usc-trojans', 'usctrojans', 'Official USC Trojans women''s sports channel — Fight On! Game highlights, player features, and campus sports culture.', 'team', 'Big Ten', 'Multi-sport', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Loyola Marymount Lions', 'lmu-lions', 'lmulions', 'Official LMU Lions women''s sports channel — WCC competition highlights and Bluff life.', 'team', 'WCC', 'Multi-sport', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('CSUN Matadors', 'csun-matadors', 'csunmatadors', 'Official CSUN Matadors women''s sports channel — Big West action from Northridge.', 'team', 'Big West', 'Multi-sport', 'Northridge, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Long Beach State Beach', 'long-beach-state', 'lbsubeach', 'Official Long Beach State Beach women''s sports channel — Big West competition and highlights.', 'team', 'Big West', 'Multi-sport', 'Long Beach, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Cal State Fullerton Titans', 'csuf-titans', 'csuf_titans', 'Official Cal State Fullerton Titans women''s sports channel — Big West highlights.', 'team', 'Big West', 'Multi-sport', 'Fullerton, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('UC Irvine Anteaters', 'uci-anteaters', 'ucianteaters', 'Official UC Irvine Anteaters women''s sports channel — Big West competition from Irvine.', 'team', 'Big West', 'Multi-sport', 'Irvine, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (slug) DO NOTHING;

-- Professional Teams
INSERT INTO creator_channels (channel_name, slug, handle, description, channel_type, league, sport_focus, location, verified, status, follower_count, total_views, owner_user_id)
VALUES
  ('Los Angeles Dodgers', 'la-dodgers', 'ladodgers', 'Official LA Dodgers channel — highlights, behind-the-scenes, and exclusive content from Chavez Ravine.', 'team', 'MLB', 'Baseball', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Angels', 'la-angels', 'laangels', 'Official LA Angels channel — highlights and content from Angel Stadium.', 'team', 'MLB', 'Baseball', 'Anaheim, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Lakers', 'la-lakers', 'lalakers', 'Official LA Lakers channel — highlights, behind-the-scenes, and exclusive content from Crypto.com Arena.', 'team', 'NBA', 'Basketball', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Clippers', 'la-clippers', 'laclippers', 'Official LA Clippers channel — highlights and content from the Intuit Dome.', 'team', 'NBA', 'Basketball', 'Inglewood, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Rams', 'la-rams', 'larams', 'Official LA Rams channel — game highlights, player features, and SoFi Stadium content.', 'team', 'NFL', 'Football', 'Inglewood, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Chargers', 'la-chargers', 'lachargers', 'Official LA Chargers channel — game highlights and behind-the-scenes.', 'team', 'NFL', 'Football', 'Inglewood, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Kings', 'la-kings', 'lakings', 'Official LA Kings channel — hockey highlights and content from Crypto.com Arena.', 'team', 'NHL', 'Hockey', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Anaheim Ducks', 'anaheim-ducks', 'aaboreducks', 'Official Anaheim Ducks channel — hockey highlights from Honda Center.', 'team', 'NHL', 'Hockey', 'Anaheim, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('LA Galaxy', 'la-galaxy', 'lagalaxy', 'Official LA Galaxy channel — MLS highlights and content from Dignity Health Sports Park.', 'team', 'MLS', 'Soccer', 'Carson, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles FC', 'lafc', 'lafc', 'Official LAFC channel — MLS highlights and content from BMO Stadium.', 'team', 'MLS', 'Soccer', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Los Angeles Sparks', 'la-sparks', 'lasparks', 'Official LA Sparks channel — WNBA highlights, player features, and community content.', 'team', 'WNBA', 'Basketball', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Angel City FC', 'angel-city-fc', 'angelcityfc', 'Official Angel City FC channel — NWSL highlights, player stories, and LA community.', 'team', 'NWSL', 'Soccer', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('LA Rugby Club Women / LARC', 'larc-women', 'larcwomen', 'Official LA Rugby Club Women''s channel — match highlights and rugby culture in LA.', 'team', 'Rugby', 'Rugby', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 6. Seed Creator Channels
-- ============================================================
INSERT INTO creator_channels (channel_name, slug, handle, description, channel_type, league, sport_focus, location, verified, status, follower_count, total_views, owner_user_id)
VALUES
  ('Coach Jackie J', 'coach-jackie-j', 'jcubedhax', 'Women''s sports explainer and culture voice. Lesbian creator centering women''s sports fandom.', 'creator', NULL, 'Multi-sport', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Ari Chambers', 'ari-chambers', 'ariivory', '"It''s about damn time" women''s sports hype leader. WNBA and women''s hoops coverage, interviews, courtside content.', 'creator', NULL, 'Basketball', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Mariah Rose', 'mariah-rose', 'mariahrose', 'Sports explainers "for the girls, gays and theys." Rules, storylines and culture around major events.', 'creator', NULL, 'Multi-sport', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Aliyah Funschelle', 'aliyah-funschelle', 'aliyahfunschelle', 'Host/reporter for pro and college hoops. Behind-the-scenes, interviews, arena content.', 'creator', NULL, 'Basketball', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Logan Hackett', 'logan-hackett', 'logan.hackett', 'Educational women''s sports explainer (NWSL, LPGA, etc.). Approachable breakdowns and storylines.', 'creator', NULL, 'Multi-sport', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Aliya Kae', 'aliya-kae', 'aliyakae', 'WNBA-focused creator with "Back to Basics" teaching series and league explainers.', 'creator', NULL, 'Basketball', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Em Woods', 'em-woods', 'emwoods', 'Women''s soccer/NWSL and World Cup content. Reactions, narrative-driven posts, and fandom skits.', 'creator', NULL, 'Soccer', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Auntie Nae / Janae Sims', 'auntie-nae', 'auntienae', 'Hoops + family and queer-friendly sports lifestyle content, often WNBA-oriented.', 'creator', NULL, 'Basketball', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Katie Feeney', 'katie-feeney', 'katiefeeneyy', 'ESPN digital host. NFL and college football coverage with gameday, sideline and campus content.', 'creator', NULL, 'Football', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Tara Davis-Woodhall', 'tara-davis-woodhall', 'tarathedart', 'Olympic long jumper. Track & field performance, training and lifestyle content.', 'creator', NULL, 'Track & Field', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Jenna Bandy', 'jenna-bandy', 'jennabandy21', 'Basketball influencer and former college player. Trick shots, challenges, and GameChangeHer girls-in-sport work.', 'creator', NULL, 'Basketball', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Bria Janelle', 'bria-janelle', 'iambriajanelle', 'In-arena host and announcer. NBA/WNBA/college, golf and hoops lifestyle, game-day BTS.', 'creator', NULL, 'Multi-sport', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Toni Cowan-Brown', 'toni-cowan-brown', 'tonicowanbrown', 'F1 and motorsport-focused creator. Tech, culture and women''s POV on racing fandom.', 'creator', NULL, 'Motorsport', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000'),
  ('Ilona Maher', 'ilona-maher', 'ilonamaher', 'USA Rugby Olympian. Rugby, body positivity, tournament storytelling, and comedic content.', 'creator', NULL, 'Rugby', NULL, true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 7. Seed Loverball Official Channel
-- ============================================================
INSERT INTO creator_channels (channel_name, slug, handle, description, channel_type, league, sport_focus, location, verified, status, follower_count, total_views, owner_user_id)
VALUES
  ('Loverball Official', 'loverball-official', 'loverball', 'Official Loverball channel — original content, event highlights, and community stories.', 'loverball_official', NULL, 'Multi-sport', 'Los Angeles, CA', true, 'active', 0, 0, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (slug) DO NOTHING;
