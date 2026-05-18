package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/seichan-official/yare-backend/internal/usecase"
)

type Worker struct {
	commitUC *usecase.CommitUseCase
	judgeUC  *usecase.JudgeUseCase
	payUC    *usecase.PaymentUseCase
}

func New(commitUC *usecase.CommitUseCase, judgeUC *usecase.JudgeUseCase, payUC *usecase.PaymentUseCase) *Worker {
	return &Worker{
		commitUC: commitUC,
		judgeUC:  judgeUC,
		payUC:    payUC,
	}
}

func (w *Worker) Start(ctx context.Context) {
	go w.runEvery(ctx, "validate-commits", 1*time.Minute, func(ctx context.Context) error {
		return w.commitUC.ValidateUnprocessed(ctx)
	})
	go w.runEvery(ctx, "judge-challenges", 10*time.Minute, func(ctx context.Context) error {
		return w.judgeUC.JudgeExpiredChallenges(ctx)
	})
	go w.runEvery(ctx, "process-payments", 5*time.Minute, func(ctx context.Context) error {
		return w.payUC.ProcessPendingPayments(ctx)
	})
	<-ctx.Done()
}

func (w *Worker) runEvery(ctx context.Context, name string, interval time.Duration, fn func(context.Context) error) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := fn(ctx); err != nil {
				slog.Error("worker job failed", "job", name, "error", err)
			} else {
				slog.Info("worker job completed", "job", name)
			}
		case <-ctx.Done():
			return
		}
	}
}
