package payment

import (
	"time"

	"github.com/google/uuid"
)

type Type string

const (
	TypeFee     Type = "fee"
	TypePenalty Type = "penalty"
)

type Status string

const (
	StatusPending    Status = "pending"
	StatusProcessing Status = "processing"
	StatusPaid       Status = "paid"
	StatusFailed     Status = "failed"
	StatusRefunded   Status = "refunded"
	StatusDisputed   Status = "disputed"
)

type Payment struct {
	ID                       uuid.UUID
	UserID                   uuid.UUID
	ChallengeID              uuid.UUID
	PaymentType              Type
	Amount                   int
	Status                   Status
	StripePaymentIntentID    *string
	ScheduledAt              time.Time
	PreNotifiedAt            *time.Time
	PaidAt                   *time.Time
	FailureReason            *string
	ReceiptURL               *string
	CreatedAt                time.Time
	UpdatedAt                time.Time
}

func (p *Payment) IsReadyToCharge() bool {
	if p.PreNotifiedAt == nil {
		return false
	}
	return time.Since(*p.PreNotifiedAt) >= 48*time.Hour
}

func (p *Payment) NeedsPreNotification() bool {
	return p.PreNotifiedAt == nil && time.Until(p.ScheduledAt) <= 48*time.Hour
}

type RetrySchedule struct {
	AttemptNum int
	Delay      time.Duration
}

func GetRetryDelay(attemptNum int) time.Duration {
	switch attemptNum {
	case 1:
		return 3 * 24 * time.Hour
	case 2:
		return 7 * 24 * time.Hour
	case 3:
		return 14 * 24 * time.Hour
	default:
		return 0
	}
}
