package db

import (
	"net"

	"github.com/jackc/pgx/v5"
)

type scanner interface {
	Scan(dest ...any) error
}

func scanUser(s scanner) (*User, error) {
	var u User
	err := s.Scan(
		&u.ID, &u.GithubUserID, &u.GithubLogin, &u.Email, &u.DisplayName, &u.AvatarURL,
		&u.GithubAccessToken, &u.AgeVerifiedAt, &u.Role, &u.Status, &u.TotpSecret,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func scanTermsVersion(s scanner) (*TermsVersion, error) {
	var tv TermsVersion
	err := s.Scan(
		&tv.ID, &tv.Version, &tv.Content, &tv.ContentHash, &tv.CheckpointItems,
		&tv.PublishedAt, &tv.IsCurrent, &tv.CreatedAt, &tv.UpdatedAt, &tv.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &tv, nil
}

func scanUserAgreement(s scanner) (*UserAgreement, error) {
	var a UserAgreement
	var ip string
	err := s.Scan(
		&a.ID, &a.UserID, &a.TermsVersionID, &a.CheckboxStates, &ip, &a.UserAgent,
		&a.AgreedAt, &a.PreviousHash, &a.SignatureHash, &a.CreatedAt, &a.UpdatedAt, &a.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	a.IPAddress = net.ParseIP(ip)
	return &a, nil
}

func scanChallenge(s scanner) (*Challenge, error) {
	var c Challenge
	err := s.Scan(
		&c.ID, &c.UserID, &c.Status, &c.StartDate, &c.EndDate, &c.FrequencyType,
		&c.FrequencyValue, &c.MinLinesPerDay, &c.Languages, &c.ChallengeAmount, &c.PenaltyAmount,
		&c.TermsVersionID, &c.AgreementID, &c.CompletedAt, &c.FailedAt,
		&c.CreatedAt, &c.UpdatedAt, &c.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func scanChallengeRepo(s scanner) (*ChallengeRepository, error) {
	var r ChallengeRepository
	err := s.Scan(
		&r.ID, &r.ChallengeID, &r.GithubRepoID, &r.FullName, &r.WebhookID, &r.WebhookSecret,
		&r.CreatedAt, &r.UpdatedAt, &r.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &r, nil
}

func scanRawCommit(s scanner) (*RawCommit, error) {
	var c RawCommit
	err := s.Scan(
		&c.ID, &c.ChallengeID, &c.RepositoryID, &c.CommitSha, &c.AuthorEmail,
		&c.CommittedAt, &c.Message, &c.Additions, &c.Deletions, &c.FilesChanged,
		&c.DiffContent, &c.RawPayload, &c.CreatedAt, &c.UpdatedAt, &c.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func scanDailyProgress(s scanner) (*DailyProgress, error) {
	var dp DailyProgress
	err := s.Scan(
		&dp.ID, &dp.ChallengeID, &dp.Date, &dp.ValidCommitCount, &dp.SuspiciousCommitCount,
		&dp.IsAchieved, &dp.TotalLinesAdded, &dp.CreatedAt, &dp.UpdatedAt, &dp.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &dp, nil
}

func scanPayment(s scanner) (*Payment, error) {
	var p Payment
	err := s.Scan(
		&p.ID, &p.UserID, &p.ChallengeID, &p.PaymentType, &p.Amount, &p.Status,
		&p.StripePaymentIntentID, &p.ScheduledAt, &p.PreNotifiedAt, &p.PaidAt,
		&p.FailureReason, &p.ReceiptURL, &p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func scanNotification(s scanner) (*Notification, error) {
	var n Notification
	err := s.Scan(
		&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.ActionURL,
		&n.ReadAt, &n.EmailSentAt, &n.CreatedAt, &n.UpdatedAt, &n.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &n, nil
}

func scanSuspiciousReview(s scanner) (*SuspiciousReview, error) {
	var sr SuspiciousReview
	err := s.Scan(
		&sr.ID, &sr.RawCommitID, &sr.Status, &sr.ReviewerID, &sr.SuspicionReasons,
		&sr.ContactedAt, &sr.UserResponse, &sr.RespondedAt, &sr.FinalDecision, &sr.DecidedAt,
		&sr.CreatedAt, &sr.UpdatedAt, &sr.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &sr, nil
}

func scanAppeal(s scanner) (*Appeal, error) {
	var a Appeal
	err := s.Scan(
		&a.ID, &a.UserID, &a.TargetType, &a.TargetID, &a.Reason, &a.Status,
		&a.ReviewerID, &a.DecisionReason, &a.DecidedAt, &a.CreatedAt, &a.UpdatedAt, &a.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func scanAuditLogs(rows interface{ Next() bool; Scan(dest ...any) error; Close(); Err() error }) ([]*AuditLog, error) {
	defer rows.Close()
	var result []*AuditLog
	for rows.Next() {
		var al AuditLog
		var ip string
		err := rows.Scan(&al.ID, &al.ActorID, &al.ActorType, &al.Action, &al.TargetType, &al.TargetID,
			&al.Payload, &ip, &al.UserAgent, &al.OccurredAt)
		if err != nil {
			return nil, err
		}
		al.IPAddress = net.ParseIP(ip)
		result = append(result, &al)
	}
	return result, rows.Err()
}

func ipToString(ip net.IP) string {
	if ip == nil {
		return ""
	}
	return ip.String()
}
