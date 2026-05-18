CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    github_user_id      BIGINT      NOT NULL,
    github_login        VARCHAR(64) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    display_name        VARCHAR(128),
    avatar_url          TEXT,
    github_access_token TEXT        NOT NULL,
    age_verified_at     TIMESTAMPTZ,
    role                VARCHAR(32) NOT NULL DEFAULT 'user',
    status              VARCHAR(32) NOT NULL DEFAULT 'active',
    totp_secret         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_github_user_id ON users (github_user_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status) WHERE deleted_at IS NULL;

COMMENT ON COLUMN users.github_access_token IS 'AES-256-GCM暗号化済み';
COMMENT ON COLUMN users.totp_secret IS 'AES-256-GCM暗号化済み（管理者のみ）';
