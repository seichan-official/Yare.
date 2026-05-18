package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
)

type NotificationUseCase struct {
	db db.Querier
}

func NewNotificationUseCase(q db.Querier) *NotificationUseCase {
	return &NotificationUseCase{db: q}
}

func (uc *NotificationUseCase) List(ctx context.Context, userID uuid.UUID) ([]*db.Notification, int64, error) {
	notifications, err := uc.db.ListNotificationsByUserID(ctx, userID)
	if err != nil {
		return nil, 0, domain.ErrInternalServer.WithCause(err)
	}
	unread, _ := uc.db.CountUnreadNotifications(ctx, userID)
	return notifications, unread, nil
}

func (uc *NotificationUseCase) MarkRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	return uc.db.MarkNotificationRead(ctx, db.MarkNotificationReadParams{
		ID:     notificationID,
		UserID: userID,
	})
}
