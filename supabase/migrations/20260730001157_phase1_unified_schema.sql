/*
# Phase 1: Unified Schema — Multi-Currency Balances, Transaction Ledger, Domain Nodes

## user_balances — Multi-currency wallet (replaces ad-hoc player_balances for trading)
## transactions_ledger — Persistent audit trail (canonical name with 's')
## domain_nodes — Franchise real estate for Real Yield ecosystem
*/

-- Multi-currency user balances
CREATE TABLE IF NOT EXISTS user_balances (
  user_id text PRIMARY KEY,
  sanju numeric NOT NULL DEFAULT 0,
  usdt numeric NOT NULL DEFAULT 0,
  btc numeric NOT NULL DEFAULT 0,
  eth numeric NOT NULL DEFAULT 0,
  sol numeric NOT NULL DEFAULT 0,
  cursed_energy numeric NOT NULL DEFAULT 0,
  kyc_tier int NOT NULL DEFAULT 0,
  is_kyc_verified boolean NOT NULL DEFAULT false,
  referral_code text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ub_select" ON user_balances;
CREATE POLICY "ub_select" ON user_balances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ub_insert" ON user_balances;
CREATE POLICY "ub_insert" ON user_balances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ub_update" ON user_balances;
CREATE POLICY "ub_update" ON user_balances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Transactions ledger (canonical plural name)
CREATE TABLE IF NOT EXISTS transactions_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'SANJU',
  direction text NOT NULL DEFAULT 'in',
  note text,
  balance_after numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tl_select" ON transactions_ledger;
CREATE POLICY "tl_select" ON transactions_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tl_insert" ON transactions_ledger;
CREATE POLICY "tl_insert" ON transactions_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tl_user ON transactions_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_tl_created ON transactions_ledger(created_at DESC);

-- Domain Nodes (franchise real estate)
CREATE TABLE IF NOT EXISTS domain_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  tier text NOT NULL,
  owner_id text NOT NULL,
  purchase_price_usdt numeric NOT NULL DEFAULT 0,
  payment_currency text NOT NULL DEFAULT 'USDT',
  yield_earned numeric NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1.0,
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
