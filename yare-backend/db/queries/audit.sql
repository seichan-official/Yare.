-- name: CreateAuditLog :one
INSERT INTO audit_logs (
    actor_id, actor_type, action, target_type, target_id, payload, ip_address, user_agent
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListAuditLogsByActorID :many
SELECT * FROM audit_logs
WHERE actor_id = $1
ORDER BY occurred_at DESC
LIMIT 100;

-- name: ListAuditLogsByTarget :many
SELECT * FROM audit_logs
WHERE target_type = $1 AND target_id = $2
ORDER BY occurred_at DESC;
