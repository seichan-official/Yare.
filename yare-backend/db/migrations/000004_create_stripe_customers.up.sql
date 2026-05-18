CREATE TABLE stripe_customers (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID        NOT NULL UNIQUE REFERENCES users(id),
    stripe_customer_id          VARCHAR(255) NOT NULL,
    default_payment_method_id   VARCHAR(255),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                  TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_stripe_customers_stripe_id ON stripe_customers (stripe_customer_id);
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers (user_id);
