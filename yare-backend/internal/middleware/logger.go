package middleware

import (
	"log/slog"
	"time"

	"github.com/labstack/echo/v4"
)

func Logger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			req := c.Request()
			res := c.Response()
			slog.Info("request",
				"method", req.Method,
				"uri", req.RequestURI,
				"status", res.Status,
				"latency_ms", time.Since(start).Milliseconds(),
				"request_id", c.Response().Header().Get(echo.HeaderXRequestID),
			)
			return err
		}
	}
}
