/*
# Unified Identity, KYC & Regional Tax Schema

## Overview
Extends player_balances with onboarding, KYC tier, country/region for tax engine,
and vault passkey. Adds a kyc_verifications table for Tier 2 document submissions.
Adds a unified omni_wallet view concept via the player_balances row.

## Modified Tables

### player_balances (ALTER — additive only, no data loss)
- `country_code` (text, nullable) — ISO-ish code from REGIONAL_TAX_RULES (IN, EU, US, BR, GLOBAL)
- `kyc_tier` (int, default 0) — 0 = unverified, 1 = Novice (email/telegram), 2 = Special Grade (gov ID)
- `vault_passkey` (text, nullable) — SHA-256 hash of user-set passkey (never store plaintext)
- `telegram_username` (text, nullable) — Telegram handle for SSO
- `usdt_balance` (numeric, default 0) — internal USDT balance for the Infinity Exchange
- `display_name` (text, nullable) — player display name

## New Tables

### kyc_verifications
- `id` (uuid, PK)
- `player_id` (text)
- `tier` (int) — tier requested (1 or 2)
- `status` (text: 'pending' | 'approved' | 'rejected')
- `document_type` (text, nullable) — passport | drivers_license | national_id
- `provider` (text) — sumsub | persona | manual
- `submitted_at` (timestamptz)
- `reviewed_at` (timestamptz, nullable)

## Security
- RLS enabled on kyc_verifications.
- All policies: anon + authenticated (no-auth app, intentionally public).
- player_balances already has RLS from prior migration — new columns are covered by existing UPDATE policy.
*/

-- Add columns to player_balances (idempotent)
DO $$ BEGIN
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS country_code text;
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS kyc_tier int NOT NULL DEFAULT 0;
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS vault_passkey text;
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS telegram_username text;
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS usdt_balance numeric NOT NULL DEFAULT 0;
  ALTER TABLE player_balances ADD COLUMN IF NOT EXISTS display_name text;
END $$;

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  tier int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  document_type text,
  provider text NOT NULL DEFAULT 'manual',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_kyc" ON kyc_verifications;
CREATE POLICY "anon_select_kyc" ON kyc_verifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_kyc" ON kyc_verifications;
CREATE POLICY "anon_insert_kyc" ON kyc_verifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_kyc" ON kyc_verifications;
CREATE POLICY "anon_update_kyc" ON kyc_verifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_kyc_player ON kyc_verifications(player_id);
