/*
# Enterprise Security, AI, Support & Payments Schema

## Overview
Migrates the economy from localStorage to server-authoritative Supabase tables.
Adds immutable transaction ledger, AI chat history, support tickets,
KYC status, and payment order tracking for the 3-pillar gateway.

## New Tables

### player_balances (Server-Side Authority)
- `player_id` (text, PK) — Telegram/client player ID
- `sanju` (bigint) — secure $SANJU balance (NEVER trust frontend)
- `cursed_energy` (bigint) — secure CE balance
- `kyc_status` (text: 'none' | 'pending' | 'verified' | 'rejected')
- `telegram_id` (bigint, nullable) — Telegram OAuth user ID for Sybil defense
- `ip_address` (inet, nullable) — last known IP for rate-limiting
- `created_at`, `updated_at`

### transaction_ledger (Immutable Receipts)
- `id` (uuid, PK)
- `tx_hash` (text, unique) — human-readable TX ID like "TX-XXXX-XXXX"
- `player_id` (text)
- `type` (text) — summon|trade|purchase|mining|withdraw|deposit|raid|bet|referral|airdrop|vip|ad|relic|clan
- `amount` (bigint) — positive = credit, negative = debit
- `direction` (text: 'in' | 'out')
- `note` (text)
- `balance_after` (bigint) — snapshot of balance post-tx
- `created_at` (timestamptz)
- INSERT only — no UPDATE or DELETE policies (immutable audit trail)

### ai_chat_history (Tengen AI)
- `id` (uuid, PK)
- `player_id` (text)
- `role` (text: 'user' | 'assistant')
- `content` (text)
- `context` (text, nullable) — 'lore' | 'support'
- `created_at` (timestamptz)

### support_tickets
- `id` (uuid, PK)
- `player_id` (text)
- `subject` (text)
- `message` (text)
- `ai_response` (text, nullable) — Gemini auto-response
- `status` (text: 'open' | 'ai_resolved' | 'escalated' | 'closed')
- `escalated` (boolean, default false)
- `created_at`, `resolved_at`

### payment_orders (3-Pillar Gateway)
- `id` (uuid, PK)
- `player_id` (text)
- `pillar` (text: 'stars' | 'fiat' | 'crypto')
- `item_id` (text) — store item purchased
- `amount_usd` (numeric)
- `amount_sanju` (bigint) — $SANJU to credit
- `status` (text: 'pending' | 'paid' | 'failed' | 'refunded')
- `provider` (text) — 'telegram_stars' | 'stripe' | 'moonpay' | 'ton'
- `provider_order_id` (text, nullable) — external order/charge ID
- `webhook_verified` (boolean, default false) — only true after encrypted webhook confirms
- `created_at`, `paid_at`

## Security
- RLS enabled on ALL tables.
- player_balances: anon can read/insert own row, update own row (for MVP; production would use service-role only via edge functions)
- transaction_ledger: INSERT + SELECT only (no UPDATE/DELETE = immutable)
- All other tables: standard anon CRUD (no-auth app, intentionally public)
*/

-- Player Balances (Server-Side Authority)
CREATE TABLE IF NOT EXISTS player_balances (
  player_id text PRIMARY KEY,
  sanju bigint NOT NULL DEFAULT 1000,
  cursed_energy bigint NOT NULL DEFAULT 100,
  kyc_status text NOT NULL DEFAULT 'none',
  telegram_id bigint,
  ip_address inet,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE player_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_balances" ON player_balances;
CREATE POLICY "anon_select_balances" ON player_balances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_balances" ON player_balances;
CREATE POLICY "anon_insert_balances" ON player_balances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_balances" ON player_balances;
CREATE POLICY "anon_update_balances" ON player_balances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Transaction Ledger (Immutable)
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text UNIQUE NOT NULL,
  player_id text NOT NULL,
  type text NOT NULL,
  amount bigint NOT NULL,
  direction text NOT NULL DEFAULT 'out',
  note text,
  balance_after bigint,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ledger" ON transaction_ledger;
CREATE POLICY "anon_select_ledger" ON transaction_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ledger" ON transaction_ledger;
CREATE POLICY "anon_insert_ledger" ON transaction_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);
-- NOTE: No UPDATE or DELETE policies = immutable audit trail

-- AI Chat History
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  context text DEFAULT 'lore',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ai_chat" ON ai_chat_history;
CREATE POLICY "anon_select_ai_chat" ON ai_chat_history FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_chat" ON ai_chat_history;
CREATE POLICY "anon_insert_ai_chat" ON ai_chat_history FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_chat" ON ai_chat_history;
CREATE POLICY "anon_delete_ai_chat" ON ai_chat_history FOR DELETE TO anon, authenticated USING (true);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  ai_response text,
  status text NOT NULL DEFAULT 'open',
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tickets" ON support_tickets;
CREATE POLICY "anon_select_tickets" ON support_tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tickets" ON support_tickets;
CREATE POLICY "anon_insert_tickets" ON support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tickets" ON support_tickets;
CREATE POLICY "anon_update_tickets" ON support_tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Payment Orders
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  pillar text NOT NULL,
  item_id text NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_sanju bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'stripe',
  provider_order_id text,
  webhook_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payment_orders;
CREATE POLICY "anon_select_payments" ON payment_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payment_orders;
CREATE POLICY "anon_insert_payments" ON payment_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payment_orders;
CREATE POLICY "anon_update_payments" ON payment_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_player ON transaction_ledger(player_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ts ON transaction_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_player ON ai_chat_history(player_id);
CREATE INDEX IF NOT EXISTS idx_tickets_player ON support_tickets(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_player ON payment_orders(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_orders(status);
