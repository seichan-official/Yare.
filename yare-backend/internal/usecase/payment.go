package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/domain/payment"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	stripeinfra "github.com/seichan-official/yare-backend/internal/infrastructure/stripe"
)

type PaymentUseCase struct {
	db     db.Querier
	stripe *stripeinfra.Client
}

func NewPaymentUseCase(q db.Querier, stripe *stripeinfra.Client) *PaymentUseCase {
	return &PaymentUseCase{db: q, stripe: stripe}
}

type SetupIntentResult struct {
	ClientSecret string `json:"client_secret"`
}

func (uc *PaymentUseCase) CreateSetupIntent(ctx context.Context, userID uuid.UUID, email, name string) (*SetupIntentResult, error) {
	sc, _ := uc.db.GetStripeCustomerByUserID(ctx, userID)

	var customerID string
	if sc == nil {
		cid, err := uc.stripe.CreateCustomer(email, name)
		if err != nil {
			return nil, domain.ErrInternalServer.WithCause(err)
		}
		customerID = cid
		uc.db.CreateStripeCustomer(ctx, db.CreateStripeCustomerParams{
			UserID:           userID,
			StripeCustomerID: cid,
		})
	} else {
		customerID = sc.StripeCustomerID
	}

	result, err := uc.stripe.CreateSetupIntent(customerID)
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}
	return &SetupIntentResult{ClientSecret: result.ClientSecret}, nil
}

func (uc *PaymentUseCase) SavePaymentMethod(ctx context.Context, userID uuid.UUID, paymentMethodID string) error {
	if err := uc.db.UpdateStripeCustomerPaymentMethod(ctx, db.UpdateStripeCustomerPaymentMethodParams{
		UserID:                 userID,
		DefaultPaymentMethodID: &paymentMethodID,
	}); err != nil {
		return domain.ErrInternalServer.WithCause(err)
	}
	return nil
}

func (uc *PaymentUseCase) HandleStripeWebhook(ctx context.Context, payload []byte, sigHeader string) error {
	event, err := uc.stripe.ConstructWebhookEvent(payload, sigHeader)
	if err != nil {
		return domain.ErrForbidden.WithCause(err)
	}

	switch event.Type {
	case "setup_intent.succeeded":
		var si struct {
			Customer      string `json:"customer"`
			PaymentMethod string `json:"payment_method"`
		}
		if err := json.Unmarshal(event.Data.Raw, &si); err != nil {
			return nil
		}
		uc.db.UpdateStripeCustomerPaymentMethod(ctx, db.UpdateStripeCustomerPaymentMethodParams{
			DefaultPaymentMethodID: &si.PaymentMethod,
		})

	case "payment_intent.succeeded":
		var pi struct {
			ID         string `json:"id"`
			ReceiptURL string `json:"receipt_url"`
		}
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return nil
		}
		uc.markPaymentPaid(ctx, pi.ID, pi.ReceiptURL)

	case "payment_intent.payment_failed":
		var pi struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			return nil
		}
		uc.markPaymentFailed(ctx, pi.ID, "stripe_webhook_failed")
	}
	return nil
}

func (uc *PaymentUseCase) ProcessPendingPayments(ctx context.Context) error {
	payments, err := uc.db.ListPendingPaymentsToProcess(ctx)
	if err != nil {
		return err
	}

	for _, p := range payments {
		domPayment := &payment.Payment{
			PreNotifiedAt: p.PreNotifiedAt,
			ScheduledAt:   p.ScheduledAt,
		}

		if domPayment.NeedsPreNotification() {
			uc.db.UpdatePaymentPreNotified(ctx, p.ID)
			continue
		}

		if !domPayment.IsReadyToCharge() {
			continue
		}

		sc, err := uc.db.GetStripeCustomerByUserID(ctx, p.UserID)
		if err != nil || sc == nil || sc.DefaultPaymentMethodID == nil {
			continue
		}

		attempts, _ := uc.db.CountPaymentAttempts(ctx, p.ID)
		if attempts >= 3 {
			continue
		}

		idempotencyKey := fmt.Sprintf("payment-%s-attempt-%d", p.ID.String(), attempts+1)
		result, err := uc.stripe.ChargeCustomer(
			sc.StripeCustomerID,
			*sc.DefaultPaymentMethodID,
			int64(p.Amount),
			idempotencyKey,
		)

		now := time.Now()
		attemptStatus := "succeeded"
		if err != nil {
			attemptStatus = "failed"
		}

		respJSON, _ := json.Marshal(result)
		uc.db.CreatePaymentAttempt(ctx, db.CreatePaymentAttemptParams{
			PaymentID:      p.ID,
			AttemptNumber:  int32(attempts + 1),
			Status:         attemptStatus,
			StripeResponse: respJSON,
			AttemptedAt:    now,
		})

		if err != nil {
			delay := payment.GetRetryDelay(int(attempts) + 1)
			if delay > 0 {
				nextRetry := now.Add(delay)
				uc.db.UpdatePaymentStatus(ctx, db.UpdatePaymentStatusParams{
					ID:     p.ID,
					Status: string(payment.StatusFailed),
				})
				_ = nextRetry
			}
			continue
		}

		receiptURL := &result.ReceiptURL
		piID := result.PaymentIntentID
		uc.db.UpdatePaymentStatus(ctx, db.UpdatePaymentStatusParams{
			ID:                    p.ID,
			Status:                string(payment.StatusPaid),
			StripePaymentIntentID: &piID,
			PaidAt:                &now,
			ReceiptURL:            receiptURL,
		})
	}
	return nil
}

func (uc *PaymentUseCase) markPaymentPaid(ctx context.Context, piID, receiptURL string) {
	payments, _ := uc.db.ListPendingPaymentsToProcess(ctx)
	for _, p := range payments {
		if p.StripePaymentIntentID != nil && *p.StripePaymentIntentID == piID {
			now := time.Now()
			uc.db.UpdatePaymentStatus(ctx, db.UpdatePaymentStatusParams{
				ID:                    p.ID,
				Status:                string(payment.StatusPaid),
				StripePaymentIntentID: &piID,
				PaidAt:                &now,
				ReceiptURL:            &receiptURL,
			})
			return
		}
	}
}

func (uc *PaymentUseCase) markPaymentFailed(ctx context.Context, piID, reason string) {
	payments, _ := uc.db.ListPendingPaymentsToProcess(ctx)
	for _, p := range payments {
		if p.StripePaymentIntentID != nil && *p.StripePaymentIntentID == piID {
			uc.db.UpdatePaymentStatus(ctx, db.UpdatePaymentStatusParams{
				ID:            p.ID,
				Status:        string(payment.StatusFailed),
				FailureReason: &reason,
			})
			return
		}
	}
}
