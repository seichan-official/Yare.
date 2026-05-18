CREATE TABLE appeals (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    target_type     VARCHAR(32) NOT NULL,
    target_id       UUID        NOT NULL,
    reason          TEXT        NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'submitted',
    reviewer_id     UUID        REFERENCES users(id),
    decision_reason TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_appeal_target_type CHECK (target_type IN ('payment', 'suspicious_review')),
    CONSTRAINT chk_appeal_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected'))
);

CREATE INDEX idx_appeals_user_id ON appeals (user_id);
CREATE INDEX idx_appeals_status ON appeals (status);
