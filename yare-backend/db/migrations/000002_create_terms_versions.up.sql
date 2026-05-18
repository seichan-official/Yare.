CREATE TABLE terms_versions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    version         VARCHAR(32) NOT NULL,
    content         TEXT        NOT NULL,
    content_hash    VARCHAR(64) NOT NULL,
    checkpoint_items JSONB      NOT NULL DEFAULT '[]',
    published_at    TIMESTAMPTZ NOT NULL,
    is_current      BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_terms_versions_version ON terms_versions (version);
CREATE INDEX idx_terms_versions_is_current ON terms_versions (is_current) WHERE is_current = true;
