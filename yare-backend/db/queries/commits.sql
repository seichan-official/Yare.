-- name: CreateRawCommit :one
INSERT INTO raw_commits (
    challenge_id, repository_id, commit_sha, author_email,
    committed_at, message, additions, deletions, files_changed,
    diff_content, raw_payload
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetRawCommitByID :one
SELECT * FROM raw_commits WHERE id = $1 AND deleted_at IS NULL;

-- name: GetRawCommitBySHA :one
SELECT * FROM raw_commits
WHERE challenge_id = $1 AND commit_sha = $2 AND deleted_at IS NULL;

-- name: ListRawCommitsByChallengeID :many
SELECT rc.*, cv.status as validation_status, cv.reason_codes
FROM raw_commits rc
LEFT JOIN commit_validations cv ON cv.raw_commit_id = rc.id
WHERE rc.challenge_id = $1 AND rc.deleted_at IS NULL
ORDER BY rc.committed_at DESC;

-- name: ListUnvalidatedCommits :many
SELECT rc.* FROM raw_commits rc
LEFT JOIN commit_validations cv ON cv.raw_commit_id = rc.id
WHERE cv.id IS NULL AND rc.deleted_at IS NULL
ORDER BY rc.committed_at ASC
LIMIT 100;

-- name: CreateCommitValidation :one
INSERT INTO commit_validations (
    raw_commit_id, status, reason_codes, details, validated_at, validator_version
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetCommitValidationByCommitID :one
SELECT * FROM commit_validations WHERE raw_commit_id = $1;

-- name: UpsertDailyProgress :one
INSERT INTO daily_progress (
    challenge_id, date, valid_commit_count, suspicious_commit_count,
    is_achieved, total_lines_added
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (challenge_id, date) DO UPDATE SET
    valid_commit_count = EXCLUDED.valid_commit_count,
    suspicious_commit_count = EXCLUDED.suspicious_commit_count,
    is_achieved = EXCLUDED.is_achieved,
    total_lines_added = EXCLUDED.total_lines_added,
    updated_at = now()
RETURNING *;

-- name: ListDailyProgressByChallengeID :many
SELECT * FROM daily_progress
WHERE challenge_id = $1 AND deleted_at IS NULL
ORDER BY date ASC;

-- name: CountAchievedDays :one
SELECT COUNT(*) FROM daily_progress
WHERE challenge_id = $1 AND is_achieved = true AND deleted_at IS NULL;

-- name: GetRecentCommittedAts :many
SELECT committed_at FROM raw_commits rc
JOIN commit_validations cv ON cv.raw_commit_id = rc.id
WHERE rc.challenge_id = $1
    AND cv.status = 'valid'
    AND rc.committed_at > $2
    AND rc.deleted_at IS NULL
ORDER BY rc.committed_at DESC;
