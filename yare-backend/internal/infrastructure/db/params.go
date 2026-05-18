package db

import (
	"encoding/json"
	"net"
	"time"

	"github.com/google/uuid"
)

type CreateUserParams struct {
	GithubUserID      int64
	GithubLogin       string
	Email             string
	DisplayName       *string
	AvatarURL         *string
	GithubAccessToken string
}

type UpdateUserParams struct {
	ID                uuid.UUID
	GithubLogin       string
	Email             string
	DisplayName       *string
	AvatarURL         *string
	GithubAccessToken string
}

type UpdateUserStatusParams struct {
	ID     uuid.UUID
	Status string
}

type GetUserAgreementParams struct {
	UserID         uuid.UUID
	TermsVersionID uuid.UUID
}

type CreateUserAgreementParams struct {
	UserID         uuid.UUID
	TermsVersionID uuid.UUID
	CheckboxStates json.RawMessage
	IPAddress      net.IP
	UserAgent      string
	AgreedAt       time.Time
	PreviousHash   *string
	SignatureHash  string
}

type CreateStripeCustomerParams struct {
	UserID                 uuid.UUID
	StripeCustomerID       string
	DefaultPaymentMethodID *string
}

type UpdateStripeCustomerPaymentMethodParams struct {
	UserID                 uuid.UUID
	DefaultPaymentMethodID *string
}

type CreateChallengeParams struct {
	UserID          uuid.UUID
	StartDate       time.Time
	EndDate         time.Time
	FrequencyType   string
	FrequencyValue  *int32
	MinLinesPerDay  int32
	Languages       json.RawMessage
	ChallengeAmount int32
	PenaltyAmount   int32
	TermsVersionID  uuid.UUID
	AgreementID     uuid.UUID
}

type UpdateChallengeStatusParams struct {
	ID          uuid.UUID
	Status      string
	CompletedAt *time.Time
	FailedAt    *time.Time
}

type CreateChallengeRepositoryParams struct {
	ChallengeID   uuid.UUID
	GithubRepoID  int64
	FullName      string
	WebhookSecret string
}

type UpdateChallengeRepositoryWebhookParams struct {
	ID        uuid.UUID
	WebhookID *int64
}

type CreateRawCommitParams struct {
	ChallengeID  uuid.UUID
	RepositoryID uuid.UUID
	CommitSha    string
	AuthorEmail  *string
	CommittedAt  time.Time
	Message      string
	Additions    int32
	Deletions    int32
	FilesChanged json.RawMessage
	DiffContent  *string
	RawPayload   json.RawMessage
}

type GetRawCommitBySHAParams struct {
	ChallengeID uuid.UUID
	CommitSha   string
}

type CreateCommitValidationParams struct {
	RawCommitID      uuid.UUID
	Status           string
	ReasonCodes      json.RawMessage
	Details          json.RawMessage
	ValidatedAt      time.Time
	ValidatorVersion string
}

type UpsertDailyProgressParams struct {
	ChallengeID           uuid.UUID
	Date                  time.Time
	ValidCommitCount      int32
	SuspiciousCommitCount int32
	IsAchieved            bool
	TotalLinesAdded       int32
}

type GetRecentCommittedAtsParams struct {
	ChallengeID uuid.UUID
	Since       time.Time
}

type CreatePaymentParams struct {
	UserID      uuid.UUID
	ChallengeID uuid.UUID
	PaymentType string
	Amount      int32
	ScheduledAt time.Time
}

type UpdatePaymentStatusParams struct {
	ID                    uuid.UUID
	Status                string
	StripePaymentIntentID *string
	PaidAt                *time.Time
	FailureReason         *string
	ReceiptURL            *string
}

type CreatePaymentAttemptParams struct {
	PaymentID      uuid.UUID
	AttemptNumber  int32
	Status         string
	StripeResponse json.RawMessage
	ErrorCode      *string
	NextRetryAt    *time.Time
	AttemptedAt    time.Time
}

type CreateNotificationParams struct {
	UserID    uuid.UUID
	Type      string
	Title     string
	Body      string
	ActionURL *string
}

type MarkNotificationReadParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type CreateSuspiciousReviewParams struct {
	RawCommitID      uuid.UUID
	SuspicionReasons json.RawMessage
}

type UpdateSuspiciousReviewResponseParams struct {
	ID           uuid.UUID
	UserResponse string
}

type UpdateSuspiciousReviewDecisionParams struct {
	ID            uuid.UUID
	Status        string
	FinalDecision *string
	ReviewerID    *uuid.UUID
}

type CreateAppealParams struct {
	UserID     uuid.UUID
	TargetType string
	TargetID   uuid.UUID
	Reason     string
}

type UpdateAppealStatusParams struct {
	ID             uuid.UUID
	Status         string
	ReviewerID     *uuid.UUID
	DecisionReason *string
	DecidedAt      *time.Time
}

type CreateAuditLogParams struct {
	ActorID    *uuid.UUID
	ActorType  string
	Action     string
	TargetType *string
	TargetID   *uuid.UUID
	Payload    json.RawMessage
	IPAddress  net.IP
	UserAgent  *string
}

type ListAuditLogsByTargetParams struct {
	TargetType string
	TargetID   uuid.UUID
}
