package stripe

import (
	"fmt"

	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/customer"
	"github.com/stripe/stripe-go/v79/paymentintent"
	"github.com/stripe/stripe-go/v79/setupintent"
	"github.com/stripe/stripe-go/v79/webhook"
)

type Client struct {
	secretKey     string
	webhookSecret string
}

type SetupIntentResult struct {
	CustomerID   string
	ClientSecret string
}

type PaymentResult struct {
	PaymentIntentID string
	Status          string
	ReceiptURL      string
}

func NewClient(secretKey, webhookSecret string) *Client {
	stripe.Key = secretKey
	return &Client{
		secretKey:     secretKey,
		webhookSecret: webhookSecret,
	}
}

func (c *Client) CreateCustomer(email, name string) (string, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
	}
	cust, err := customer.New(params)
	if err != nil {
		return "", fmt.Errorf("create stripe customer: %w", err)
	}
	return cust.ID, nil
}

func (c *Client) CreateSetupIntent(customerID string) (*SetupIntentResult, error) {
	params := &stripe.SetupIntentParams{
		Customer: stripe.String(customerID),
		Usage:    stripe.String("off_session"),
	}
	si, err := setupintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("create setup intent: %w", err)
	}
	return &SetupIntentResult{
		CustomerID:   customerID,
		ClientSecret: si.ClientSecret,
	}, nil
}

func (c *Client) ChargeCustomer(customerID, paymentMethodID string, amountJPY int64, idempotencyKey string) (*PaymentResult, error) {
	params := &stripe.PaymentIntentParams{
		Amount:        stripe.Int64(amountJPY),
		Currency:      stripe.String(string(stripe.CurrencyJPY)),
		Customer:      stripe.String(customerID),
		PaymentMethod: stripe.String(paymentMethodID),
		OffSession:    stripe.Bool(true),
		Confirm:       stripe.Bool(true),
	}
	params.IdempotencyKey = stripe.String(idempotencyKey)

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("create payment intent: %w", err)
	}
	result := &PaymentResult{
		PaymentIntentID: pi.ID,
		Status:          string(pi.Status),
	}
	if pi.LatestCharge != nil {
		result.ReceiptURL = pi.LatestCharge.ReceiptURL
	}
	return result, nil
}

func (c *Client) ConstructWebhookEvent(payload []byte, sigHeader string) (*stripe.Event, error) {
	event, err := webhook.ConstructEvent(payload, sigHeader, c.webhookSecret)
	if err != nil {
		return nil, fmt.Errorf("construct webhook event: %w", err)
	}
	return &event, nil
}
