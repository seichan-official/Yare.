package validator

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/seichan-official/yare-backend/internal/domain/commit"
)

var languageExtensions = map[string][]string{
	"javascript": {".js", ".jsx", ".mjs", ".cjs"},
	"typescript": {".ts", ".tsx"},
	"python":     {".py"},
	"go":         {".go"},
	"ruby":       {".rb"},
	"java":       {".java"},
	"php":        {".php"},
	"rust":       {".rs"},
	"c":          {".c", ".h"},
	"cpp":        {".cpp", ".cc", ".cxx", ".hpp"},
	"csharp":     {".cs"},
	"swift":      {".swift"},
	"kotlin":     {".kt", ".kts"},
}

type CommitInput struct {
	SHA          string
	Additions    int
	Deletions    int
	Files        []FileInput
	DiffContent  string
	CommittedAt  time.Time
	RecentTimes  []time.Time
}

type FileInput struct {
	Filename  string
	Additions int
	Deletions int
	Patch     string
}

type ChallengeConfig struct {
	Languages      []string
	MinLinesPerDay int
}

func Validate(c *CommitInput, cfg *ChallengeConfig) *commit.ValidationResult {
	result := &commit.ValidationResult{
		Details: make(map[string]any),
	}

	// Stage 1: 空コミットチェック
	if c.Additions == 0 && c.Deletions == 0 {
		result.Status = commit.ValidationStatusInvalid
		result.ReasonCodes = []commit.ReasonCode{commit.ReasonEmptyCommit}
		return result
	}

	// Stage 2: 対象拡張子チェック
	targetExts := buildTargetExtensions(cfg.Languages)
	targetFiles := filterTargetFiles(c.Files, targetExts)
	if len(targetFiles) == 0 {
		result.Status = commit.ValidationStatusInvalid
		result.ReasonCodes = []commit.ReasonCode{commit.ReasonNoTargetFiles}
		return result
	}

	// Stage 3: 量的チェック
	addedLines, addedContent := extractAddedContent(targetFiles)
	weightedLines := computeWeightedLines(addedLines, cfg.Languages)

	if weightedLines < float64(cfg.MinLinesPerDay) {
		result.Status = commit.ValidationStatusInvalid
		result.ReasonCodes = append(result.ReasonCodes, commit.ReasonInsufficientLines)
		result.Details["weighted_lines"] = weightedLines
		result.Details["required_lines"] = cfg.MinLinesPerDay
	}

	if utf8.RuneCountInString(addedContent) < 1000 {
		result.ReasonCodes = append(result.ReasonCodes, commit.ReasonInsufficientChars)
		result.Details["char_count"] = utf8.RuneCountInString(addedContent)
	}

	if len(result.ReasonCodes) > 0 {
		result.Status = commit.ValidationStatusInvalid
		return result
	}

	// Stage 4: 質的チェック
	var suspiciousReasons []commit.ReasonCode

	if repeatedRatio := computeRepeatedRatio(addedContent); repeatedRatio > 0.3 {
		result.ReasonCodes = append(result.ReasonCodes, commit.ReasonRepeatedChars)
		result.Details["repeated_ratio"] = repeatedRatio
		result.Status = commit.ValidationStatusInvalid
		return result
	}

	if ratio := compressionRatio(addedContent); ratio < 0.1 {
		suspiciousReasons = append(suspiciousReasons, commit.ReasonLowEntropy)
		result.Details["compression_ratio"] = ratio
	}

	if diversity := identifierDiversity(addedContent, addedLines); diversity < 0.05 && addedLines > 10 {
		suspiciousReasons = append(suspiciousReasons, commit.ReasonLowDiversity)
		result.Details["identifier_diversity"] = diversity
	}

	// Stage 5: 時刻パターンチェック
	if isPeriodic(c.RecentTimes, 5*time.Minute) {
		suspiciousReasons = append(suspiciousReasons, commit.ReasonTemporalPattern)
	}

	if len(suspiciousReasons) > 0 {
		result.Status = commit.ValidationStatusSuspicious
		result.ReasonCodes = suspiciousReasons
		return result
	}

	result.Status = commit.ValidationStatusValid
	return result
}

func buildTargetExtensions(languages []string) map[string]bool {
	exts := map[string]bool{}
	for _, lang := range languages {
		for _, ext := range languageExtensions[lang] {
			exts[ext] = true
		}
	}
	return exts
}

func filterTargetFiles(files []FileInput, exts map[string]bool) []FileInput {
	var result []FileInput
	for _, f := range files {
		for ext := range exts {
			if strings.HasSuffix(f.Filename, ext) {
				result = append(result, f)
				break
			}
		}
	}
	return result
}

func extractAddedContent(files []FileInput) (int, string) {
	var sb strings.Builder
	total := 0
	for _, f := range files {
		for _, line := range strings.Split(f.Patch, "\n") {
			if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
				sb.WriteString(line[1:])
				sb.WriteByte('\n')
				total++
			}
		}
	}
	return total, sb.String()
}

func computeWeightedLines(lines int, languages []string) float64 {
	return float64(lines)
}

func computeRepeatedRatio(content string) float64 {
	if len(content) == 0 {
		return 0
	}
	repeatedCount := 0
	runes := []rune(content)
	for i := 0; i+2 < len(runes); i++ {
		if runes[i] == runes[i+1] && runes[i+1] == runes[i+2] {
			repeatedCount++
		}
	}
	return float64(repeatedCount) / float64(len(runes))
}

func compressionRatio(content string) float64 {
	if len(content) == 0 {
		return 1.0
	}
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	gz.Write([]byte(content))
	gz.Close()
	return float64(buf.Len()) / float64(len(content))
}

func identifierDiversity(content string, lines int) float64 {
	if lines == 0 {
		return 1.0
	}
	words := strings.FieldsFunc(content, func(r rune) bool {
		return !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_')
	})
	unique := map[string]bool{}
	for _, w := range words {
		if len(w) > 1 {
			unique[w] = true
		}
	}
	return float64(len(unique)) / float64(lines)
}

func isPeriodic(times []time.Time, tolerance time.Duration) bool {
	if len(times) < 3 {
		return false
	}
	ref := times[0]
	count := 0
	for _, t := range times[1:] {
		diff := t.Sub(ref)
		if diff < 0 {
			diff = -diff
		}
		mod := diff % (24 * time.Hour)
		if mod > 12*time.Hour {
			mod = 24*time.Hour - mod
		}
		if mod <= tolerance {
			count++
		}
	}
	return count >= len(times)/2
}

func ReasonCodesToJSON(codes []commit.ReasonCode) json.RawMessage {
	strs := make([]string, len(codes))
	for i, c := range codes {
		strs[i] = string(c)
	}
	b, _ := json.Marshal(strs)
	return b
}
