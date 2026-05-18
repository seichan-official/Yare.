CREATE TABLE suspicious_reviews (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_commit_id       UUID        NOT NULL REFERENCES raw_commits(id),
    status              VARCHAR(32) NOT NULL DEFAULT 'pending',
    reviewer_id         UUID        REFERENCES users(id),
    suspicion_reasons   JSONB       NOT NULL DEFAULT '[]',
    contacted_at        TIMESTAMPTZ,
    user_response       TEXT,
    responded_at        TIMESTAMPTZ,
    final_decision      VARCHAR(32),
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_review_status CHECK (status IN ('pending', 'contacted', 'responded', 'confirmed_fraud', 'confirmed_valid', 'expired'))
);

CREATE INDEX idx_suspicious_reviews_raw_commit_id ON suspicious_reviews (raw_commit_id);
CREATE INDEX idx_suspicious_reviews_status ON suspicious_reviews (status);
CREATE INDEX idx_suspicious_reviews_contacted_at ON suspicious_reviews (contacted_at) WHERE status = 'contacted';
