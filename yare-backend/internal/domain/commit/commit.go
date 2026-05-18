package commit

import (
	"time"

	"github.com/google/uuid"
)

type ValidationStatus string

const (
	ValidationStatusValid      ValidationStatus = "valid"
	ValidationStatusInvalid    ValidationStatus = "invalid"
	ValidationStatusSuspicious ValidationStatus = "suspicious"
)

type ReasonCode string

const (
	ReasonEmptyCommit      ReasonCode = "EMPTY_COMMIT"
	ReasonNoTargetFiles    ReasonCode = "NO_TARGET_FILES"
	ReasonInsufficientLines ReasonCode = "INSUFFICIENT_LINES"
	ReasonInsufficientChars ReasonCode = "INSUFFICIENT_CHARS"
	ReasonRepeatedChars    ReasonCode = "REPEATED_CHARS"
	ReasonLowEntropy       ReasonCode = "LOW_ENTROPY"
	ReasonSyntaxError      ReasonCode = "SYNTAX_ERROR"
	ReasonLowDiversity     ReasonCode = "LOW_DIVERSITY"
	ReasonTemporalPattern  ReasonCode = "TEMPORAL_PATTERN"
)

const ValidatorVersion = "1.0.0"

type RawCommit struct {
	ID           uuid.UUID
	ChallengeID  uuid.UUID
	RepositoryID uuid.UUID
	CommitSHA    string
	AuthorEmail  *string
	CommittedAt  time.Time
	Message      string
	Additions    int
	Deletions    int
	FilesChanged []FileChange
	DiffContent  *string
}

type FileChange struct {
	Filename  string `json:"filename"`
	Status    string `json:"status"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Patch     string `json:"patch,omitempty"`
}

type ValidationResult struct {
	Status      ValidationStatus
	ReasonCodes []ReasonCode
	Details     map[string]any
}

func (r *ValidationResult) IsValid() bool {
	return r.Status == ValidationStatusValid
}

func (r *ValidationResult) IsSuspicious() bool {
	return r.Status == ValidationStatusSuspicious
}
