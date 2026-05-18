package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
	"github.com/google/uuid"
)

type AgreementHandler struct {
	uc *usecase.AgreementUseCase
}

func NewAgreementHandler(uc *usecase.AgreementUseCase) *AgreementHandler {
	return &AgreementHandler{uc: uc}
}

func (h *AgreementHandler) GetCurrentTerms(c echo.Context) error {
	tv, err := h.uc.GetCurrentTerms(c.Request().Context())
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, tv)
}

type createAgreementRequest struct {
	TermsVersionID string          `json:"terms_version_id" validate:"required,uuid"`
	CheckboxStates map[string]bool `json:"checkbox_states" validate:"required"`
}

func (h *AgreementHandler) CreateAgreement(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}

	var req createAgreementRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "不正なリクエストです")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	tvID, err := uuid.Parse(req.TermsVersionID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効な規約バージョンIDです")
	}

	ip := parseIP(c.RealIP())
	result, err := h.uc.CreateAgreement(c.Request().Context(), usecase.CreateAgreementInput{
		UserID:         userID,
		TermsVersionID: tvID,
		CheckboxStates: req.CheckboxStates,
		IPAddress:      ip,
		UserAgent:      c.Request().UserAgent(),
	})
	if err != nil {
		return handleError(c, err)
	}
	return created(c, result)
}
