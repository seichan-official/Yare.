CREATE TABLE user_agreements (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id),
    terms_version_id    UUID        NOT NULL REFERENCES terms_versions(id),
    checkbox_states     JSONB       NOT NULL,
    ip_address          INET        NOT NULL,
    user_agent          TEXT        NOT NULL,
    agreed_at           TIMESTAMPTZ NOT NULL,
    previous_hash       VARCHAR(64),
    signature_hash      VARCHAR(64) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_user_agreements_user_id ON user_agreements (user_id);
CREATE INDEX idx_user_agreements_agreed_at ON user_agreements (agreed_at DESC);
CREATE UNIQUE INDEX idx_user_agreements_user_version ON user_agreements (user_id, terms_version_id) WHERE deleted_at IS NULL;
