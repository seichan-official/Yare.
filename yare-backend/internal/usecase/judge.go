package usecase

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/seichan-official/yare-backend/internal/domain/challenge"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	"github.com/seichan-official/yare-backend/internal/infrastructure/email"
)

type JudgeUseCase struct {
	db    db.Querier
	email *email.Client
}

func NewJudgeUseCase(q db.Querier, emailClient *email.Client) *JudgeUseCase {
	return &JudgeUseCase{db: q, email: emailClient}
}

func (uc *JudgeUseCase) JudgeExpiredChallenges(ctx context.Context) error {
	challenges, err := uc.db.ListActiveChallengesToJudge(ctx)
	if err != nil {
		return err
	}

	// 審査中コミットのチャレンジIDセットを事前取得
	pendingReviews, _ := uc.db.ListPendingSuspiciousReviews(ctx)
	pendingChallengeIDs := map[uuid.UUID]bool{}
	for _, r := range pendingReviews {
		pendingChallengeIDs[r.ChallengeID] = true
	}

	for _, c := range challenges {
		// 審査中コミットがある場合は判定を保留（under_review に移行）
		if pendingChallengeIDs[c.ID] {
			slog.Info("challenge has pending suspicious reviews, deferring judgment",
				"challenge_id", c.ID)
			uc.db.UpdateChallengeStatus(ctx, db.UpdateChallengeStatusParams{
				ID:     c.ID,
				Status: string(challenge.StatusUnderReview),
			})
			u, _ := uc.db.GetUserByID(ctx, c.UserID)
			if u != nil {
				uc.email.Send(email.SendParams{
					To:      u.Email,
					Subject: "【Yare】コミット審査中のため判定を保留しています",
					HTML: `<p>チャレンジ期間が終了しましたが、審査中のコミットがあるため判定を保留しています。</p>
<p>審査完了後に改めて達成・未達成を判定します。</p>`,
				})
			}
			uc.db.CreateNotification(ctx, db.CreateNotificationParams{
				UserID: c.UserID,
				Type:   "challenge_under_review",
				Title:  "チャレンジ判定を保留中",
				Body:   "審査中のコミットがあるため、審査完了後に達成・未達成を判定します。",
			})
			continue
		}

		achievedDays, _ := uc.db.CountAchievedDays(ctx, c.ID)

		dom := &challenge.Challenge{
			StartDate:     c.StartDate,
			EndDate:       c.EndDate,
			FrequencyType: challenge.FrequencyType(c.FrequencyType),
		}
		if c.FrequencyValue != nil {
			v := int(*c.FrequencyValue)
			dom.FrequencyValue = &v
		}
		required := dom.RequiredDays()

		u, _ := uc.db.GetUserByID(ctx, c.UserID)

		now := time.Now()
		if int(achievedDays) >= required {
			// 達成
			uc.db.UpdateChallengeStatus(ctx, db.UpdateChallengeStatusParams{
				ID:          c.ID,
				Status:      string(challenge.StatusCompleted),
				CompletedAt: &now,
			})
			if u != nil {
				uc.email.SendChallengeCompletedNotification(u.Email)
			}
			uc.db.CreateNotification(ctx, db.CreateNotificationParams{
				UserID: c.UserID,
				Type:   "challenge_completed",
				Title:  "チャレンジ達成おめでとうございます！",
				Body:   "全ての必要なコミットを達成しました。",
			})
		} else {
			// 未達成 → challenge_amount で課金（penalty_amount は違反時専用）
			uc.db.UpdateChallengeStatus(ctx, db.UpdateChallengeStatusParams{
				ID:       c.ID,
				Status:   string(challenge.StatusFailed),
				FailedAt: &now,
			})
			scheduledAt := now.Add(48 * time.Hour)
			uc.db.CreatePayment(ctx, db.CreatePaymentParams{
				UserID:      c.UserID,
				ChallengeID: c.ID,
				PaymentType: "fee",
				Amount:      c.ChallengeAmount,
				ScheduledAt: scheduledAt,
			})
			if u != nil {
				uc.email.SendChallengeFailedNotification(u.Email, int(c.ChallengeAmount))
			}
			uc.db.CreateNotification(ctx, db.CreateNotificationParams{
				UserID: c.UserID,
				Type:   "challenge_failed",
				Title:  "チャレンジ未達成のお知らせ",
				Body:   "チャレンジが未達成となりました。48時間後に課金が実行されます。",
			})
		}
	}
	return nil
}

// ResumeJudgmentAfterReview は審査完了後に under_review チャレンジを再判定する
func (uc *JudgeUseCase) ResumeJudgmentAfterReview(ctx context.Context, challengeID uuid.UUID) error {
	c, err := uc.db.GetChallengeByID(ctx, challengeID)
	if err != nil || c == nil {
		return err
	}
	if c.Status != string(challenge.StatusUnderReview) {
		return nil
	}

	// 審査中がまだ残っていれば再度保留
	pendingReviews, _ := uc.db.ListPendingSuspiciousReviews(ctx)
	for _, r := range pendingReviews {
		if r.ChallengeID == challengeID {
			return nil // まだ審査中
		}
	}

	// 審査完了 → active に戻してから判定実行（ListActiveChallengesToJudge に引っかかるよう）
	uc.db.UpdateChallengeStatus(ctx, db.UpdateChallengeStatusParams{
		ID:     challengeID,
		Status: string(challenge.StatusActive),
	})
	return uc.JudgeExpiredChallenges(ctx)
}
