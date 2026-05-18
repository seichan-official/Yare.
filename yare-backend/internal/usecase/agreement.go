package usecase

import (
	"context"
	"encoding/json"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain"
	"github.com/seichan-official/yare-backend/internal/domain/agreement"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
)

type AgreementUseCase struct {
	db   db.Querier
	salt string
}

func NewAgreementUseCase(q db.Querier, salt string) *AgreementUseCase {
	return &AgreementUseCase{db: q, salt: salt}
}

type CreateAgreementInput struct {
	UserID         uuid.UUID
	TermsVersionID uuid.UUID
	CheckboxStates map[string]bool
	IPAddress      net.IP
	UserAgent      string
}

type AgreementOutput struct {
	AgreementID   string
	SignatureHash string
	AgreedAt      time.Time
}

func (uc *AgreementUseCase) GetCurrentTerms(ctx context.Context) (*agreement.TermsVersion, error) {
	tv, err := uc.db.GetCurrentTermsVersion(ctx)
	if err != nil || tv == nil {
		return nil, domain.ErrNotFound
	}
	var items []agreement.CheckpointItem
	if err := json.Unmarshal(tv.CheckpointItems, &items); err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}
	return &agreement.TermsVersion{
		ID:              tv.ID,
		Version:         tv.Version,
		Content:         tv.Content,
		ContentHash:     tv.ContentHash,
		CheckpointItems: items,
		PublishedAt:     tv.PublishedAt,
		IsCurrent:       tv.IsCurrent,
	}, nil
}

func (uc *AgreementUseCase) CreateAgreement(ctx context.Context, input CreateAgreementInput) (*AgreementOutput, error) {
	tv, err := uc.db.GetTermsVersionByID(ctx, input.TermsVersionID)
	if err != nil || tv == nil {
		return nil, domain.ErrNotFound
	}

	var items []agreement.CheckpointItem
	if err := json.Unmarshal(tv.CheckpointItems, &items); err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	states := agreement.CheckboxStates(input.CheckboxStates)
	if !states.AllChecked(len(items)) {
		return nil, domain.ErrInvalidRequest.WithCause(nil)
	}

	existing, _ := uc.db.GetUserAgreement(ctx, db.GetUserAgreementParams{
		UserID:         input.UserID,
		TermsVersionID: input.TermsVersionID,
	})
	if existing != nil {
		return nil, domain.ErrDuplicateAgreement
	}

	latest, _ := uc.db.GetLatestUserAgreement(ctx, input.UserID)
	var prevHash string
	if latest != nil {
		prevHash = latest.SignatureHash
	}

	agreedAt := time.Now()
	statesJSON, _ := json.Marshal(input.CheckboxStates)

	sigHash := agreement.ComputeSignatureHash(
		input.UserID,
		input.TermsVersionID,
		tv.ContentHash,
		states,
		input.IPAddress,
		input.UserAgent,
		agreedAt,
		prevHash,
		uc.salt,
	)

	var prevHashPtr *string
	if prevHash != "" {
		prevHashPtr = &prevHash
	}

	record, err := uc.db.CreateUserAgreement(ctx, db.CreateUserAgreementParams{
		UserID:         input.UserID,
		TermsVersionID: input.TermsVersionID,
		CheckboxStates: json.RawMessage(statesJSON),
		IPAddress:      input.IPAddress,
		UserAgent:      input.UserAgent,
		AgreedAt:       agreedAt,
		PreviousHash:   prevHashPtr,
		SignatureHash:  sigHash,
	})
	if err != nil {
		return nil, domain.ErrInternalServer.WithCause(err)
	}

	return &AgreementOutput{
		AgreementID:   record.ID.String(),
		SignatureHash: record.SignatureHash,
		AgreedAt:      record.AgreedAt,
	}, nil
}

func (uc *AgreementUseCase) HasAgreedToCurrentTerms(ctx context.Context, userID uuid.UUID) (bool, uuid.UUID, error) {
	tv, err := uc.db.GetCurrentTermsVersion(ctx)
	if err != nil || tv == nil {
		return false, uuid.Nil, nil
	}
	a, _ := uc.db.GetUserAgreement(ctx, db.GetUserAgreementParams{
		UserID:         userID,
		TermsVersionID: tv.ID,
	})
	if a == nil {
		return false, uuid.Nil, nil
	}
	return true, a.ID, nil
}
