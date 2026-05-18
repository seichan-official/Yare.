package db

import (
	"encoding/json"
	"net"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                uuid.UUID       `json:"id"`
	GithubUserID      int64           `json:"github_user_id"`
	GithubLogin       string          `json:"github_login"`
	Email             string          `json:"email"`
	DisplayName       *string         `json:"display_name"`
	AvatarURL         *string         `json:"avatar_url"`
	GithubAccessToken string          `json:"github_access_token"`
	AgeVerifiedAt     *time.Time      `json:"age_verified_at"`
	Role              string          `json:"role"`
	Status            string          `json:"status"`
	TotpSecret        *string         `json:"totp_secret"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	DeletedAt         *time.Time      `json:"deleted_at"`
}

type TermsVersion struct {
	ID              uuid.UUID       `json:"id"`
	Version         string          `json:"version"`
	Content         string          `json:"content"`
	ContentHash     string          `json:"content_hash"`
	CheckpointItems json.RawMessage `json:"checkpoint_items"`
	PublishedAt     time.Time       `json:"published_at"`
	IsCurrent       bool            `json:"is_current"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       *time.Time      `json:"deleted_at"`
}

type UserAgreement struct {
	ID             uuid.UUID       `json:"id"`
	UserID         uuid.UUID       `json:"user_id"`
	TermsVersionID uuid.UUID       `json:"terms_version_id"`
	CheckboxStates json.RawMessage `json:"checkbox_states"`
	IPAddress      net.IP          `json:"ip_address"`
	UserAgent      string          `json:"user_agent"`
	AgreedAt       time.Time       `json:"agreed_at"`
	PreviousHash   *string         `json:"previous_hash"`
	SignatureHash  string          `json:"signature_hash"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      *time.Time      `json:"deleted_at"`
}

type StripeCustomer struct {
	ID                     uuid.UUID  `json:"id"`
	UserID                 uuid.UUID  `json:"user_id"`
	StripeCustomerID       string     `json:"stripe_customer_id"`
	DefaultPaymentMethodID *string    `json:"default_payment_method_id"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
	DeletedAt              *time.Time `json:"deleted_at"`
}

type Challenge struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	Status          string          `json:"status"`
	StartDate       time.Time       `json:"start_date"`
	EndDate         time.Time       `json:"end_date"`
	FrequencyType   string          `json:"frequency_type"`
	FrequencyValue  *int32          `json:"frequency_value"`
	MinLinesPerDay  int32           `json:"min_lines_per_day"`
	Languages       json.RawMessage `json:"languages"`
	ChallengeAmount int32           `json:"challenge_amount"`
	PenaltyAmount   int32           `json:"penalty_amount"`
	TermsVersionID  uuid.UUID       `json:"terms_version_id"`
	AgreementID     uuid.UUID       `json:"agreement_id"`
	CompletedAt     *time.Time      `json:"completed_at"`
	FailedAt        *time.Time      `json:"failed_at"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       *time.Time      `json:"deleted_at"`
}

type ChallengeRepository struct {
	ID            uuid.UUID  `json:"id"`
	ChallengeID   uuid.UUID  `json:"challenge_id"`
	GithubRepoID  int64      `json:"github_repo_id"`
	FullName      string     `json:"full_name"`
	WebhookID     *int64     `json:"webhook_id"`
	WebhookSecret string     `json:"webhook_secret"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at"`
}

type RawCommit struct {
	ID           uuid.UUID       `json:"id"`
	ChallengeID  uuid.UUID       `json:"challenge_id"`
	RepositoryID uuid.UUID       `json:"repository_id"`
	CommitSha    string          `json:"commit_sha"`
	AuthorEmail  *string         `json:"author_email"`
	CommittedAt  time.Time       `json:"committed_at"`
	Message      string          `json:"message"`
	Additions    int32           `json:"additions"`
	Deletions    int32           `json:"deletions"`
	FilesChanged json.RawMessage `json:"files_changed"`
	DiffContent  *string         `json:"diff_content"`
	RawPayload   json.RawMessage `json:"raw_payload"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	DeletedAt    *time.Time      `json:"deleted_at"`
}

type CommitValidation struct {
	ID               uuid.UUID       `json:"id"`
	RawCommitID      uuid.UUID       `json:"raw_commit_id"`
	Status           string          `json:"status"`
	ReasonCodes      json.RawMessage `json:"reason_codes"`
	Details          json.RawMessage `json:"details"`
	ValidatedAt      time.Time       `json:"validated_at"`
	ValidatorVersion string          `json:"validator_version"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        *time.Time      `json:"deleted_at"`
}

type DailyProgress struct {
	ID                    uuid.UUID  `json:"id"`
	ChallengeID           uuid.UUID  `json:"challenge_id"`
	Date                  time.Time  `json:"date"`
	ValidCommitCount      int32      `json:"valid_commit_count"`
	SuspiciousCommitCount int32      `json:"suspicious_commit_count"`
	IsAchieved            bool       `json:"is_achieved"`
	TotalLinesAdded       int32      `json:"total_lines_added"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	DeletedAt             *time.Time `json:"deleted_at"`
}

type Payment struct {
	ID                    uuid.UUID  `json:"id"`
	UserID                uuid.UUID  `json:"user_id"`
	ChallengeID           uuid.UUID  `json:"challenge_id"`
	PaymentType           string     `json:"payment_type"`
	Amount                int32      `json:"amount"`
	Status                string     `json:"status"`
	StripePaymentIntentID *string    `json:"stripe_payment_intent_id"`
	ScheduledAt           time.Time  `json:"scheduled_at"`
	PreNotifiedAt         *time.Time `json:"pre_notified_at"`
	PaidAt                *time.Time `json:"paid_at"`
	FailureReason         *string    `json:"failure_reason"`
	ReceiptURL            *string    `json:"receipt_url"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	DeletedAt             *time.Time `json:"deleted_at"`
}

type PaymentAttempt struct {
	ID            uuid.UUID       `json:"id"`
	PaymentID     uuid.UUID       `json:"payment_id"`
	AttemptNumber int32           `json:"attempt_number"`
	Status        string          `json:"status"`
	StripeResponse json.RawMessage `json:"stripe_response"`
	ErrorCode     *string         `json:"error_code"`
	NextRetryAt   *time.Time      `json:"next_retry_at"`
	AttemptedAt   time.Time       `json:"attempted_at"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	DeletedAt     *time.Time      `json:"deleted_at"`
}

type SuspiciousReview struct {
	ID               uuid.UUID       `json:"id"`
	RawCommitID      uuid.UUID       `json:"raw_commit_id"`
	Status           string          `json:"status"`
	ReviewerID       *uuid.UUID      `json:"reviewer_id"`
	SuspicionReasons json.RawMessage `json:"suspicion_reasons"`
	ContactedAt      *time.Time      `json:"contacted_at"`
	UserResponse     *string         `json:"user_response"`
	RespondedAt      *time.Time      `json:"responded_at"`
	FinalDecision    *string         `json:"final_decision"`
	DecidedAt        *time.Time      `json:"decided_at"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        *time.Time      `json:"deleted_at"`
}

type Appeal struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"user_id"`
	TargetType     string     `json:"target_type"`
	TargetID       uuid.UUID  `json:"target_id"`
	Reason         string     `json:"reason"`
	Status         string     `json:"status"`
	ReviewerID     *uuid.UUID `json:"reviewer_id"`
	DecisionReason *string    `json:"decision_reason"`
	DecidedAt      *time.Time `json:"decided_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at"`
}

type Notification struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Body        string     `json:"body"`
	ActionURL   *string    `json:"action_url"`
	ReadAt      *time.Time `json:"read_at"`
	EmailSentAt *time.Time `json:"email_sent_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at"`
}

type AuditLog struct {
	ID          uuid.UUID       `json:"id"`
	ActorID     *uuid.UUID      `json:"actor_id"`
	ActorType   string          `json:"actor_type"`
	Action      string          `json:"action"`
	TargetType  *string         `json:"target_type"`
	TargetID    *uuid.UUID      `json:"target_id"`
	Payload     json.RawMessage `json:"payload"`
	IPAddress   net.IP          `json:"ip_address"`
	UserAgent   *string         `json:"user_agent"`
	OccurredAt  time.Time       `json:"occurred_at"`
}

type ListRawCommitsByChallengeIDRow struct {
	RawCommit
	ValidationStatus *string         `json:"validation_status"`
	ReasonCodes      json.RawMessage `json:"reason_codes"`
}

type ListPendingSuspiciousReviewsRow struct {
	SuspiciousReview
	CommitSha   string    `json:"commit_sha"`
	ChallengeID uuid.UUID `json:"challenge_id"`
}
