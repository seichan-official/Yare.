package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type PaymentHandler struct {
	uc *usecase.PaymentUseCase
	db db.Querier
}

func NewPaymentHandler(uc *usecase.PaymentUseCase, q db.Querier) *PaymentHandler {
	return &PaymentHandler{uc: uc, db: q}
}

type savePaymentMethodRequest struct {
	PaymentMethodID string `json:"payment_method_id" validate:"required"`
}

func (h *PaymentHandler) SavePaymentMethod(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	var req savePaymentMethodRequest
	if err := c.Bind(&req); err != nil || req.PaymentMethodID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "payment_method_id が必要です")
	}
	if err := h.uc.SavePaymentMethod(c.Request().Context(), userID, req.PaymentMethodID); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *PaymentHandler) CreateSetupIntent(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}

	u, err := h.db.GetUserByID(c.Request().Context(), userID)
	if err != nil || u == nil {
		return echo.NewHTTPError(http.StatusNotFound, "ユーザーが見つかりません")
	}

	name := u.GithubLogin
	if u.DisplayName != nil {
		name = *u.DisplayName
	}

	result, err := h.uc.CreateSetupIntent(c.Request().Context(), userID, u.Email, name)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, result)
}
