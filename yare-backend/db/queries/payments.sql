-- name: CreatePayment :one
INSERT INTO payments (
    user_id, challenge_id, payment_type, amount, status, scheduled_at
) VALUES ($1, $2, $3, $4, 'pending', $5)
RETURNING *;

-- name: GetPaymentByID :one
SELECT * FROM payments WHERE id = $1 AND deleted_at IS NULL;

-- name: UpdatePaymentStatus :one
UPDATE payments SET
    status = $2,
    stripe_payment_intent_id = $3,
    paid_at = $4,
    failure_reason = $5,
    receipt_url = $6,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: UpdatePaymentPreNotified :exec
UPDATE payments SET
    pre_notified_at = now(),
    updated_at = now()
WHERE id = $1;

-- name: ListPendingPaymentsToProcess :many
SELECT * FROM payments
WHERE status = 'pending'
    AND scheduled_at <= now()
    AND deleted_at IS NULL
ORDER BY scheduled_at ASC;

-- name: ListPaymentsByChallengeID :many
SELECT * FROM payments
WHERE challenge_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: CreatePaymentAttempt :one
INSERT INTO payment_attempts (
    payment_id, attempt_number, status, stripe_response,
    error_code, next_retry_at, attempted_at
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetLastPaymentAttempt :one
SELECT * FROM payment_attempts
WHERE payment_id = $1
ORDER BY attempt_number DESC
LIMIT 1;

-- name: CountPaymentAttempts :one
SELECT COUNT(*) FROM payment_attempts WHERE payment_id = $1;

-- name: GetStripeCustomerByUserID :one
SELECT * FROM stripe_customers WHERE user_id = $1 AND deleted_at IS NULL;

-- name: CreateStripeCustomer :one
INSERT INTO stripe_customers (user_id, stripe_customer_id, default_payment_method_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateStripeCustomerPaymentMethod :exec
UPDATE stripe_customers SET
    default_payment_method_id = $2,
    updated_at = now()
WHERE user_id = $1;
