package usecase

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/domain/user"
	"github.com/seichan-official/yare-backend/internal/infrastructure/crypto"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	"github.com/seichan-official/yare-backend/internal/infrastructure/github"
	"github.com/seichan-official/yare-backend/internal/middleware"
)

type AuthUseCase struct {
	db         db.Querier
	github     *github.Client
	jwt        *middleware.JWTManager
	encryptKey string
}

func NewAuthUseCase(q db.Querier, gh *github.Client, jwt *middleware.JWTManager, encryptKey string) *AuthUseCase {
	return &AuthUseCase{db: q, github: gh, jwt: jwt, encryptKey: encryptKey}
}

type AuthResult struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
	User         *AuthUserInfo `json:"user"`
}

type AuthUserInfo struct {
	ID                  string `json:"id"`
	GitHubLogin         string `json:"github_login"`
	Email               string `json:"email"`
	IsFirstLogin        bool   `json:"is_first_login"`
	AgeVerified         bool   `json:"age_verified"`
	AgreementStatus     string `json:"agreement_status"`
	PaymentMethodStatus string `json:"payment_method_status"`
}

func (uc *AuthUseCase) DeleteAccount(ctx context.Context, userID uuid.UUID) error {
	active, _ := uc.db.GetActiveChallengeByUserID(ctx, userID)
	if active != nil {
		return domain.ErrConflict.WithCause(fmt.Errorf("active challenge exists"))
	}
	return uc.db.SoftDeleteUser(ctx, userID)
}

func (uc *AuthUseCase) AgeVerify(ctx context.Context, userID uuid.UUID, birthYear, birthMonth, birthDay int) error {
	birth := time.Date(birthYear, time.Month(birthMonth), birthDay, 0, 0, 0, 0, time.UTC)
	// 存在しない日付チェック（例: 2月31日）
	if birth.Day() != birthDay || birth.Month() != time.Month(birthMonth) {
		return domain.ErrInvalidRequest.WithCause(fmt.Errorf("invalid birth date"))
	}
	age := time.Since(birth).Hours() / 24 / 365.25
	if age < 18 {
		return domain.ErrInvalidRequest.WithCause(fmt.Errorf("age requirement not met"))
	}
	_, err := uc.db.UpdateUserAgeVerified(ctx, userID)
	if err != nil {
		return domain.ErrInternalServer.WithCause(err)
	}
	return nil
}

func (uc *AuthUseCase) GitHubCallbackWithCode(ctx context.Context, code string) (*AuthResult, error) {
	accessToken, err := uc.github.ExchangeCode(ctx, code)
	if err != nil {
		return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("github code exchange: %w", err))
	}
	return uc.GitHubCallback(ctx, accessToken)
}

func (uc *AuthUseCase) GitHubCallback(ctx context.Context, githubAccessToken string) (*AuthResult, error) {
	userInfo, err := uc.github.GetUserInfo(ctx, githubAccessToken)
	if err != nil {
		return nil, domain.ErrInvalidRequest.WithCause(fmt.Errorf("github user info: %w", err))
	}

	encToken, err := crypto.Encrypt(githubAccessToken, uc.encryptKey)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	existingUser, err := uc.db.GetUserByGitHubID(ctx, userInfo.ID)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	isFirstLogin := false
	var u *db.User

	if existingUser == nil {
		isFirstLogin = true
		params := db.CreateUserParams{
			GithubUserID:      userInfo.ID,
			GithubLogin:       userInfo.Login,
			Email:             userInfo.Email,
			DisplayName:       userInfo.Name,
			AvatarURL:         userInfo.AvatarURL,
			GithubAccessToken: encToken,
		}
		u, err = uc.db.CreateUser(ctx, params)
		if err != nil {
			return nil, domain.ErrInternalServer.WithCause(err)
		}
		slog.Info("new user created", "user_id", u.ID, "github_login", u.GithubLogin)
	} else {
		u, err = uc.db.UpdateUser(ctx, db.UpdateUserParams{
			ID:                existingUser.ID,
			GithubLogin:       userInfo.Login,
			Email:             userInfo.Email,
			DisplayName:       userInfo.Name,
			AvatarURL:         userInfo.AvatarURL,
			GithubAccessToken: encToken,
		})
		if err != nil {
			return nil, domain.ErrInternalServer.WithCause(err)
		}
		if u.Status == string(user.StatusSuspended) {
			return nil, domain.ErrAccountSuspended
		}
	}

	accessToken, err := uc.jwt.GenerateAccessToken(u.ID, u.Role)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}
	refreshToken, err := uc.jwt.GenerateRefreshToken(u.ID)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	agreementStatus := "not_agreed"
	agreement, _ := uc.db.GetLatestUserAgreement(ctx, u.ID)
	if agreement != nil {
		agreementStatus = "agreed"
	}

	paymentStatus := "not_registered"
	sc, _ := uc.db.GetStripeCustomerByUserID(ctx, u.ID)
	if sc != nil && sc.DefaultPaymentMethodID != nil {
		paymentStatus = "registered"
	}

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900,
		User: &AuthUserInfo{
			ID:                  u.ID.String(),
			GitHubLogin:         u.GithubLogin,
			Email:               u.Email,
			IsFirstLogin:        isFirstLogin,
			AgeVerified:         u.AgeVerifiedAt != nil,
			AgreementStatus:     agreementStatus,
			PaymentMethodStatus: paymentStatus,
		},
	}, nil
}

func (uc *AuthUseCase) RefreshToken(ctx context.Context, refreshToken string) (*AuthResult, error) {
	claims, err := uc.jwt.ParseToken(refreshToken)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	u, err := uc.db.GetUserByID(ctx, userID)
	if err != nil || u == nil {
		return nil, domain.ErrUnauthorized
	}

	accessToken, err := uc.jwt.GenerateAccessToken(u.ID, u.Role)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}
	newRefresh, err := uc.jwt.GenerateRefreshToken(u.ID)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: newRefresh,
		ExpiresIn:    900,
	}, nil
}
