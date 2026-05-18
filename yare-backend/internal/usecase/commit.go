package usecase

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	"github.com/seichan-official/yare-backend/internal/infrastructure/github"
	"github.com/seichan-official/yare-backend/internal/infrastructure/validator"
)

type CommitUseCase struct {
	db     db.Querier
	github *github.Client
}

func NewCommitUseCase(q db.Querier, gh *github.Client) *CommitUseCase {
	return &CommitUseCase{db: q, github: gh}
}

type GitHubPushPayload struct {
	Repository struct {
		ID       int64  `json:"id"`
		FullName string `json:"full_name"`
	} `json:"repository"`
	Commits []struct {
		ID        string `json:"id"`
		Message   string `json:"message"`
		Timestamp string `json:"timestamp"`
		Author    struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		} `json:"author"`
	} `json:"commits"`
	HeadCommit *struct {
		ID string `json:"id"`
	} `json:"head_commit"`
}

func VerifyGitHubSignature(payload []byte, signature, secret string) bool {
	sig := strings.TrimPrefix(signature, "sha256=")
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(sig), []byte(expected))
}

func (uc *CommitUseCase) HandleWebhook(ctx context.Context, payload []byte, signature string) error {
	var push GitHubPushPayload
	if err := json.Unmarshal(payload, &push); err != nil {
		return domain.ErrInvalidRequest.WithCause(err)
	}

	repo, err := uc.db.GetRepositoryByGitHubIDAndChallenge(ctx, push.Repository.ID)
	if err != nil || repo == nil {
		return nil
	}

	encSecret := repo.WebhookSecret
	if !VerifyGitHubSignature(payload, signature, encSecret) {
		return domain.ErrForbidden
	}

	challenge, err := uc.db.GetChallengeByID(ctx, repo.ChallengeID)
	if err != nil || challenge == nil {
		return nil
	}

	u, err := uc.db.GetUserByID(ctx, challenge.UserID)
	if err != nil || u == nil {
		return nil
	}

	for _, c := range push.Commits {
		existing, _ := uc.db.GetRawCommitBySHA(ctx, db.GetRawCommitBySHAParams{
			ChallengeID: repo.ChallengeID,
			CommitSha:   c.ID,
		})
		if existing != nil {
			continue
		}

		ts, _ := time.Parse(time.RFC3339, c.Timestamp)
		email := c.Author.Email
		rawPayload, _ := json.Marshal(c)

		_, err := uc.db.CreateRawCommit(ctx, db.CreateRawCommitParams{
			ChallengeID:  repo.ChallengeID,
			RepositoryID: repo.ID,
			CommitSha:    c.ID,
			AuthorEmail:  &email,
			CommittedAt:  ts,
			Message:      c.Message,
			FilesChanged: json.RawMessage(`[]`),
			RawPayload:   rawPayload,
		})
		if err != nil {
			return domain.ErrInternalServer.WithCause(err)
		}
	}
	return nil
}

func (uc *CommitUseCase) ValidateUnprocessed(ctx context.Context) error {
	commits, err := uc.db.ListUnvalidatedCommits(ctx)
	if err != nil {
		return err
	}

	for _, rc := range commits {
		challenge, err := uc.db.GetChallengeByID(ctx, rc.ChallengeID)
		if err != nil || challenge == nil {
			continue
		}

		var languages []string
		json.Unmarshal(challenge.Languages, &languages)

		recentTimes, _ := uc.db.GetRecentCommittedAts(ctx, db.GetRecentCommittedAtsParams{
			ChallengeID: rc.ChallengeID,
			Since:       time.Now().Add(-3 * 24 * time.Hour),
		})

		var files []validator.FileInput
		json.Unmarshal(rc.FilesChanged, &files)

		diffContent := ""
		if rc.DiffContent != nil {
			diffContent = *rc.DiffContent
		}

		input := &validator.CommitInput{
			SHA:         rc.CommitSha,
			Additions:   int(rc.Additions),
			Deletions:   int(rc.Deletions),
			Files:       files,
			DiffContent: diffContent,
			CommittedAt: rc.CommittedAt,
			RecentTimes: recentTimes,
		}

		cfg := &validator.ChallengeConfig{
			Languages:      languages,
			MinLinesPerDay: int(challenge.MinLinesPerDay),
		}

		result := validator.Validate(input, cfg)
		reasonJSON := validator.ReasonCodesToJSON(result.ReasonCodes)
		detailsJSON, _ := json.Marshal(result.Details)

		uc.db.CreateCommitValidation(ctx, db.CreateCommitValidationParams{
			RawCommitID:      rc.ID,
			Status:           string(result.Status),
			ReasonCodes:      reasonJSON,
			Details:          detailsJSON,
			ValidatedAt:      time.Now(),
			ValidatorVersion: "1.0.0",
		})

		uc.updateDailyProgress(ctx, rc.ChallengeID, rc.CommittedAt, string(result.Status))
	}
	return nil
}

func (uc *CommitUseCase) updateDailyProgress(ctx context.Context, challengeID uuid.UUID, committedAt time.Time, status string) {
	jst := time.FixedZone("JST", 9*60*60)
	date := committedAt.In(jst).Truncate(24 * time.Hour)

	progress, _ := uc.db.ListDailyProgressByChallengeID(ctx, challengeID)

	var existing *db.DailyProgress
	for _, p := range progress {
		if p.Date.Truncate(24 * time.Hour).Equal(date) {
			existing = p
			break
		}
	}

	validCount := int32(0)
	suspiciousCount := int32(0)
	totalLines := int32(0)

	if existing != nil {
		validCount = existing.ValidCommitCount
		suspiciousCount = existing.SuspiciousCommitCount
		totalLines = existing.TotalLinesAdded
	}

	switch status {
	case "valid":
		validCount++
	case "suspicious":
		suspiciousCount++
	}

	uc.db.UpsertDailyProgress(ctx, db.UpsertDailyProgressParams{
		ChallengeID:           challengeID,
		Date:                  date,
		ValidCommitCount:      validCount,
		SuspiciousCommitCount: suspiciousCount,
		IsAchieved:            validCount > 0,
		TotalLinesAdded:       totalLines,
	})
}

func (uc *CommitUseCase) FetchAndStoreCommits(ctx context.Context, challengeID uuid.UUID, token string) error {
	_, err := uc.db.ListRepositoriesByChallengeID(ctx, challengeID)
	if err != nil {
		return err
	}
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return domain.ErrNotFound
	}
	return nil
}
