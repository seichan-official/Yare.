-- name: GetCurrentTermsVersion :one
SELECT * FROM terms_versions
WHERE is_current = true AND deleted_at IS NULL
LIMIT 1;

-- name: GetTermsVersionByID :one
SELECT * FROM terms_versions WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateTermsVersion :one
INSERT INTO terms_versions (
    version, content, content_hash, checkpoint_items, published_at, is_current
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: SetCurrentTermsVersion :exec
UPDATE terms_versions SET is_current = false WHERE is_current = true;

-- name: GetUserAgreement :one
SELECT * FROM user_agreements
WHERE user_id = $1 AND terms_version_id = $2 AND deleted_at IS NULL;

-- name: GetLatestUserAgreement :one
SELECT * FROM user_agreements
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY agreed_at DESC
LIMIT 1;

-- name: CreateUserAgreement :one
INSERT INTO user_agreements (
    user_id, terms_version_id, checkbox_states, ip_address,
    user_agent, agreed_at, previous_hash, signature_hash
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListUserAgreementsByUserID :many
SELECT * FROM user_agreements
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY agreed_at ASC;

-- name: ListAllAgreementsForIntegrityCheck :many
SELECT * FROM user_agreements
WHERE deleted_at IS NULL
ORDER BY agreed_at ASC;
