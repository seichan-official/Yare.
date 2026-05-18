CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID        REFERENCES users(id),
    actor_type  VARCHAR(32) NOT NULL,
    action      VARCHAR(64) NOT NULL,
    target_type VARCHAR(64),
    target_id   UUID,
    payload     JSONB,
    ip_address  INET,
    user_agent  TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_actor_type CHECK (actor_type IN ('user', 'admin', 'system'))
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs (target_type, target_id);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs (occurred_at DESC);
