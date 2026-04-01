/**
 * Cloudflare D1 REST API client
 * Uses the Cloudflare API v4 to query D1 databases
 * Works from any environment (Vercel, local, etc.)
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const D1_BATCH_LIMIT = 500;

interface D1QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta?: {
    rows_read: number;
    rows_written: number;
    execution_time_ms: number;
  };
}

function getCfHeaders(): HeadersInit {
  const token = process.env.CLOUDFLARE_D1_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error('Missing CLOUDFLARE_D1_API_TOKEN or CLOUDFLARE_ACCOUNT_ID env vars');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getD1Base(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  return `${CF_API_BASE}/accounts/${accountId}/d1/database/${databaseId}`;
}

/**
 * Execute a raw SQL statement against D1
 * @param sql - SQL statement with ? placeholders
 * @param params - Optional query parameters
 */
export async function dbExec(sql: string, params?: (string | number | null)[]): Promise<D1QueryResult> {
  const base = getD1Base();
  const body: Record<string, unknown> = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }
  const res = await fetch(`${base}/query`, {
    method: 'POST',
    headers: getCfHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data)}`);
  }
  // D1 REST API returns: { result: [ { results: [...], success: true, meta: {...} } ], success: true }
  // data.result is an array of QueryResult objects; data.result[0] has the actual meta.
  const queryResult = Array.isArray(data.result) ? data.result[0] : data.result;
  return {
    results: queryResult?.results || [],
    success: queryResult?.success ?? data.success,
    meta: queryResult?.meta,
  };
}

/**
 * Execute a parameterized query
 */
export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const base = getD1Base();
  const body: Record<string, unknown> = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }
  const res = await fetch(`${base}/query`, {
    method: 'POST',
    headers: getCfHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data)}`);
  }
  // D1 REST API returns: { result: [ { results: [...rows...], success: true, meta: {...} } ], success: true }
  // data.result[0].results contains the actual row data.
  const queryResult = Array.isArray(data.result) ? data.result[0] : data.result;
  return (queryResult?.results || []) as T[];
}

/**
 * Run a batch of queries in a single request
 */
export async function dbBatch(sqls: { sql: string; params?: (string | number | null)[] }[]): Promise<D1QueryResult> {
  const base = getD1Base();
  const res = await fetch(`${base}/query`, {
    method: 'POST',
    headers: getCfHeaders(),
    body: JSON.stringify({ sql: sqls.map((s) => s.sql).join('; '), params: sqls.flatMap((s) => s.params || []) }),
  });
  const data = await res.json();
  // For batch queries, data.result is an array of QueryResult objects (one per statement)
  // Return the first query's result for compatibility
  const firstResult = Array.isArray(data.result) ? data.result[0] : data.result;
  return {
    results: firstResult?.results || [],
    success: data.success,
    meta: firstResult?.meta,
  };
}

// ─── User helpers ──────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  plan: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
}

export async function getOrCreateUser(id: string, email: string, name: string | null, avatar: string | null): Promise<DbUser> {
  // Guard: email must not be empty — users.email has UNIQUE NOT NULL constraint.
  // An empty string can cause INSERT OR IGNORE to silently skip due to UNIQUE conflict
  // with another user who also has an empty/null email.
  const safeEmail = email && email.trim() ? email.trim() : `unknown-${id}@placeholder`;

  // Try to fetch existing user first
  const existing = await dbQuery<DbUser>('SELECT * FROM users WHERE id = ?', [id]);
  if (existing.length > 0) {
    // Update email/name/avatar in case they changed
    await dbExec(
      "UPDATE users SET email = ?, name = ?, avatar = ?, updated_at = datetime('now') WHERE id = ?",
      [safeEmail, name, avatar, id]
    ).catch(() => {}); // Non-critical, ignore errors
    const updated = await dbQuery<DbUser>('SELECT * FROM users WHERE id = ?', [id]);
    return updated[0];
  }

  // Insert new user — use ON CONFLICT(id) DO UPDATE to handle race conditions.
  // Previously used INSERT OR IGNORE which silently failed when email UNIQUE constraint
  // was violated (e.g. another user with same empty email), leaving no row for this id.
  // ON CONFLICT(id) ensures the row exists regardless of email collisions.
  const insertResult = await dbExec(
    `INSERT INTO users (id, email, name, avatar, plan) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, updated_at = datetime('now')`,
    [id, safeEmail, name, avatar, 'free']
  );

  // Verify the write actually happened
  if (insertResult.meta && insertResult.meta.rows_written === 0) {
    console.warn(`[getOrCreateUser] rows_written=0 for user ${id}, attempting direct insert fallback`);
    // Fallback: try plain insert in case ON CONFLICT syntax issue
    try {
      await dbExec(
        'INSERT INTO users (id, email, name, avatar, plan) VALUES (?, ?, ?, ?, ?)',
        [id, safeEmail, name, avatar, 'free']
      );
    } catch (insertErr: any) {
      // If it's a duplicate key, that's fine — another process created it
      if (!insertErr.message?.includes('UNIQUE constraint')) {
        throw insertErr;
      }
    }
  }

  // Re-fetch to confirm (handles both insert-success and race-condition cases)
  const user = await dbQuery<DbUser>('SELECT * FROM users WHERE id = ?', [id]);
  if (user.length === 0) {
    throw new Error(`Failed to create/retrieve user ${id} in D1 after insert (email=${safeEmail}, rows_written=${insertResult.meta?.rows_written})`);
  }
  return user[0];
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const users = await dbQuery<DbUser>('SELECT * FROM users WHERE id = ?', [id]);
  return users[0] || null;
}

export async function updateUserPlan(userId: string, plan: 'free' | 'basic' | 'premium'): Promise<void> {
  await dbExec(
    "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?",
    [plan, userId]
  );
}

// ─── Subscription helpers ───────────────────────────────────────────────────

export interface DbSubscription {
  id: string;
  user_id: string;
  plan: 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  paypal_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
}

export async function getActiveSubscription(userId: string): Promise<DbSubscription | null> {
  const subs = await dbQuery<DbSubscription>(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1",
    [userId]
  );
  return subs[0] || null;
}

export async function upsertSubscription(data: {
  id: string;
  user_id: string;
  plan: 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  paypal_subscription_id: string;
  current_period_end: string;
}): Promise<void> {
  await dbExec(`
    INSERT INTO subscriptions (id, user_id, plan, status, paypal_subscription_id, current_period_end)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      plan = excluded.plan,
      status = excluded.status,
      paypal_subscription_id = excluded.paypal_subscription_id,
      current_period_end = excluded.current_period_end
  `, [data.id, data.user_id, data.plan, data.status, data.paypal_subscription_id, data.current_period_end]);
}

// ─── Generation helpers ─────────────────────────────────────────────────────

export interface DbGeneration {
  id: string;
  user_id: string;
  niche: string;
  product_title: string | null;
  product_type: string | null;
  template_id: string | null;
  created_at: string;
}

export async function countGenerationsThisMonth(userId: string): Promise<number> {
  const result = await dbQuery<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM generations WHERE user_id = ? AND created_at >= date('now', 'start of month')",
    [userId]
  );
  return result[0]?.cnt ?? 0;
}

export async function countGenerationsToday(userId: string): Promise<number> {
  const result = await dbQuery<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM generations WHERE user_id = ? AND created_at >= date('now', 'start of day')",
    [userId]
  );
  return result[0]?.cnt ?? 0;
}

export async function createGeneration(data: {
  id: string;
  user_id: string;
  niche: string;
  product_title: string;
  product_type: string;
  template_id: string;
}): Promise<void> {
  await dbExec(
    'INSERT INTO generations (id, user_id, niche, product_title, product_type, template_id) VALUES (?, ?, ?, ?, ?, ?)',
    [data.id, data.user_id, data.niche, data.product_title, data.product_type, data.template_id]
  );
}

export async function getGenerations(userId: string, limit = 20): Promise<DbGeneration[]> {
  return dbQuery<DbGeneration>(
    'SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
}
