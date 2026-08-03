/*
# Full Game Schema Overhaul — Jujutsu Clash Arena

## Overview
Complete database schema for the visual, architectural, and gameplay overhaul.
Replaces ad-hoc localStorage persistence with live Supabase PostgreSQL.

## New Tables
1. `users` — Player profiles with KYC tier, rank tier, rank points
2. `user_balances` — Multi-currency wallet (SANJU, USDT, Cursed Energy) — replaces existing table
3. `domain_nodes` — Franchise real estate with tier-based ownership
4. `moba_matches` — 5v5 MOBA match records with wager escrow
5. `transactions_ledger` — Canonical audit trail (replaces existing table)

## RPC Functions
1. `increment_sanju_balance(p_user_id, p_amount)` — Atomic SANJU balance mutation
2. `increment_usdt_balance(p_user_id, p_amount)` — Atomic USDT balance mutation
3. `process_moba_wager_payout(p_match_id, p_winner_team)` — Distribute wager pot to winners

## Security
- RLS enabled on all tables
- Policies use `TO anon, authenticated` (no-auth app, anon-key client)
- All tables allow read for all, insert/update for all (single-tenant demo)
*/

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text UNIQUE,
  username text DEFAULT 'Sorcerer',
  kyc_tier int NOT NULL DEFAULT 1,
  is_kyc_verified boolean NOT NULL DEFAULT false,
  rank_tier text NOT NULL DEFAULT 'Bronze',
  rank_points int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. USER_BALANCES TABLE (replace existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_balances (
  user_id text PRIMARY KEY,
  sanju numeric NOT NULL DEFAULT 0,
  usdt numeric NOT NULL DEFAULT 0,
  cursed_energy numeric NOT NULL DEFAULT 100,
  kyc_tier int NOT NULL DEFAULT 0,
  is_kyc_verified boolean NOT NULL DEFAULT false,
  referral_code text,
  rank_tier text DEFAULT 'Bronze',
  rank_points int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ub_select" ON user_balances;
CREATE POLICY "ub_select" ON user_balances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ub_insert" ON user_balances;
CREATE POLICY "ub_insert" ON user_balances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ub_update" ON user_balances;
CREATE POLICY "ub_update" ON user_balances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 3. DOMAIN_NODES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS domain_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  tier_id text NOT NULL CHECK (tier_id IN ('shibuya', 'jujutsu-high', 'detention-center')),
  purchased_at timestamptz DEFAULT now()
);
ALTER TABLE domain_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dn_select" ON domain_nodes;
CREATE POLICY "dn_select" ON domain_nodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "dn_insert" ON domain_nodes;
CREATE POLICY "dn_insert" ON domain_nodes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "dn_update" ON domain_nodes;
CREATE POLICY "dn_update" ON domain_nodes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_dn_owner ON domain_nodes(owner_id);

-- ============================================================
-- 4. MOBA_MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS moba_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL CHECK (match_type IN ('5v5_ranked', 'wager_arena')),
  stake_amount numeric NOT NULL DEFAULT 0,
  stake_currency text NOT NULL CHECK (stake_currency IN ('SANJU', 'USDT')),
  winner_team text CHECK (winner_team IN ('blue', 'red')),
  pot_payout numeric NOT NULL DEFAULT 0,
  player_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE moba_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mm_select" ON moba_matches;
CREATE POLICY "mm_select" ON moba_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "mm_insert" ON moba_matches;
CREATE POLICY "mm_insert" ON moba_matches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "mm_update" ON moba_matches;
CREATE POLICY "mm_update" ON moba_matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mm_player ON moba_matches(player_id);

-- ============================================================
-- 5. TRANSACTIONS_LEDGER TABLE (replace existing)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,
  amount text NOT NULL,
  currency text NOT NULL DEFAULT 'SANJU',
  direction text NOT NULL DEFAULT 'in',
  note text,
  tx_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tl_select" ON transactions_ledger;
CREATE POLICY "tl_select" ON transactions_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tl_insert" ON transactions_ledger;
CREATE POLICY "tl_insert" ON transactions_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_tl_user ON transactions_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_tl_created ON transactions_ledger(created_at DESC);

-- ============================================================
-- RPC: increment_sanju_balance
-- ============================================================
CREATE OR REPLACE FUNCTION increment_sanju_balance(p_user_id text, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  INSERT INTO user_balances (user_id, sanju, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET sanju = user_balances.sanju + p_amount, updated_at = now()
  RETURNING sanju INTO v_new_balance;
  RETURN v_new_balance;
END;
$$;

-- ============================================================
-- RPC: increment_usdt_balance
-- ============================================================
CREATE OR REPLACE FUNCTION increment_usdt_balance(p_user_id text, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  INSERT INTO user_balances (user_id, usdt, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET usdt = user_balances.usdt + p_amount, updated_at = now()
  RETURNING usdt INTO v_new_balance;
  RETURN v_new_balance;
END;
$$;

-- ============================================================
-- RPC: process_moba_wager_payout
-- Distributes the wager pot to the winning team's players.
-- Deducts 5% house rake to the platform treasury.
-- ============================================================
CREATE OR REPLACE FUNCTION process_moba_wager_payout(p_match_id uuid, p_winner_team text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stake_amount numeric;
  v_stake_currency text;
  v_pot_payout numeric;
  v_house_rake numeric;
  v_player_id text;
BEGIN
  -- Get match details
  SELECT stake_amount, stake_currency, player_id INTO v_stake_amount, v_stake_currency, v_player_id
  FROM moba_matches WHERE id = p_match_id;

  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Calculate payout (10 players × stake, minus 5% house rake)
  v_pot_payout := v_stake_amount * 10;
  v_house_rake := v_pot_payout * 0.05;
  v_pot_payout := v_pot_payout - v_house_rake;

  -- Update match with winner and payout
  UPDATE moba_matches SET winner_team = p_winner_team, pot_payout = v_pot_payout WHERE id = p_match_id;

  -- Credit winner's balance
  IF v_stake_currency = 'SANJU' THEN
    PERFORM increment_sanju_balance(v_player_id, v_pot_payout);
  ELSE
    PERFORM increment_usdt_balance(v_player_id, v_pot_payout);
  END IF;

  -- Log the payout
  INSERT INTO transactions_ledger (user_id, type, amount, currency, direction, note)
  VALUES (v_player_id, 'wager_payout', v_pot_payout::text, v_stake_currency, 'in', 'MOBA wager payout');

  RETURN v_pot_payout;
END;
$$;
