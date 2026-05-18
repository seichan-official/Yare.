package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type AuthHandler struct {
	uc *usecase.AuthUseCase
}

func NewAuthHandler(uc *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

// POST /api/v1/auth/github/callback  — OAuthコード受け取り → トークン交換 → JWT発行
type githubCodeRequest struct {
	Code string `json:"code" validate:"required"`
}

func (h *AuthHandler) GitHubCallback(c echo.Context) error {
	var req githubCodeRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "不正なリクエストです")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.uc.GitHubCallbackWithCode(c.Request().Context(), req.Code)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, result)
}

type ageVerifyRequest struct {
	BirthYear  int `json:"birth_year"  validate:"required,min=1900,max=2100"`
	BirthMonth int `json:"birth_month" validate:"required,min=1,max=12"`
	BirthDay   int `json:"birth_day"   validate:"required,min=1,max=31"`
}

func (h *AuthHandler) AgeVerify(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}

	var req ageVerifyRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "不正なリクエストです")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := h.uc.AgeVerify(c.Request().Context(), userID, req.BirthYear, req.BirthMonth, req.BirthDay); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *AuthHandler) DeleteAccount(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	if err := h.uc.DeleteAccount(c.Request().Context(), userID); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (h *AuthHandler) RefreshToken(c echo.Context) error {
	var req refreshTokenRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "不正なリクエストです")
	}
	result, err := h.uc.RefreshToken(c.Request().Context(), req.RefreshToken)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, result)
}
