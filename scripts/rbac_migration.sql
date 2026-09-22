-- =============================================================================
-- Shareholder portal: Role & Permission (RBAC) migration
-- Compatible with existing public.users (does NOT create a new User table)
--
-- Safe to re-run: uses IF NOT EXISTS / guarded ALTERs where practical.
-- Run in pgAdmin or: psql -U postgres -d <your_db> -f scripts/rbac_migration.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Core RBAC tables (snake_case to match users / dividend_decisions / sh_dividend)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.permissions (
    id              SERIAL PRIMARY KEY,
    action          VARCHAR(150) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT permissions_action_key UNIQUE (action)
);

CREATE TABLE IF NOT EXISTS public.roles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE, -- protect seeded admin/staff/user
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id         INTEGER NOT NULL,
    permission_id   INTEGER NOT NULL,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES public.roles (id)
        ON UPDATE NO ACTION ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES public.permissions (id)
        ON UPDATE NO ACTION ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 2) Link existing users → roles (keep legacy "role" varchar for now)
-- -----------------------------------------------------------------------------

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_users_role'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT fk_users_role
            FOREIGN KEY (role_id) REFERENCES public.roles (id)
            ON UPDATE NO ACTION ON DELETE SET NULL;
    END IF;
END $$;

-- Drop hardcoded role check so future custom roles are allowed
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_type_check;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions (permission_id);

-- -----------------------------------------------------------------------------
-- 3) Seed system roles (map to current role strings in users.role)
-- -----------------------------------------------------------------------------

INSERT INTO public.roles (name, description, is_system)
VALUES
    ('admin',  'Full system administrator', TRUE),
    ('staff',  'Internal staff / front-desk operator', TRUE),
    ('user',   'Shareholder portal user', TRUE),
    ('user2',  'Legacy shareholder role (kept for existing data)', TRUE)
ON CONFLICT (name) DO UPDATE
SET
    description = EXCLUDED.description,
    is_system   = EXCLUDED.is_system,
    updated_at  = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 4) Seed permissions (actions used by this app)
--    Naming: resource.action  (stable keys for code checks)
-- -----------------------------------------------------------------------------

INSERT INTO public.permissions (action, description)
VALUES
    -- Users / staff accounts
    ('users.view',              'View staff and admin user accounts'),
    ('users.create',            'Create staff/admin accounts'),
    ('users.update',            'Update staff/admin accounts'),
    ('users.delete',            'Delete staff/admin accounts'),
    ('users.reset_password',    'Reset another user password'),

    -- Roles & permissions management
    ('roles.view',              'View roles'),
    ('roles.create',            'Create roles'),
    ('roles.update',            'Update roles and assigned permissions'),
    ('roles.delete',            'Delete non-system roles'),
    ('permissions.view',        'View permission catalog'),
    ('permissions.manage',      'Create/update permission catalog (admin only)'),

    -- Shareholder registry
    ('shareholders.view',       'View shareholder registry'),
    ('shareholders.create',     'Add shareholders'),
    ('shareholders.update',     'Update shareholder records'),
    ('shareholders.reset_password', 'Reset shareholder portal password'),

    -- Dividend data
    ('dividends.view',          'View dividend records'),
    ('dividends.upload',        'Bulk upload dividend data'),

    -- Decisions / forms
    ('decisions.view_own',      'View own dividend decisions'),
    ('decisions.submit_own',    'Submit own dividend decision'),
    ('decisions.view_all',      'View all submitted decisions (basket)'),
    ('decisions.submit_behalf', 'Submit decision on behalf of a shareholder'),
    ('decisions.approve',       'Approve decisions for payment processing'),
    ('decisions.reject',        'Reject decisions'),

    -- Reports / misc
    ('reports.view',            'View operational reports'),
    ('system.admin',            'Access system administration areas')
ON CONFLICT (action) DO UPDATE
SET
    description = EXCLUDED.description,
    updated_at  = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 5) Assign permissions to roles
-- -----------------------------------------------------------------------------

-- Clear then re-seed role_permissions for system roles (idempotent for these names)
DELETE FROM public.role_permissions
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('admin', 'staff', 'user', 'user2'));

-- ADMIN: everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin';

-- STAFF: operations (no role/permission management, no approve unless you want it)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.action IN (
    'shareholders.view',
    'shareholders.create',
    'shareholders.update',
    'shareholders.reset_password',
    'dividends.view',
    'dividends.upload',
    'decisions.view_all',
    'decisions.submit_behalf',
    'reports.view'
)
WHERE r.name = 'staff';

-- USER / USER2: shareholder self-service
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.action IN (
    'dividends.view',
    'decisions.view_own',
    'decisions.submit_own'
)
WHERE r.name IN ('user', 'user2');

-- -----------------------------------------------------------------------------
-- 6) Backfill users.role_id from existing users.role text
-- -----------------------------------------------------------------------------

UPDATE public.users u
SET role_id = r.id
FROM public.roles r
WHERE lower(trim(u.role)) = lower(r.name)
  AND (u.role_id IS DISTINCT FROM r.id);

-- Any leftover unknown role strings → attach to 'user' (adjust if needed)
UPDATE public.users u
SET role_id = (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1)
WHERE u.role_id IS NULL;

-- Optional: keep legacy role column in sync with roles.name (helps old code)
UPDATE public.users u
SET role = r.name
FROM public.roles r
WHERE u.role_id = r.id
  AND u.role IS DISTINCT FROM r.name;

-- -----------------------------------------------------------------------------
-- 7) Helper view: effective permissions per user
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_user_permissions AS
SELECT
    u.id AS user_id,
    u.username,
    r.id AS role_id,
    r.name AS role_name,
    p.id AS permission_id,
    p.action AS permission_action,
    p.description AS permission_description
FROM public.users u
LEFT JOIN public.roles r ON r.id = u.role_id
LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
LEFT JOIN public.permissions p ON p.id = rp.permission_id;

COMMIT;

-- =============================================================================
-- Verification (run after COMMIT, outside the transaction if you prefer)
-- =============================================================================
-- SELECT name, is_system FROM public.roles ORDER BY id;
-- SELECT action FROM public.permissions ORDER BY action;
-- SELECT r.name, COUNT(rp.permission_id)
-- FROM public.roles r
-- LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
-- GROUP BY r.name;
-- SELECT role, role_id, COUNT(*) FROM public.users GROUP BY role, role_id;
-- SELECT * FROM public.v_user_permissions WHERE username = 'admin' LIMIT 50;
-- =============================================================================
