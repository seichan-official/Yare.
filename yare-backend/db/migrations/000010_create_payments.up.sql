CREATE TABLE payments (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID        NOT NULL REFERENCES users(id),
    challenge_id                UUID        NOT NULL REFERENCES challenges(id),
    payment_type                VARCHAR(32) NOT NULL,
    amount                      INT         NOT NULL,
    status                      VARCHAR(32) NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id    VARCHAR(255),
    scheduled_at                TIMESTAMPTZ NOT NULL,
    pre_notified_at             TIMESTAMPTZ,
    paid_at                     TIMESTAMPTZ,
    failure_reason              TEXT,
    receipt_url                 TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ,
    CONSTRAINT chk_payment_type CHECK (payment_type IN ('fee', 'penalty')),
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'disputed'))
);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_challenge_id ON payments (challenge_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_scheduled_at ON payments (scheduled_at) WHERE status = 'pending';
