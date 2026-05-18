package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/domain"
)

const (
	ContextKeyUserID = "user_id"
	ContextKeyRole   = "user_role"
)

type JWTClaims struct {
	UserID string `json:"sub"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret         string
	accessTTLMins  int
	refreshTTLDays int
}

func NewJWTManager(secret string, accessTTLMins, refreshTTLDays int) *JWTManager {
	return &JWTManager{
		secret:         secret,
		accessTTLMins:  accessTTLMins,
		refreshTTLDays: refreshTTLDays,
	}
}

func (m *JWTManager) GenerateAccessToken(userID uuid.UUID, role string) (string, error) {
	claims := JWTClaims{
		UserID: userID.String(),
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(m.accessTTLMins) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secret))
}

func (m *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	claims := JWTClaims{
		UserID: userID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(m.refreshTTLDays) * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secret))
}

func (m *JWTManager) ParseToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, domain.ErrUnauthorized
		}
		return []byte(m.secret), nil
	})
	if err != nil {
		return nil, domain.ErrUnauthorized.WithCause(err)
	}
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, domain.ErrUnauthorized
	}
	return claims, nil
}

func (m *JWTManager) AuthMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			auth := c.Request().Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				return echo.NewHTTPError(http.StatusUnauthorized, "認証が必要です")
			}
			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			claims, err := m.ParseToken(tokenStr)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "無効なトークンです")
			}
			c.Set(ContextKeyUserID, claims.UserID)
			c.Set(ContextKeyRole, claims.Role)
			return next(c)
		}
	}
}

func (m *JWTManager) AdminMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role, ok := c.Get(ContextKeyRole).(string)
			if !ok || (role != "admin" && role != "super_admin") {
				return echo.NewHTTPError(http.StatusForbidden, "管理者権限が必要です")
			}
			return next(c)
		}
	}
}

func GetUserID(c echo.Context) (uuid.UUID, error) {
	idStr, ok := c.Get(ContextKeyUserID).(string)
	if !ok || idStr == "" {
		return uuid.Nil, domain.ErrUnauthorized
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, domain.ErrUnauthorized
	}
	return id, nil
}
