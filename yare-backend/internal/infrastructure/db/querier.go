package db

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Querier interface {
	// Users
	GetUserByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetUserByGitHubID(ctx context.Context, githubUserID int64) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	CreateUser(ctx context.Context, arg CreateUserParams) (*User, error)
	UpdateUser(ctx context.Context, arg UpdateUserParams) (*User, error)
	UpdateUserAgeVerified(ctx context.Context, id uuid.UUID) (*User, error)
	UpdateUserStatus(ctx context.Context, arg UpdateUserStatusParams) (*User, error)
	SoftDeleteUser(ctx context.Context, id uuid.UUID) error

	// Terms
	GetCurrentTermsVersion(ctx context.Context) (*TermsVersion, error)
	GetTermsVersionByID(ctx context.Context, id uuid.UUID) (*TermsVersion, error)
	GetUserAgreement(ctx context.Context, arg GetUserAgreementParams) (*UserAgreement, error)
	GetLatestUserAgreement(ctx context.Context, userID uuid.UUID) (*UserAgreement, error)
	CreateUserAgreement(ctx context.Context, arg CreateUserAgreementParams) (*UserAgreement, error)
	ListUserAgreementsByUserID(ctx context.Context, userID uuid.UUID) ([]*UserAgreement, error)
	ListAllAgreementsForIntegrityCheck(ctx context.Context) ([]*UserAgreement, error)

	// Stripe
	GetStripeCustomerByUserID(ctx context.Context, userID uuid.UUID) (*StripeCustomer, error)
	CreateStripeCustomer(ctx context.Context, arg CreateStripeCustomerParams) (*StripeCustomer, error)
	UpdateStripeCustomerPaymentMethod(ctx context.Context, arg UpdateStripeCustomerPaymentMethodParams) error

	// Challenges
	CreateChallenge(ctx context.Context, arg CreateChallengeParams) (*Challenge, error)
	GetChallengeByID(ctx context.Context, id uuid.UUID) (*Challenge, error)
	GetActiveChallengeByUserID(ctx context.Context, userID uuid.UUID) (*Challenge, error)
	ListChallengesByUserID(ctx context.Context, userID uuid.UUID) ([]*Challenge, error)
	UpdateChallengeStatus(ctx context.Context, arg UpdateChallengeStatusParams) (*Challenge, error)
	ListActiveChallengesToJudge(ctx context.Context) ([]*Challenge, error)
	SoftDeleteChallenge(ctx context.Context, id uuid.UUID) error
	CreateChallengeRepository(ctx context.Context, arg CreateChallengeRepositoryParams) (*ChallengeRepository, error)
	UpdateChallengeRepositoryWebhook(ctx context.Context, arg UpdateChallengeRepositoryWebhookParams) error
	ListRepositoriesByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*ChallengeRepository, error)
	GetRepositoryByGitHubIDAndChallenge(ctx context.Context, githubRepoID int64) (*ChallengeRepository, error)

	// Commits
	CreateRawCommit(ctx context.Context, arg CreateRawCommitParams) (*RawCommit, error)
	GetRawCommitByID(ctx context.Context, id uuid.UUID) (*RawCommit, error)
	GetRawCommitBySHA(ctx context.Context, arg GetRawCommitBySHAParams) (*RawCommit, error)
	ListRawCommitsByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*ListRawCommitsByChallengeIDRow, error)
	ListUnvalidatedCommits(ctx context.Context) ([]*RawCommit, error)
	CreateCommitValidation(ctx context.Context, arg CreateCommitValidationParams) (*CommitValidation, error)
	GetCommitValidationByCommitID(ctx context.Context, rawCommitID uuid.UUID) (*CommitValidation, error)
	UpsertDailyProgress(ctx context.Context, arg UpsertDailyProgressParams) (*DailyProgress, error)
	ListDailyProgressByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*DailyProgress, error)
	CountAchievedDays(ctx context.Context, challengeID uuid.UUID) (int64, error)
	GetRecentCommittedAts(ctx context.Context, arg GetRecentCommittedAtsParams) ([]time.Time, error)

	// Payments
	CreatePayment(ctx context.Context, arg CreatePaymentParams) (*Payment, error)
	GetPaymentByID(ctx context.Context, id uuid.UUID) (*Payment, error)
	UpdatePaymentStatus(ctx context.Context, arg UpdatePaymentStatusParams) (*Payment, error)
	UpdatePaymentPreNotified(ctx context.Context, id uuid.UUID) error
	ListPendingPaymentsToProcess(ctx context.Context) ([]*Payment, error)
	ListPaymentsByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*Payment, error)
	CreatePaymentAttempt(ctx context.Context, arg CreatePaymentAttemptParams) (*PaymentAttempt, error)
	GetLastPaymentAttempt(ctx context.Context, paymentID uuid.UUID) (*PaymentAttempt, error)
	CountPaymentAttempts(ctx context.Context, paymentID uuid.UUID) (int64, error)

	// Notifications
	CreateNotification(ctx context.Context, arg CreateNotificationParams) (*Notification, error)
	ListNotificationsByUserID(ctx context.Context, userID uuid.UUID) ([]*Notification, error)
	MarkNotificationRead(ctx context.Context, arg MarkNotificationReadParams) error
	MarkNotificationEmailSent(ctx context.Context, id uuid.UUID) error
	CountUnreadNotifications(ctx context.Context, userID uuid.UUID) (int64, error)

	// Reviews
	CreateSuspiciousReview(ctx context.Context, arg CreateSuspiciousReviewParams) (*SuspiciousReview, error)
	GetSuspiciousReviewByID(ctx context.Context, id uuid.UUID) (*SuspiciousReview, error)
	UpdateSuspiciousReviewContacted(ctx context.Context, id uuid.UUID) error
	UpdateSuspiciousReviewResponse(ctx context.Context, arg UpdateSuspiciousReviewResponseParams) error
	UpdateSuspiciousReviewDecision(ctx context.Context, arg UpdateSuspiciousReviewDecisionParams) error
	ListPendingSuspiciousReviews(ctx context.Context) ([]*ListPendingSuspiciousReviewsRow, error)
	ListExpiredSuspiciousReviews(ctx context.Context) ([]*SuspiciousReview, error)
	CreateAppeal(ctx context.Context, arg CreateAppealParams) (*Appeal, error)
	GetAppealByID(ctx context.Context, id uuid.UUID) (*Appeal, error)
	UpdateAppealStatus(ctx context.Context, arg UpdateAppealStatusParams) error
	ListAppealsByUserID(ctx context.Context, userID uuid.UUID) ([]*Appeal, error)

	// Audit
	CreateAuditLog(ctx context.Context, arg CreateAuditLogParams) (*AuditLog, error)
	ListAuditLogsByActorID(ctx context.Context, actorID uuid.UUID) ([]*AuditLog, error)
	ListAuditLogsByTarget(ctx context.Context, arg ListAuditLogsByTargetParams) ([]*AuditLog, error)
}
