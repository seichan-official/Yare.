-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByGitHubID :one
SELECT * FROM users WHERE github_user_id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
INSERT INTO users (
    github_user_id, github_login, email, display_name,
    avatar_url, github_access_token, role, status
) VALUES (
    $1, $2, $3, $4, $5, $6, 'user', 'active'
) RETURNING *;

-- name: UpdateUser :one
UPDATE users SET
    github_login = $2,
    email = $3,
    display_name = $4,
    avatar_url = $5,
    github_access_token = $6,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: UpdateUserAgeVerified :one
UPDATE users SET
    age_verified_at = now(),
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: UpdateUserStatus :one
UPDATE users SET
    status = $2,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteUser :exec
UPDATE users SET
    deleted_at = now(),
    status = 'deleted',
    updated_at = now()
WHERE id = $1;
