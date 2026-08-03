/*
# MOBA Ecosystem Schema — Jujutsu Legends 5v5

## Overview
Adds tables for MOBA match history, ranked Elo tracking, and eSports tournaments.

## New Tables

### moba_matches
- Match record: winner, mvp, player stats, duration, $SANJU rewards

### moba_ranked
- Per-player ranked stats: elo, wins, losses, rank tier, daily earnings cap

### moba_tournaments
- Weekend bracket tournaments with entry fees and prize pools

## Security
- RLS enabled, anon + authenticated (no-auth app)
*/

CREATE TABLE IF NOT EXISTS moba_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  result text NOT NULL DEFAULT 'win',
  team text NOT NULL,
  mvp boolean DEFAULT false,
  kills int DEFAULT 0,
  deaths int DEFAULT 0,
  assists int DEFAULT 0,
  character_id text NOT NULL,
  duration_sec int DEFAULT 720,
  sanju_reward bigint DEFAULT 0,
  first_blood boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE moba_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_moba_matches" ON moba_matches;
CREATE POLICY "anon_select_moba_matches" ON moba_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_moba_matches" ON moba_matches;
CREATE POLICY "anon_insert_moba_matches" ON moba_matches FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS moba_ranked (
  player_id text PRIMARY KEY,
  elo int NOT NULL DEFAULT 1000,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  rank_tier text NOT NULL DEFAULT 'Bronze',
  daily_earned bigint NOT NULL DEFAULT 0,
  daily_cap bigint NOT NULL DEFAULT 5000,
  daily_reset date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE moba_ranked ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_moba_ranked" ON moba_ranked;
CREATE POLICY "anon_select_moba_ranked" ON moba_ranked FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_moba_ranked" ON moba_ranked;
CREATE POLICY "anon_insert_moba_ranked" ON moba_ranked FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_moba_ranked" ON moba_ranked;
CREATE POLICY "anon_update_moba_ranked" ON moba_ranked FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS moba_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entry_fee bigint NOT NULL DEFAULT 1000,
  prize_pool bigint NOT NULL DEFAULT 0,
  max_teams int NOT NULL DEFAULT 16,
  registered_teams int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  starts_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE moba_tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tournaments" ON moba_tournaments;
CREATE POLICY "anon_select_tournaments" ON moba_tournaments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tournaments" ON moba_tournaments;
CREATE POLICY "anon_insert_tournaments" ON moba_tournaments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tournaments" ON moba_tournaments;
CREATE POLICY "anon_update_tournaments" ON moba_tournaments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_moba_matches_player ON moba_matches(player_id);
CREATE INDEX IF NOT EXISTS idx_moba_ranked_elo ON moba_ranked(elo DESC);
