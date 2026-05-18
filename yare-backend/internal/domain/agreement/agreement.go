package agreement

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net"
	"time"

	"github.com/google/uuid"
)

type CheckboxStates map[string]bool

type Agreement struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	TermsVersionID  uuid.UUID
	CheckboxStates  CheckboxStates
	IPAddress       net.IP
	UserAgent       string
	AgreedAt        time.Time
	PreviousHash    *string
	SignatureHash   string
}

type TermsVersion struct {
	ID              uuid.UUID       `json:"id"`
	Version         string          `json:"version"`
	Content         string          `json:"content"`
	ContentHash     string          `json:"content_hash"`
	CheckpointItems []CheckpointItem `json:"checkpoint_items"`
	PublishedAt     time.Time       `json:"published_at"`
	IsCurrent       bool            `json:"is_current"`
}

type CheckpointItem struct {
	ID                   int    `json:"id"`
	Label                string `json:"label"`
	RequiredScrollAnchor string `json:"required_scroll_anchor"`
}

func (s CheckboxStates) AllChecked(count int) bool {
	for i := 1; i <= count; i++ {
		key := fmt.Sprintf("%d", i)
		if !s[key] {
			return false
		}
	}
	return true
}

func ComputeSignatureHash(
	userID uuid.UUID,
	termsVersionID uuid.UUID,
	termsContentHash string,
	checkboxStates CheckboxStates,
	ipAddress net.IP,
	userAgent string,
	agreedAt time.Time,
	previousHash string,
	salt string,
) string {
	statesJSON, _ := json.Marshal(checkboxStates)
	input := fmt.Sprintf("%s|%s|%s|%s|%s|%s|%s|%s|%s",
		userID.String(),
		termsVersionID.String(),
		termsContentHash,
		string(statesJSON),
		ipAddress.String(),
		userAgent,
		agreedAt.Format(time.RFC3339),
		previousHash,
		salt,
	)
	hash := sha256.Sum256([]byte(input))
	return fmt.Sprintf("%x", hash)
}
