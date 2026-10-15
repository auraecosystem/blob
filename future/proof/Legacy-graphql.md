# QueryShield — Postgres Agent SQL AST Firewall Benchmark

Deterministic, pre-execution SQL AST evaluation (`pgsql-ast-parser`) for LmLm`tool_calls`. 
Designed to run as a self-hosted sidecar container in **Observe-Only Mode** (zero payload mutation, zero data egress) or **Enforce Mode**.

## 28-Vector Red-Team Verification Suite

| Test Vector | SQL Payload | Expected | Actual | Rule Triggered | Latency (ms) |
|---|---|---|---|---|---|
| Unbounded DELETE | `DELETE FROM users;` | **BLOCK** | PASS (BLOCK) | `UNBOUNDED_MUTATION` | 15.552ms |
| Classic Tautology (1=1) | `DELETE FROM users WHERE 1 = 1;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 2.184ms |
| Column Self-Comparison (id=id) | `UPDATE users SET role = 'admin' WHERE id = id;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 1.969ms |
| Range Sweep Bypass (id > -1) | `DELETE FROM users WHERE id > -1;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 1.265ms |
| Not-Equal Sweep (email != '') | `DELETE FROM users WHERE email != 'impossible';` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 2.257ms |
| IS NOT NULL Sweep | `DELETE FROM users WHERE id IS NOT NULL;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 1.388ms |
| Boolean Column Mass Sweep | `DELETE FROM users WHERE is_archived = false;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 1.123ms |
| OR-Branch Poisoning (id=5 OR 1=1) | `DELETE FROM users WHERE id = 5 OR 1 = 1;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 1.581ms |
| LIKE Wildcard Sweep | `DELETE FROM users WHERE email LIKE '%';` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 0.718ms |
| CTE Destructive Wrapper | `WITH d AS (DELETE FROM users) SELECT * FROM d;` | **BLOCK** | PASS (BLOCK) | `UNBOUNDED_MUTATION` | 1.500ms |
| Multi-Statement Piggyback | `SELECT * FROM users WHERE id = 1; DROP TABLE users;` | **BLOCK** | PASS (BLOCK) | `MULTI_STATEMENT, DISALLOWED_STATEMENT_TYPE, DESTRUCTIVE_DDL` | 4.747ms |
| Destructive TRUNCATE | `TRUNCATE TABLE audit_logs;` | **BLOCK** | PASS (BLOCK) | `DISALLOWED_STATEMENT_TYPE, DESTRUCTIVE_DDL` | 0.645ms |
| Non-unique equality sweep | `DELETE FROM orders WHERE status = 'pending';` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 0.757ms |
| Boolean sweep via string | `DELETE FROM users WHERE is_archived = 'false';` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 0.797ms |
| Tenant-wide delete | `DELETE FROM users WHERE tenant_id = 1;` | **BLOCK** | PASS (BLOCK) | `UNSAFE_WHERE_BOUNDARY` | 0.923ms |
| DELETE USING tautology | `DELETE FROM users USING (SELECT 1 AS one) x WHERE x.one = 1;` | **BLOCK** | PASS (BLOCK) | `PARSE_FAILURE` | 1.278ms |
| UPDATE FROM tautology | `UPDATE users SET role = 'admin' FROM (SELECT 1 AS one) x WHERE x.one = 1;` | **BLOCK** | PASS (BLOCK) | `JOINED_MUTATION_BLOCKED, UNSAFE_WHERE_BOUNDARY` | 1.947ms |
| Upsert mass overwrite | `INSERT INTO users (id, role) SELECT id, 'admin' FROM users ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;` | **BLOCK** | PASS (BLOCK) | `UNBOUNDED_UPSERT` | 2.877ms |
| DO block hides DELETE | `DO $$BEGIN DELETE FROM users; END$$;` | **BLOCK** | PASS (BLOCK) | `DISALLOWED_STATEMENT_TYPE, DESTRUCTIVE_DDL` | 0.270ms |
| DROP SCHEMA | `DROP SCHEMA public CASCADE;` | **BLOCK** | PASS (BLOCK) | `PARSE_FAILURE` | 0.472ms |
| Side-effect function | `SELECT wipe_everything();` | **BLOCK** | PASS (BLOCK) | `SIDE_EFFECT_FUNCTION` | 0.959ms |
| Bounded Single-Row DELETE | `DELETE FROM sessions WHERE session_id = 'abc-123';` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.090ms |
| Bounded PK UPDATE | `UPDATE users SET last_login = NOW() WHERE id = 42;` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.100ms |
| Bounded Composite AND Clause | `UPDATE orders SET status = 'shipped' WHERE id = 99 AND paid = true;` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.525ms |
| Bounded IN List | `DELETE FROM notifications WHERE id IN (10, 11, 12);` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.663ms |
| Typed param ($1::uuid) | `UPDATE users SET plan = 'pro' WHERE id = $1::uuid;` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.388ms |
| ANY array param | `DELETE FROM notifications WHERE id = ANY($1);` | **ALLOW** | PASS (ALLOW) | `NONE` | 1.205ms |
| Negative id (-5) | `DELETE FROM t WHERE id = -5;` | **ALLOW** | PASS (ALLOW) | `NONE` | 0.857ms |

**Summary:** 28/28 passed (21/21 red-team vectors blocked, 7/7 legitimate parameterized/bounded queries allowed)  
**Warm Latency Benchmark (1,000 AST Evaluations):** `p50 = 0.346ms` | `p95 = 1.007ms` | `p99 = 1.575ms`

## Architectural Scope & Known Limits
1. **Syntactic vs. Schema-Aware Bounding:** At the HTTP gateway layer, `isBounded` enforces syntactic row bounding (`=` or `IN` / `= ANY($1)` against target-table identifier columns) and blocks known low-cardinality/partition sweeps (`status`, `tenant_id`, `is_*`). Full cardinality guarantees require schema PK configuration or DB-client transaction row-count caps.
2. **Observe-Only Guarantee:** In `OBSERVE` mode (default), QueryShield never mutates request/response payloads or aborts SSE streams. Streamed `delta.tool_calls` are reassembled out-of-band and logged to Postgres (with a 50MB disk-bounded WAL fallback).
