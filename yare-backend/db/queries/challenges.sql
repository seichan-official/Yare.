-- name: CreateChallenge :one
INSERT INTO challenges (
    user_id, status, start_date, end_date, frequency_type, frequency_value,
    min_lines_per_day, languages, challenge_amount, penalty_amount,
    terms_version_id, agreement_id
) VALUES ($1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetChallengeByID :one
SELECT * FROM challenges WHERE id = $1 AND deleted_at IS NULL;

-- name: GetActiveChallengeByUserID :one
SELECT * FROM challenges
WHERE user_id = $1 AND status = 'active' AND deleted_at IS NULL
LIMIT 1;

-- name: ListChallengesByUserID :many
SELECT * FROM challenges
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateChallengeStatus :one
UPDATE challenges SET
    status = $2,
    completed_at = $3,
    failed_at = $4,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: ListActiveChallengesToJudge :many
SELECT * FROM challenges
WHERE status = 'active'
    AND end_date < CURRENT_DATE
    AND deleted_at IS NULL;

-- name: SoftDeleteChallenge :exec
UPDATE challenges SET
    deleted_at = now(),
    status = 'cancelled',
    updated_at = now()
WHERE id = $1;

-- name: CreateChallengeRepository :one
INSERT INTO challenge_repositories (
    challenge_id, github_repo_id, full_name, webhook_secret
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateChallengeRepositoryWebhook :exec
UPDATE challenge_repositories SET
    webhook_id = $2,
    updated_at = now()
WHERE id = $1;

-- name: ListRepositoriesByChallengeID :many
SELECT * FROM challenge_repositories
WHERE challenge_id = $1 AND deleted_at IS NULL;

-- name: GetRepositoryByGitHubIDAndChallenge :one
SELECT cr.* FROM challenge_repositories cr
JOIN challenges c ON c.id = cr.challenge_id
WHERE cr.github_repo_id = $1
    AND c.status = 'active'
    AND cr.deleted_at IS NULL
    AND c.deleted_at IS NULL;
