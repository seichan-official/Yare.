package domain

import "fmt"

type DomainError struct {
	Code     string
	Message  string
	HTTPCode int
	Cause    error
}

func (e *DomainError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *DomainError) Unwrap() error {
	return e.Cause
}

func (e *DomainError) WithCause(err error) *DomainError {
	return &DomainError{
		Code:     e.Code,
		Message:  e.Message,
		HTTPCode: e.HTTPCode,
		Cause:    err,
	}
}

var (
	ErrNotFound = &DomainError{
		Code:     "NOT_FOUND",
		Message:  "リソースが見つかりません",
		HTTPCode: 404,
	}
	ErrUnauthorized = &DomainError{
		Code:     "UNAUTHORIZED",
		Message:  "認証が必要です",
		HTTPCode: 401,
	}
	ErrForbidden = &DomainError{
		Code:     "FORBIDDEN",
		Message:  "アクセス権限がありません",
		HTTPCode: 403,
	}
	ErrInvalidRequest = &DomainError{
		Code:     "INVALID_REQUEST",
		Message:  "リクエストが不正です",
		HTTPCode: 400,
	}
	ErrConflict = &DomainError{
		Code:     "CONFLICT",
		Message:  "リソースが既に存在します",
		HTTPCode: 409,
	}
	ErrInternalServer = &DomainError{
		Code:     "INTERNAL_ERROR",
		Message:  "サーバー内部エラーが発生しました",
		HTTPCode: 500,
	}
	ErrTermsNotAgreed = &DomainError{
		Code:     "TERMS_NOT_AGREED",
		Message:  "規約への同意が必要です",
		HTTPCode: 403,
	}
	ErrPaymentMethodNotRegistered = &DomainError{
		Code:     "PAYMENT_METHOD_NOT_REGISTERED",
		Message:  "カード情報を登録してください",
		HTTPCode: 403,
	}
	ErrChallengeAlreadyActive = &DomainError{
		Code:     "CHALLENGE_ALREADY_ACTIVE",
		Message:  "既にアクティブなチャレンジが存在します",
		HTTPCode: 409,
	}
	ErrChallengeCancelExpired = &DomainError{
		Code:     "CHALLENGE_CANCEL_EXPIRED",
		Message:  "チャレンジ作成から30分以上経過しているためキャンセルできません",
		HTTPCode: 409,
	}
	ErrAgeNotVerified = &DomainError{
		Code:     "AGE_NOT_VERIFIED",
		Message:  "年齢確認が必要です",
		HTTPCode: 403,
	}
	ErrDuplicateAgreement = &DomainError{
		Code:     "DUPLICATE_AGREEMENT",
		Message:  "この規約バージョンには既に同意済みです",
		HTTPCode: 409,
	}
	ErrGitHubRepoNotAccessible = &DomainError{
		Code:     "GITHUB_REPO_NOT_ACCESSIBLE",
		Message:  "リポジトリへのアクセス権限がありません",
		HTTPCode: 424,
	}
	ErrRateLimited = &DomainError{
		Code:     "RATE_LIMITED",
		Message:  "リクエストが多すぎます。しばらくしてから再試行してください",
		HTTPCode: 429,
	}
	ErrAccountSuspended = &DomainError{
		Code:     "ACCOUNT_SUSPENDED",
		Message:  "アカウントが停止されています",
		HTTPCode: 403,
	}
)
