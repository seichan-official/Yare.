-- name: CreateSuspiciousReview :one
INSERT INTO suspicious_reviews (raw_commit_id, status, suspicion_reasons)
VALUES ($1, 'pending', $2)
RETURNING *;

-- name: GetSuspiciousReviewByID :one
SELECT * FROM suspicious_reviews WHERE id = $1 AND deleted_at IS NULL;

-- name: UpdateSuspiciousReviewContacted :exec
UPDATE suspicious_reviews SET
    status = 'contacted',
    contacted_at = now(),
    updated_at = now()
WHERE id = $1;

-- name: UpdateSuspiciousReviewResponse :exec
UPDATE suspicious_reviews SET
    status = 'responded',
    user_response = $2,
    responded_at = now(),
    updated_at = now()
WHERE id = $1;

-- name: UpdateSuspiciousReviewDecision :exec
UPDATE suspicious_reviews SET
    status = $2,
    final_decision = $3,
    reviewer_id = $4,
    decided_at = now(),
    updated_at = now()
WHERE id = $1;

-- name: ListPendingSuspiciousReviews :many
SELECT sr.*, rc.commit_sha, rc.challenge_id FROM suspicious_reviews sr
JOIN raw_commits rc ON rc.id = sr.raw_commit_id
WHERE sr.status = 'pending' AND sr.deleted_at IS NULL
ORDER BY sr.created_at ASC;

-- name: ListExpiredSuspiciousReviews :many
SELECT * FROM suspicious_reviews
WHERE status = 'contacted'
    AND contacted_at + INTERVAL '7 days' <= now()
    AND deleted_at IS NULL;

-- name: CreateAppeal :one
INSERT INTO appeals (user_id, target_type, target_id, reason, status)
VALUES ($1, $2, $3, $4, 'submitted')
RETURNING *;

-- name: GetAppealByID :one
SELECT * FROM appeals WHERE id = $1 AND deleted_at IS NULL;

-- name: UpdateAppealStatus :exec
UPDATE appeals SET
    status = $2,
    reviewer_id = $3,
    decision_reason = $4,
    decided_at = $5,
    updated_at = now()
WHERE id = $1;

-- name: ListAppealsByUserID :many
SELECT * FROM appeals
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;
