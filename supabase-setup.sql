-- ============================================================
-- PIONEER PORTAL — SUPABASE DATABASE SETUP
-- Ejecuta esto en: Supabase → SQL Editor → New Query
-- ============================================================

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  department   TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── TERCEROS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS terceros (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rnc_cedula       TEXT UNIQUE NOT NULL,
  nombre_razon     TEXT NOT NULL,
  telefono         TEXT NOT NULL,
  correo           TEXT,
  direccion        TEXT,
  porc_impuesto    TEXT,
  observaciones    TEXT,
  status           TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_by_id    UUID REFERENCES users(id),
  created_by_name  TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTO UPDATE TIMESTAMP ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users    ON users;
DROP TRIGGER IF EXISTS set_updated_at_terceros ON terceros;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_terceros
  BEFORE UPDATE ON terceros FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────
-- Allow public access via anon key (auth is handled by Microsoft in JS)
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE terceros   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations with anon key (app handles auth)
CREATE POLICY "allow_all_users"      ON users      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_terceros"   ON terceros   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ── SUPER ADMIN ──────────────────────────────────────────
INSERT INTO users (email, name, role, is_active, department)
VALUES ('b.deleon@pioneerfunds.do', 'Bryan De León', 'admin', true, 'IT')
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true;

-- ── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_terceros_rnc    ON terceros(rnc_cedula);
CREATE INDEX IF NOT EXISTS idx_terceros_nombre ON terceros(nombre_razon);
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at DESC);

-- ✅ Done! Go to Settings → API and copy your anon key for config.js
