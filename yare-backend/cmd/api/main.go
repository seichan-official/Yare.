package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/seichan-official/yare-backend/internal/config"
	"github.com/seichan-official/yare-backend/internal/handler"
	"github.com/seichan-official/yare-backend/internal/infrastructure/db"
	emailinfra "github.com/seichan-official/yare-backend/internal/infrastructure/email"
	ghinfra "github.com/seichan-official/yare-backend/internal/infrastructure/github"
	stripeinfra "github.com/seichan-official/yare-backend/internal/infrastructure/stripe"
	"github.com/seichan-official/yare-backend/internal/middleware"
	"github.com/seichan-official/yare-backend/internal/usecase"
)

type customValidator struct {
	v *validator.Validate
}

func (cv *customValidator) Validate(i any) error {
	return cv.v.Struct(i)
}

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.DB.URL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	q := db.NewQueries(pool)

	ghClient := ghinfra.NewClient(cfg.GitHub.ClientID, cfg.GitHub.ClientSecret)
	stripeClient := stripeinfra.NewClient(cfg.Stripe.SecretKey, cfg.Stripe.WebhookSecret)
	emailClient := emailinfra.NewClient(cfg.Resend.APIKey, cfg.Resend.EmailFrom)
	jwtManager := middleware.NewJWTManager(cfg.JWT.Secret, cfg.JWT.AccessTTLMins, cfg.JWT.RefreshTTLDays)

	_ = emailClient

	authUC := usecase.NewAuthUseCase(q, ghClient, jwtManager, cfg.GitHub.TokenEncKey)
	agreementUC := usecase.NewAgreementUseCase(q, cfg.Agreement.Salt)
	skipPaymentCheck := os.Getenv("SKIP_PAYMENT_CHECK") == "true"
	challengeUC := usecase.NewChallengeUseCase(q, ghClient, cfg.GitHub.TokenEncKey, cfg.App.APIBaseURL, skipPaymentCheck)
	commitUC := usecase.NewCommitUseCase(q, ghClient)
	paymentUC := usecase.NewPaymentUseCase(q, stripeClient)
	notifUC := usecase.NewNotificationUseCase(q)

	authH := handler.NewAuthHandler(authUC)
	agreementH := handler.NewAgreementHandler(agreementUC)
	challengeH := handler.NewChallengeHandler(challengeUC)
	webhookH := handler.NewWebhookHandler(commitUC, paymentUC)
	paymentH := handler.NewPaymentHandler(paymentUC, q)
	notifH := handler.NewNotificationHandler(notifUC)

	e := echo.New()
	e.Validator = &customValidator{v: validator.New()}
	e.Use(echomw.RequestID())
	e.Use(echomw.Recover())
	e.Use(middleware.Logger())
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: []string{cfg.App.FrontendURL},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderAuthorization, echo.HeaderContentType},
	}))

	// Webhooks (no auth)
	e.POST("/webhooks/github", webhookH.GitHubWebhook)
	e.POST("/webhooks/stripe", webhookH.StripeWebhook)

	v1 := e.Group("/api/v1")

	// Auth
	v1.POST("/auth/github/callback", authH.GitHubCallback)
	v1.POST("/auth/refresh", authH.RefreshToken)
	auth0 := v1.Group("", jwtManager.AuthMiddleware())
	auth0.POST("/auth/age-verify", authH.AgeVerify)
	auth0.DELETE("/me", authH.DeleteAccount)

	// Authenticated routes
	auth := v1.Group("", jwtManager.AuthMiddleware())

	// Agreements
	auth.GET("/terms/current", agreementH.GetCurrentTerms)
	auth.POST("/agreements", agreementH.CreateAgreement)

	// Payment
	auth.POST("/payment/setup-intent", paymentH.CreateSetupIntent)

	// Challenges
	auth.POST("/challenges", challengeH.Create)
	auth.GET("/challenges", challengeH.List)
	auth.GET("/challenges/:id", challengeH.GetByID)
	auth.DELETE("/challenges/:id", challengeH.Cancel)
	auth.GET("/challenges/:id/commits", challengeH.ListCommits)
	auth.GET("/challenges/:id/progress", challengeH.GetProgress)

	// GitHub repos
	auth.GET("/github/repositories", challengeH.ListRepositories)

	// Notifications
	auth.GET("/notifications", notifH.List)
	auth.PUT("/notifications/:id/read", notifH.MarkRead)

	// Health check
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	go func() {
		addr := ":" + cfg.App.Port
		slog.Info("starting API server", "addr", addr)
		if err := e.Start(addr); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
	slog.Info("server stopped")
}
