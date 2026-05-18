package challenge

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusActive      Status = "active"
	StatusCompleted   Status = "completed"
	StatusFailed      Status = "failed"
	StatusCancelled   Status = "cancelled"
	StatusUnderReview Status = "under_review"
)

type FrequencyType string

const (
	FrequencyDaily   FrequencyType = "daily"
	FrequencyWeeklyN FrequencyType = "weekly_n"
)

const (
	MinChallengeAmount = 500
	MaxChallengeAmount = 100_000
	MinPenaltyAmount   = 5_000
	MaxPenaltyAmount   = 30_000
	MaxChallengeDays   = 90
	CancelWindowMins   = 30
)

type Challenge struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	Status           Status
	StartDate        time.Time
	EndDate          time.Time
	FrequencyType    FrequencyType
	FrequencyValue   *int
	MinLinesPerDay   int
	Languages        []string
	ChallengeAmount  int
	PenaltyAmount    int
	TermsVersionID   uuid.UUID
	AgreementID      uuid.UUID
	Repositories     []Repository
	CompletedAt      *time.Time
	FailedAt         *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type Repository struct {
	ID            uuid.UUID
	ChallengeID   uuid.UUID
	GitHubRepoID  int64
	FullName      string
	WebhookID     *int64
	WebhookSecret string
}

func CalculatePenaltyAmount(challengeAmount int) int {
	penalty := challengeAmount * 2
	if penalty < MinPenaltyAmount {
		return MinPenaltyAmount
	}
	if penalty > MaxPenaltyAmount {
		return MaxPenaltyAmount
	}
	return penalty
}

func (c *Challenge) IsActive() bool {
	return c.Status == StatusActive
}

func (c *Challenge) IsCancelable() bool {
	return c.Status == StatusActive &&
		time.Since(c.CreatedAt) <= CancelWindowMins*time.Minute
}

func (c *Challenge) RequiredDays() int {
	total := int(c.EndDate.Sub(c.StartDate).Hours()/24) + 1
	switch c.FrequencyType {
	case FrequencyDaily:
		return total
	case FrequencyWeeklyN:
		if c.FrequencyValue == nil {
			return 0
		}
		weeks := (total + 6) / 7
		return weeks * *c.FrequencyValue
	default:
		return total
	}
}
