package usecase

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/domain/challenge"
	"github.com/seichan-official/yare-backend/internal/infrastructure/crypto"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	"github.com/seichan-official/yare-backend/internal/infrastructure/github"
)

type ChallengeUseCase struct {
	db               db.Querier
	github           *github.Client
	encryptKey       string
	apiBaseURL       string
	skipPaymentCheck bool
}

func NewChallengeUseCase(q db.Querier, gh *github.Client, encryptKey, apiBaseURL string, skipPaymentCheck bool) *ChallengeUseCase {
	return &ChallengeUseCase{db: q, github: gh, encryptKey: encryptKey, apiBaseURL: apiBaseURL, skipPaymentCheck: skipPaymentCheck}
}

type CreateChallengeInput struct {
	UserID      uuid.UUID
	Repositories []struct {
		GitHubRepoID int64
		FullName     string
	}
	Languages      []string
	StartDate      time.Time
	EndDate        time.Time
	FrequencyType  string
	FrequencyValue *int32
	MinLinesPerDay int32
	ChallengeAmount int32
}

type ChallengeOutput struct {
	ChallengeID   string
	Status        string
	PenaltyAmount int32
}

func (uc *ChallengeUseCase) Create(ctx context.Context, input CreateChallengeInput) (*ChallengeOutput, error) {
	// カード登録確認（開発環境フラグでスキップ可能）
	if !uc.skipPaymentCheck {
		sc, _ := uc.db.GetStripeCustomerByUserID(ctx, input.UserID)
		if sc == nil || sc.DefaultPaymentMethodID == nil {
			return nil, domain.ErrPaymentMethodNotRegistered
		}
	}

	// 規約同意確認
	latest, _ := uc.db.GetLatestUserAgreement(ctx, input.UserID)
	if latest == nil {
		return nil, domain.ErrTermsNotAgreed
	}

	// アクティブチャレンジ重複チェック
	existing, _ := uc.db.GetActiveChallengeByUserID(ctx, input.UserID)
	if existing != nil {
		return nil, domain.ErrChallengeAlreadyActive
	}

	// バリデーション
	if input.ChallengeAmount < challenge.MinChallengeAmount || input.ChallengeAmount > challenge.MaxChallengeAmount {
		return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("challenge amount out of range"))
	}
	if len(input.Repositories) == 0 || len(input.Repositories) > 3 {
		return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("repositories must be 1-3"))
	}
	if len(input.Languages) == 0 {
		return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("at least one language required"))
	}

	// GitHubアクセス確認
	u, err := uc.db.GetUserByID(ctx, input.UserID)
	if err != nil || u == nil {
		return nil, domain.ErrNotFound
	}
	token, err := crypto.Decrypt(u.GithubAccessToken, uc.encryptKey)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	for _, repo := range input.Repositories {
		parts := strings.SplitN(repo.FullName, "/", 2)
		if len(parts) != 2 {
			return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("invalid repo name: %s", repo.FullName))
		}
		if err := uc.github.CheckRepoAccess(ctx, token, parts[0], parts[1]); err != nil {
			return nil, domain.ErrGitHubRepoNotAccessible.WithCause(err)
		}
	}

	penaltyAmount := int32(challenge.CalculatePenaltyAmount(int(input.ChallengeAmount)))
	langsJSON, _ := json.Marshal(input.Languages)

	// 規約バージョン取得
	tv, err := uc.db.GetCurrentTermsVersion(ctx)
	if err != nil || tv == nil {
		return nil, domain.ErrNotFound
	}

	c, err := uc.db.CreateChallenge(ctx, db.CreateChallengeParams{
		UserID:          input.UserID,
		StartDate:       input.StartDate,
		EndDate:         input.EndDate,
		FrequencyType:   input.FrequencyType,
		FrequencyValue:  input.FrequencyValue,
		MinLinesPerDay:  input.MinLinesPerDay,
		Languages:       langsJSON,
		ChallengeAmount: input.ChallengeAmount,
		PenaltyAmount:   penaltyAmount,
		TermsVersionID:  tv.ID,
		AgreementID:     latest.ID,
	})
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	// リポジトリ登録 & Webhook設定
	for _, repo := range input.Repositories {
		webhookSecret := generateWebhookSecret()
		cr, err := uc.db.CreateChallengeRepository(ctx, db.CreateChallengeRepositoryParams{
			ChallengeID:   c.ID,
			GithubRepoID:  repo.GitHubRepoID,
			FullName:      repo.FullName,
			WebhookSecret: webhookSecret,
		})
		if err != nil {
			return nil, domain.ErrInternalServer.WithCause(err)
		}

		parts := strings.SplitN(repo.FullName, "/", 2)
		callbackURL := fmt.Sprintf("%s/webhooks/github", uc.apiBaseURL)
		wh, err := uc.github.RegisterWebhook(ctx, token, parts[0], parts[1], callbackURL, webhookSecret)
		if err == nil && wh != nil {
			webhookID := wh.ID
			uc.db.UpdateChallengeRepositoryWebhook(ctx, db.UpdateChallengeRepositoryWebhookParams{
				ID:        cr.ID,
				WebhookID: &webhookID,
			})
		}
	}

	return &ChallengeOutput{
		ChallengeID:   c.ID.String(),
		Status:        c.Status,
		PenaltyAmount: penaltyAmount,
	}, nil
}

func (uc *ChallengeUseCase) Cancel(ctx context.Context, userID, challengeID uuid.UUID) error {
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return domain.ErrNotFound
	}
	if c.UserID != userID {
		return domain.ErrForbidden
	}

	dom := &challenge.Challenge{
		Status:    challenge.Status(c.Status),
		CreatedAt: c.CreatedAt,
	}
	if !dom.IsCancelable() {
		return domain.ErrChallengeCancelExpired
	}

	return uc.db.SoftDeleteChallenge(ctx, challengeID)
}

func (uc *ChallengeUseCase) GetByID(ctx context.Context, userID, challengeID uuid.UUID) (*db.Challenge, []*db.ChallengeRepository, error) {
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return nil, nil, domain.ErrNotFound
	}
	if c.UserID != userID {
		return nil, nil, domain.ErrForbidden
	}
	repos, err := uc.db.ListRepositoriesByChallengeID(ctx, challengeID)
	if err != nil {
		return nil, nil, domain.ErrInternalServer.WithCause(err)
	}
	return c, repos, nil
}

func (uc *ChallengeUseCase) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*db.Challenge, error) {
	return uc.db.ListChallengesByUserID(ctx, userID)
}

func (uc *ChallengeUseCase) ListCommits(ctx context.Context, userID, challengeID uuid.UUID) ([]*db.ListRawCommitsByChallengeIDRow, error) {
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return nil, domain.ErrNotFound
	}
	if c.UserID != userID {
		return nil, domain.ErrForbidden
	}
	return uc.db.ListRawCommitsByChallengeID(ctx, challengeID)
}

func (uc *ChallengeUseCase) GetProgress(ctx context.Context, userID, challengeID uuid.UUID) ([]*db.DailyProgress, error) {
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return nil, domain.ErrNotFound
	}
	if c.UserID != userID {
		return nil, domain.ErrForbidden
	}
	return uc.db.ListDailyProgressByChallengeID(ctx, challengeID)
}

func (uc *ChallengeUseCase) ListUserRepositories(ctx context.Context, userID uuid.UUID) ([]*github.Repository, error) {
	u, err := uc.db.GetUserByID(ctx, userID)
	if err != nil || u == nil {
		return nil, domain.ErrNotFound
	}
	token, err := crypto.Decrypt(u.GithubAccessToken, uc.encryptKey)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}
	return uc.github.ListUserRepositories(ctx, token)
}

func generateWebhookSecret() string {
	b := make([]byte, 32)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
