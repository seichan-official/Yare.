package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type NotificationHandler struct {
	uc *usecase.NotificationUseCase
}

func NewNotificationHandler(uc *usecase.NotificationUseCase) *NotificationHandler {
	return &NotificationHandler{uc: uc}
}

func (h *NotificationHandler) List(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	notifications, unread, err := h.uc.List(c.Request().Context(), userID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, map[string]any{
		"notifications": notifications,
		"unread_count":  unread,
	})
}

func (h *NotificationHandler) MarkRead(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	notifID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効な通知IDです")
	}
	if err := h.uc.MarkRead(c.Request().Context(), userID, notifID); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}
