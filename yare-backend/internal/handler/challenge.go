package handler

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type ChallengeHandler struct {
	uc *usecase.ChallengeUseCase
}

func NewChallengeHandler(uc *usecase.ChallengeUseCase) *ChallengeHandler {
	return &ChallengeHandler{uc: uc}
}

type createChallengeRequest struct {
	Repositories []struct {
		GitHubRepoID int64  `json:"github_repo_id" validate:"required"`
		FullName     string `json:"full_name" validate:"required"`
	} `json:"repositories" validate:"required,min=1,max=3"`
	Languages       []string `json:"languages" validate:"required,min=1"`
	StartDate       string   `json:"start_date" validate:"required"`
	EndDate         string   `json:"end_date" validate:"required"`
	FrequencyType   string   `json:"frequency_type" validate:"required,oneof=daily weekly_n"`
	FrequencyValue  *int32   `json:"frequency_value"`
	MinLinesPerDay  int32    `json:"min_lines_per_day" validate:"min=10,max=200"`
	ChallengeAmount int32    `json:"challenge_amount" validate:"required,min=500,max=100000"`
}

func (h *ChallengeHandler) Create(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}

	var req createChallengeRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "不正なリクエストです")
	}
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "開始日の形式が不正です")
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "終了日の形式が不正です")
	}

	minLines := req.MinLinesPerDay
	if minLines == 0 {
		minLines = 30
	}

	input := usecase.CreateChallengeInput{
		UserID:          userID,
		Languages:       req.Languages,
		StartDate:       startDate,
		EndDate:         endDate,
		FrequencyType:   req.FrequencyType,
		FrequencyValue:  req.FrequencyValue,
		MinLinesPerDay:  minLines,
		ChallengeAmount: req.ChallengeAmount,
	}
	for _, r := range req.Repositories {
		input.Repositories = append(input.Repositories, struct {
			GitHubRepoID int64
			FullName     string
		}{GitHubRepoID: r.GitHubRepoID, FullName: r.FullName})
	}

	result, err := h.uc.Create(c.Request().Context(), input)
	if err != nil {
		return handleError(c, err)
	}
	return created(c, result)
}

func (h *ChallengeHandler) Cancel(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効なチャレンジIDです")
	}
	if err := h.uc.Cancel(c.Request().Context(), userID, challengeID); err != nil {
		return handleError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *ChallengeHandler) GetByID(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効なチャレンジIDです")
	}
	ch, repos, err := h.uc.GetByID(c.Request().Context(), userID, challengeID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, map[string]any{"challenge": ch, "repositories": repos})
}

func (h *ChallengeHandler) List(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	challenges, err := h.uc.ListByUserID(c.Request().Context(), userID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, challenges)
}

func (h *ChallengeHandler) ListCommits(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効なチャレンジIDです")
	}
	commits, err := h.uc.ListCommits(c.Request().Context(), userID, challengeID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, commits)
}

func (h *ChallengeHandler) GetProgress(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	challengeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "無効なチャレンジIDです")
	}
	progress, err := h.uc.GetProgress(c.Request().Context(), userID, challengeID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, progress)
}

func (h *ChallengeHandler) ListRepositories(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
	}
	repos, err := h.uc.ListUserRepositories(c.Request().Context(), userID)
	if err != nil {
		return handleError(c, err)
	}
	return ok(c, repos)
}
