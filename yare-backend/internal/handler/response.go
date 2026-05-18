package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/seichan-official/yare-backend/internal/domain"
)

type Response struct {
	Data any `json:"data,omitempty"`
}

type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func ok(c echo.Context, data any) error {
	return c.JSON(http.StatusOK, Response{Data: data})
}

func created(c echo.Context, data any) error {
	return c.JSON(http.StatusCreated, Response{Data: data})
}

func handleError(c echo.Context, err error) error {
	var domErr *domain.DomainError
	if errors.As(err, &domErr) {
		msg := domErr.Message
		if domErr.HTTPCode >= 500 && domErr.Unwrap() != nil {
			slog.Error("internal error", "code", domErr.Code, "cause", domErr.Unwrap().Error(), "uri", c.Request().RequestURI)
			msg = domErr.Unwrap().Error()
		}
		return c.JSON(domErr.HTTPCode, ErrorResponse{
			Error: ErrorDetail{Code: domErr.Code, Message: msg},
		})
	}
	slog.Error("unhandled error", "error", err, "uri", c.Request().RequestURI)
	cause := "unknown"
	if err != nil {
		cause = err.Error()
	}
	return c.JSON(http.StatusInternalServerError, ErrorResponse{
		Error: ErrorDetail{Code: "INTERNAL_ERROR", Message: cause},
	})
}
