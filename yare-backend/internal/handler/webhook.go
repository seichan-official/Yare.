package handler

import (
	"io"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type WebhookHandler struct {
	commitUC  *usecase.CommitUseCase
	paymentUC *usecase.PaymentUseCase
}

func NewWebhookHandler(commitUC *usecase.CommitUseCase, paymentUC *usecase.PaymentUseCase) *WebhookHandler {
	return &WebhookHandler{commitUC: commitUC, paymentUC: paymentUC}
}

func (h *WebhookHandler) GitHubWebhook(c echo.Context) error {
	event := c.Request().Header.Get("X-GitHub-Event")
	if event != "push" {
		return c.NoContent(http.StatusOK)
	}

	payload, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "ペイロード読み取りエラー")
	}

	signature := c.Request().Header.Get("X-Hub-Signature-256")
	if err := h.commitUC.HandleWebhook(c.Request().Context(), payload, signature); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusOK)
}

func (h *WebhookHandler) StripeWebhook(c echo.Context) error {
	payload, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "ペイロード読み取りエラー")
	}

	sigHeader := c.Request().Header.Get("Stripe-Signature")
	if err := h.paymentUC.HandleStripeWebhook(c.Request().Context(), payload, sigHeader); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusOK)
}
