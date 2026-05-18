-- name: CreateNotification :one
INSERT INTO notifications (user_id, type, title, body, action_url)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListNotificationsByUserID :many
SELECT * FROM notifications
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- name: MarkNotificationRead :exec
UPDATE notifications SET
    read_at = now(),
    updated_at = now()
WHERE id = $1 AND user_id = $2;

-- name: MarkNotificationEmailSent :exec
UPDATE notifications SET
    email_sent_at = now(),
    updated_at = now()
WHERE id = $1;

-- name: CountUnreadNotifications :one
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND read_at IS NULL AND deleted_at IS NULL;
