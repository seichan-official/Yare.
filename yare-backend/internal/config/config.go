package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	App      AppConfig
	DB       DBConfig
	Redis    RedisConfig
	JWT      JWTConfig
	GitHub   GitHubConfig
	Stripe   StripeConfig
	Resend   ResendConfig
	Agreement AgreementConfig
}

type AppConfig struct {
	Env         string
	Port        string
	FrontendURL string
	APIBaseURL  string
}

type DBConfig struct {
	URL string
}

type RedisConfig struct {
	URL string
}

type JWTConfig struct {
	Secret          string
	AccessTTLMins   int
	RefreshTTLDays  int
}

type GitHubConfig struct {
	ClientID        string
	ClientSecret    string
	TokenEncKey     string
}

type StripeConfig struct {
	SecretKey      string
	WebhookSecret  string
}

type ResendConfig struct {
	APIKey    string
	EmailFrom string
}

type AgreementConfig struct {
	Salt string
}

func Load() (*Config, error) {
	cfg := &Config{
		App: AppConfig{
			Env:         getEnv("APP_ENV", "development"),
			Port:        getEnv("APP_PORT", "8080"),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
			APIBaseURL:  getEnv("API_BASE_URL", "http://localhost:8080"),
		},
		DB: DBConfig{
			URL: mustEnv("DATABASE_URL"),
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},
		JWT: JWTConfig{
			Secret:         mustEnv("JWT_SECRET"),
			AccessTTLMins:  getEnvInt("JWT_ACCESS_TTL_MINUTES", 15),
			RefreshTTLDays: getEnvInt("JWT_REFRESH_TTL_DAYS", 7),
		},
		GitHub: GitHubConfig{
			ClientID:    mustEnv("GITHUB_CLIENT_ID"),
			ClientSecret: mustEnv("GITHUB_CLIENT_SECRET"),
			TokenEncKey: mustEnv("GITHUB_TOKEN_ENCRYPTION_KEY"),
		},
		Stripe: StripeConfig{
			SecretKey:     mustEnv("STRIPE_SECRET_KEY"),
			WebhookSecret: mustEnv("STRIPE_WEBHOOK_SECRET"),
		},
		Resend: ResendConfig{
			APIKey:    getEnv("RESEND_API_KEY", ""),
			EmailFrom: getEnv("EMAIL_FROM", "noreply@yare.jp"),
		},
		Agreement: AgreementConfig{
			Salt: mustEnv("AGREEMENT_SALT"),
		},
	}
	return cfg, nil
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic(fmt.Sprintf("required env var %s is not set", key))
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		i, err := strconv.Atoi(v)
		if err == nil {
			return i
		}
	}
	return fallback
}
