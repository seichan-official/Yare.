CREATE TABLE payment_attempts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID        NOT NULL REFERENCES payments(id),
    attempt_number  INT         NOT NULL,
    status          VARCHAR(32) NOT NULL,
    stripe_response JSONB,
    error_code      VARCHAR(64),
    next_retry_at   TIMESTAMPTZ,
    attempted_at    TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_attempt_status CHECK (status IN ('succeeded', 'failed'))
);

CREATE INDEX idx_payment_attempts_payment_id ON payment_attempts (payment_id);
