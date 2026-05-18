package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/seichan-official/yare-backend/internal/config"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	emailinfra "github.com/seichan-official/yare-backend/internal/infrastructure/email"
	ghinfra "github.com/seichan-official/yare-backend/internal/infrastructure/github"
	stripeinfra "github.com/seichan-official/yare-backend/internal/infrastructure/stripe"
	"github.com/seichan-official/yare-backend/internal/usecase"
	"github.com/seichan-official/yare-backend/internal/worker"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := db.NewPool(ctx, cfg.DB.URL)
	cancel()
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	q := db.NewQueries(pool)

	ghClient := ghinfra.NewClient(cfg.GitHub.ClientID, cfg.GitHub.ClientSecret)
	stripeClient := stripeinfra.NewClient(cfg.Stripe.SecretKey, cfg.Stripe.WebhookSecret)
	emailClient := emailinfra.NewClient(cfg.Resend.APIKey, cfg.Resend.EmailFrom)

	commitUC := usecase.NewCommitUseCase(q, ghClient)
	judgeUC := usecase.NewJudgeUseCase(q, emailClient)
	payUC := usecase.NewPaymentUseCase(q, stripeClient)

	w := worker.New(commitUC, judgeUC, payUC)

	ctx, cancel = context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		slog.Info("shutting down worker...")
		cancel()
	}()

	slog.Info("starting worker")
	w.Start(ctx)
	slog.Info("worker stopped")
}
