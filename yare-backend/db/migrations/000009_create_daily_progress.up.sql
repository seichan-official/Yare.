CREATE TABLE daily_progress (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id            UUID    NOT NULL REFERENCES challenges(id),
    date                    DATE    NOT NULL,
    valid_commit_count      INT     NOT NULL DEFAULT 0,
    suspicious_commit_count INT     NOT NULL DEFAULT 0,
    is_achieved             BOOLEAN NOT NULL DEFAULT false,
    total_lines_added       INT     NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_daily_progress_unique ON daily_progress (challenge_id, date);
CREATE INDEX idx_daily_progress_challenge_id ON daily_progress (challenge_id);
