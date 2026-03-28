-- ============================================================
-- MintKit D1 Schema Migration
-- Run with: wrangler d1 migrations apply mintkit --local (dev)
--           wrangler d1 migrations apply mintkit (production)
-- ============================================================

-- Users table (extends NextAuth users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'basic', 'premium')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('basic', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'past_due')),
  paypal_subscription_id TEXT UNIQUE,
  current_period_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Generations history table
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  product_title TEXT,
  product_type TEXT CHECK(product_type IN ('planner', 'checklist', 'guide', 'workbook', 'journal', 'tracker')),
  template_id TEXT DEFAULT 'modern',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
