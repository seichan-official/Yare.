CREATE TABLE challenges (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id),
    status              VARCHAR(32) NOT NULL DEFAULT 'active',
    start_date          DATE        NOT NULL,
    end_date            DATE        NOT NULL,
    frequency_type      VARCHAR(32) NOT NULL,
    frequency_value     INT,
    min_lines_per_day   INT         NOT NULL DEFAULT 30,
    languages           JSONB       NOT NULL DEFAULT '[]',
    challenge_amount    INT         NOT NULL,
    penalty_amount      INT         NOT NULL,
    terms_version_id    UUID        NOT NULL REFERENCES terms_versions(id),
    agreement_id        UUID        NOT NULL REFERENCES user_agreements(id),
    completed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_challenge_amount CHECK (challenge_amount BETWEEN 500 AND 100000),
    CONSTRAINT chk_penalty_amount CHECK (penalty_amount BETWEEN 5000 AND 30000),
    CONSTRAINT chk_dates CHECK (end_date > start_date AND end_date - start_date <= 90),
    CONSTRAINT chk_status CHECK (status IN ('active', 'completed', 'failed', 'cancelled', 'under_review')),
    CONSTRAINT chk_frequency_type CHECK (frequency_type IN ('daily', 'weekly_n'))
);

CREATE INDEX idx_challenges_user_status ON challenges (user_id, status);
CREATE INDEX idx_challenges_end_date ON challenges (end_date) WHERE status = 'active';
