/*
# Social & Community Features Schema

## Overview
Adds tables for the full community/growth feature set:
1. Player profiles (global identity for leaderboards, clans, referrals)
2. Clans / guilds with treasury and GvG turf wars
3. Clan members
4. Server-wide Raid Boss events with damage tracking
5. PvP leaderboard for spectator betting
6. Bet records (wagers on PvP matches)
7. Referral / "Binding Vow" multi-level affiliate system
8. Airdrop records (mass-distribution log)

## Design Notes
- No auth: this app has no sign-in screen. All policies use `TO anon, authenticated`.
- `player_id` is a text identifier generated client-side and stored in localStorage.
- All tables are intentionally shared/public (single-tenant community app).

## New Tables

### players
- `id` (text, primary key) — client-generated player ID
- `name` (text) — display name
- `sanju` (bigint) — cached balance for leaderboards
- `power` (int) — total team power
- `wins` (int), `losses` (int) — PvP record
- `referral_code` (text, unique) — unique invite code
- `referred_by` (text) — referral code of inviter (nullable)
- `created_at` (timestamptz)

### clans
- `id` (uuid, primary key)
- `name` (text, unique)
- `leader_id` (text) — player ID of creator
- `treasury` (bigint) — wagered $SANJU pool
- `territory` (text) — controlled territory ('Shibuya', 'Kyoto', null)
- `created_at` (timestamptz)

### clan_members
- `id` (uuid, primary key)
- `clan_id` (uuid, references clans)
- `player_id` (text)
- `joined_at` (timestamptz)

### raid_bosses
- `id` (uuid, primary key)
- `name` (text) — boss name (e.g. "Mahoraga")
- `hp` (bigint) — total HP
- `max_hp` (bigint)
- `reward_pool_sanju` (bigint)
- `reward_pool_usdt` (numeric)
- `starts_at` (timestamptz)
- `ends_at` (timestamptz)
- `defeated` (boolean, default false)
- `created_at` (timestamptz)

### raid_attacks
- `id` (uuid, primary key)
- `raid_id` (uuid, references raid_bosses)
- `player_id` (text)
- `damage` (bigint)
- `created_at` (timestamptz)

### pvp_matches
- `id` (uuid, primary key)
- `player1_id` (text)
- `player2_id` (text)
- `player1_char` (text)
- `player2_char` (text)
- `winner_id` (text, nullable until resolved)
- `status` (text: 'scheduled' | 'live' | 'completed')
- `scheduled_at` (timestamptz)
- `created_at` (timestamptz)

### bets
- `id` (uuid, primary key)
- `match_id` (uuid, references pvp_matches)
- `bettor_id` (text) — player ID
- `bet_on` (text) — player1_id or player2_id
- `amount` (bigint) — $SANJU wagered
- `resolved` (boolean, default false)
- `payout` (bigint, default 0)
- `created_at` (timestamptz)

### referrals
- `id` (uuid, primary key)
- `referrer_id` (text) — player ID of inviter
- `disciple_id` (text) — player ID of invitee
- `level` (int) — 1 for direct, 2 for indirect
- `total_earned` (bigint) — cumulative $SANJU earned from this disciple
- `created_at` (timestamptz)

### airdrops
- `id` (uuid, primary key)
- `amount` (bigint) — $SANJU per recipient
- `recipient_count` (int)
- `note` (text)
- `created_at` (timestamptz)

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a no-auth community app — all data is intentionally public/shared.
*/

-- Players
CREATE TABLE IF NOT EXISTS players (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Sorcerer',
  sanju bigint NOT NULL DEFAULT 0,
  power int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  referral_code text UNIQUE,
  referred_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_players" ON players;
CREATE POLICY "anon_crud_players" ON players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_players" ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_players" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_players" ON players FOR DELETE TO anon, authenticated USING (true);

-- Clans
CREATE TABLE IF NOT EXISTS clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  leader_id text NOT NULL,
  treasury bigint NOT NULL DEFAULT 0,
  territory text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clans" ON clans;
CREATE POLICY "anon_select_clans" ON clans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clans" ON clans;
CREATE POLICY "anon_insert_clans" ON clans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clans" ON clans;
CREATE POLICY "anon_update_clans" ON clans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clans" ON clans;
CREATE POLICY "anon_delete_clans" ON clans FOR DELETE TO anon, authenticated USING (true);

-- Clan Members
CREATE TABLE IF NOT EXISTS clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE (clan_id, player_id)
);
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clan_members" ON clan_members;
CREATE POLICY "anon_select_clan_members" ON clan_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clan_members" ON clan_members;
CREATE POLICY "anon_insert_clan_members" ON clan_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clan_members" ON clan_members;
CREATE POLICY "anon_delete_clan_members" ON clan_members FOR DELETE TO anon, authenticated USING (true);

-- Raid Bosses
CREATE TABLE IF NOT EXISTS raid_bosses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hp bigint NOT NULL,
  max_hp bigint NOT NULL,
  reward_pool_sanju bigint NOT NULL DEFAULT 0,
  reward_pool_usdt numeric NOT NULL DEFAULT 0,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz DEFAULT now(),
  defeated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE raid_bosses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_raid_bosses" ON raid_bosses;
CREATE POLICY "anon_select_raid_bosses" ON raid_bosses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_raid_bosses" ON raid_bosses;
CREATE POLICY "anon_insert_raid_bosses" ON raid_bosses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_raid_bosses" ON raid_bosses;
CREATE POLICY "anon_update_raid_bosses" ON raid_bosses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Raid Attacks
CREATE TABLE IF NOT EXISTS raid_attacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id uuid NOT NULL REFERENCES raid_bosses(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  damage bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE raid_attacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_raid_attacks" ON raid_attacks;
CREATE POLICY "anon_select_raid_attacks" ON raid_attacks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_raid_attacks" ON raid_attacks;
CREATE POLICY "anon_insert_raid_attacks" ON raid_attacks FOR INSERT TO anon, authenticated WITH CHECK (true);

-- PvP Matches (for spectator betting)
CREATE TABLE IF NOT EXISTS pvp_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id text NOT NULL,
  player2_id text NOT NULL,
  player1_char text NOT NULL,
  player2_char text NOT NULL,
  winner_id text,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_pvp_matches" ON pvp_matches;
CREATE POLICY "anon_select_pvp_matches" ON pvp_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pvp_matches" ON pvp_matches;
CREATE POLICY "anon_insert_pvp_matches" ON pvp_matches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pvp_matches" ON pvp_matches;
CREATE POLICY "anon_update_pvp_matches" ON pvp_matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Bets
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  bettor_id text NOT NULL,
  bet_on text NOT NULL,
  amount bigint NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  payout bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bets" ON bets;
CREATE POLICY "anon_select_bets" ON bets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bets" ON bets;
CREATE POLICY "anon_insert_bets" ON bets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bets" ON bets;
CREATE POLICY "anon_update_bets" ON bets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id text NOT NULL,
  disciple_id text NOT NULL,
  level int NOT NULL DEFAULT 1,
  total_earned bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (referrer_id, disciple_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_referrals" ON referrals;
CREATE POLICY "anon_select_referrals" ON referrals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_referrals" ON referrals;
CREATE POLICY "anon_insert_referrals" ON referrals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_referrals" ON referrals;
CREATE POLICY "anon_update_referrals" ON referrals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Airdrops
CREATE TABLE IF NOT EXISTS airdrops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount bigint NOT NULL,
  recipient_count int NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_airdrops" ON airdrops;
CREATE POLICY "anon_select_airdrops" ON airdrops FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_airdrops" ON airdrops;
CREATE POLICY "anon_insert_airdrops" ON airdrops FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_player ON clan_members(player_id);
CREATE INDEX IF NOT EXISTS idx_raid_attacks_raid ON raid_attacks(raid_id);
CREATE INDEX IF NOT EXISTS idx_raid_attacks_player ON raid_attacks(player_id);
CREATE INDEX IF NOT EXISTS idx_bets_match ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_bettor ON bets(bettor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_disciple ON referrals(disciple_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_status ON pvp_matches(status);
CREATE INDEX IF NOT EXISTS idx_players_referral ON players(referral_code);
