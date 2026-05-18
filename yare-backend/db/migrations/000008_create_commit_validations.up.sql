CREATE TABLE commit_validations (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_commit_id       UUID        NOT NULL UNIQUE REFERENCES raw_commits(id),
    status              VARCHAR(32) NOT NULL,
    reason_codes        JSONB       NOT NULL DEFAULT '[]',
    details             JSONB,
    validated_at        TIMESTAMPTZ NOT NULL,
    validator_version   VARCHAR(32) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_validation_status CHECK (status IN ('valid', 'invalid', 'suspicious'))
);

CREATE INDEX idx_commit_validations_raw_commit_id ON commit_validations (raw_commit_id);
CREATE INDEX idx_commit_validations_status ON commit_validations (status);
