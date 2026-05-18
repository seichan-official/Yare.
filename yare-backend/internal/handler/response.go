package handler

import (
	"errors"
	"fmt"
	"net/http"
	"os"

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
	fmt.Fprintf(os.Stderr, "[DEBUG] handleError: %+v\n", err)
	var domErr *domain.DomainError
	if errors.As(err, &domErr) {
		return c.JSON(domErr.HTTPCode, ErrorResponse{
			Error: ErrorDetail{Code: domErr.Code, Message: domErr.Error()},
		})
	}
	msg := "unknown"
	if err != nil {
		msg = err.Error()
	}
	return c.JSON(http.StatusInternalServerError, ErrorResponse{
		Error: ErrorDetail{Code: "INTERNAL_ERROR", Message: msg},
	})
}
