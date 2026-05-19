package db

import (
	"context"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Queries struct {
	pool *pgxpool.Pool
}

func NewQueries(pool *pgxpool.Pool) *Queries {
	return &Queries{pool: pool}
}

// ---- Users ----

func (q *Queries) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, github_user_id, github_login, email, display_name, avatar_url,
		        github_access_token, age_verified_at, role, status, totp_secret,
		        created_at, updated_at, deleted_at
		 FROM users WHERE id = $1 AND deleted_at IS NULL`, id)
	return scanUser(row)
}

func (q *Queries) GetUserByGitHubID(ctx context.Context, githubUserID int64) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, github_user_id, github_login, email, display_name, avatar_url,
		        github_access_token, age_verified_at, role, status, totp_secret,
		        created_at, updated_at, deleted_at
		 FROM users WHERE github_user_id = $1 AND deleted_at IS NULL`, githubUserID)
	return scanUser(row)
}

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, github_user_id, github_login, email, display_name, avatar_url,
		        github_access_token, age_verified_at, role, status, totp_secret,
		        created_at, updated_at, deleted_at
		 FROM users WHERE email = $1 AND deleted_at IS NULL`, email)
	return scanUser(row)
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO users (github_user_id, github_login, email, display_name, avatar_url, github_access_token, role, status)
		 VALUES ($1, $2, $3, $4, $5, $6, 'user', 'active')
		 ON CONFLICT (github_user_id) DO UPDATE SET
		   github_login = EXCLUDED.github_login,
		   email = EXCLUDED.email,
		   display_name = EXCLUDED.display_name,
		   avatar_url = EXCLUDED.avatar_url,
		   github_access_token = EXCLUDED.github_access_token,
		   status = 'active',
		   deleted_at = NULL,
		   updated_at = now()
		 RETURNING
		 id, github_user_id, github_login, email, display_name, avatar_url,
		 github_access_token, age_verified_at, role, status, totp_secret,
		 created_at, updated_at, deleted_at`,
		arg.GithubUserID, arg.GithubLogin, arg.Email, arg.DisplayName, arg.AvatarURL, arg.GithubAccessToken)
	return scanUser(row)
}

func (q *Queries) UpdateUser(ctx context.Context, arg UpdateUserParams) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`UPDATE users SET github_login=$2, email=$3, display_name=$4, avatar_url=$5,
		 github_access_token=$6, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING
		 id, github_user_id, github_login, email, display_name, avatar_url,
		 github_access_token, age_verified_at, role, status, totp_secret,
		 created_at, updated_at, deleted_at`,
		arg.ID, arg.GithubLogin, arg.Email, arg.DisplayName, arg.AvatarURL, arg.GithubAccessToken)
	return scanUser(row)
}

func (q *Queries) UpdateUserAgeVerified(ctx context.Context, id uuid.UUID) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`UPDATE users SET age_verified_at=now(), updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING
		 id, github_user_id, github_login, email, display_name, avatar_url,
		 github_access_token, age_verified_at, role, status, totp_secret,
		 created_at, updated_at, deleted_at`, id)
	return scanUser(row)
}

func (q *Queries) UpdateUserStatus(ctx context.Context, arg UpdateUserStatusParams) (*User, error) {
	row := q.pool.QueryRow(ctx,
		`UPDATE users SET status=$2, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING
		 id, github_user_id, github_login, email, display_name, avatar_url,
		 github_access_token, age_verified_at, role, status, totp_secret,
		 created_at, updated_at, deleted_at`,
		arg.ID, arg.Status)
	return scanUser(row)
}

func (q *Queries) SoftDeleteUser(ctx context.Context, id uuid.UUID) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE users SET deleted_at=now(), status='deleted', updated_at=now() WHERE id=$1`, id)
	return err
}

// ---- Terms ----

func (q *Queries) GetCurrentTermsVersion(ctx context.Context) (*TermsVersion, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, version, content, content_hash, checkpoint_items, published_at, is_current,
		        created_at, updated_at, deleted_at
		 FROM terms_versions WHERE is_current=true AND deleted_at IS NULL LIMIT 1`)
	return scanTermsVersion(row)
}

func (q *Queries) GetTermsVersionByID(ctx context.Context, id uuid.UUID) (*TermsVersion, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, version, content, content_hash, checkpoint_items, published_at, is_current,
		        created_at, updated_at, deleted_at
		 FROM terms_versions WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanTermsVersion(row)
}

func (q *Queries) GetUserAgreement(ctx context.Context, arg GetUserAgreementParams) (*UserAgreement, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, terms_version_id, checkbox_states, ip_address::text, user_agent,
		        agreed_at, previous_hash, signature_hash, created_at, updated_at, deleted_at
		 FROM user_agreements WHERE user_id=$1 AND terms_version_id=$2 AND deleted_at IS NULL`,
		arg.UserID, arg.TermsVersionID)
	return scanUserAgreement(row)
}

func (q *Queries) GetLatestUserAgreement(ctx context.Context, userID uuid.UUID) (*UserAgreement, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, terms_version_id, checkbox_states, ip_address::text, user_agent,
		        agreed_at, previous_hash, signature_hash, created_at, updated_at, deleted_at
		 FROM user_agreements WHERE user_id=$1 AND deleted_at IS NULL
		 ORDER BY agreed_at DESC LIMIT 1`, userID)
	return scanUserAgreement(row)
}

func (q *Queries) CreateUserAgreement(ctx context.Context, arg CreateUserAgreementParams) (*UserAgreement, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO user_agreements (user_id, terms_version_id, checkbox_states, ip_address,
		 user_agent, agreed_at, previous_hash, signature_hash)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING
		 id, user_id, terms_version_id, checkbox_states, ip_address::text, user_agent,
		 agreed_at, previous_hash, signature_hash, created_at, updated_at, deleted_at`,
		arg.UserID, arg.TermsVersionID, arg.CheckboxStates, arg.IPAddress.String(),
		arg.UserAgent, arg.AgreedAt, arg.PreviousHash, arg.SignatureHash)
	return scanUserAgreement(row)
}

func (q *Queries) ListUserAgreementsByUserID(ctx context.Context, userID uuid.UUID) ([]*UserAgreement, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, terms_version_id, checkbox_states, ip_address::text, user_agent,
		        agreed_at, previous_hash, signature_hash, created_at, updated_at, deleted_at
		 FROM user_agreements WHERE user_id=$1 AND deleted_at IS NULL ORDER BY agreed_at ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*UserAgreement
	for rows.Next() {
		a, err := scanUserAgreement(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (q *Queries) ListAllAgreementsForIntegrityCheck(ctx context.Context) ([]*UserAgreement, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, terms_version_id, checkbox_states, ip_address::text, user_agent,
		        agreed_at, previous_hash, signature_hash, created_at, updated_at, deleted_at
		 FROM user_agreements WHERE deleted_at IS NULL ORDER BY agreed_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*UserAgreement
	for rows.Next() {
		a, err := scanUserAgreement(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

// ---- Stripe ----

func (q *Queries) GetStripeCustomerByUserID(ctx context.Context, userID uuid.UUID) (*StripeCustomer, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, stripe_customer_id, default_payment_method_id,
		        created_at, updated_at, deleted_at
		 FROM stripe_customers WHERE user_id=$1 AND deleted_at IS NULL`, userID)
	var sc StripeCustomer
	err := row.Scan(&sc.ID, &sc.UserID, &sc.StripeCustomerID, &sc.DefaultPaymentMethodID,
		&sc.CreatedAt, &sc.UpdatedAt, &sc.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &sc, nil
}

func (q *Queries) CreateStripeCustomer(ctx context.Context, arg CreateStripeCustomerParams) (*StripeCustomer, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO stripe_customers (user_id, stripe_customer_id, default_payment_method_id)
		 VALUES ($1, $2, $3) RETURNING
		 id, user_id, stripe_customer_id, default_payment_method_id, created_at, updated_at, deleted_at`,
		arg.UserID, arg.StripeCustomerID, arg.DefaultPaymentMethodID)
	var sc StripeCustomer
	err := row.Scan(&sc.ID, &sc.UserID, &sc.StripeCustomerID, &sc.DefaultPaymentMethodID,
		&sc.CreatedAt, &sc.UpdatedAt, &sc.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &sc, nil
}

func (q *Queries) UpdateStripeCustomerPaymentMethod(ctx context.Context, arg UpdateStripeCustomerPaymentMethodParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE stripe_customers SET default_payment_method_id=$2, updated_at=now() WHERE user_id=$1`,
		arg.UserID, arg.DefaultPaymentMethodID)
	return err
}

// ---- Challenges ----

func (q *Queries) CreateChallenge(ctx context.Context, arg CreateChallengeParams) (*Challenge, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO challenges (user_id, status, start_date, end_date, frequency_type, frequency_value,
		 min_lines_per_day, languages, challenge_amount, penalty_amount, terms_version_id, agreement_id)
		 VALUES ($1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING
		 id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		 min_lines_per_day, languages, challenge_amount, penalty_amount,
		 terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at`,
		arg.UserID, arg.StartDate, arg.EndDate, arg.FrequencyType, arg.FrequencyValue,
		arg.MinLinesPerDay, arg.Languages, arg.ChallengeAmount, arg.PenaltyAmount,
		arg.TermsVersionID, arg.AgreementID)
	return scanChallenge(row)
}

func (q *Queries) GetChallengeByID(ctx context.Context, id uuid.UUID) (*Challenge, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		        min_lines_per_day, languages, challenge_amount, penalty_amount,
		        terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at
		 FROM challenges WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanChallenge(row)
}

func (q *Queries) GetActiveChallengeByUserID(ctx context.Context, userID uuid.UUID) (*Challenge, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		        min_lines_per_day, languages, challenge_amount, penalty_amount,
		        terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at
		 FROM challenges WHERE user_id=$1 AND status='active' AND deleted_at IS NULL LIMIT 1`, userID)
	return scanChallenge(row)
}

func (q *Queries) ListChallengesByUserID(ctx context.Context, userID uuid.UUID) ([]*Challenge, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		        min_lines_per_day, languages, challenge_amount, penalty_amount,
		        terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at
		 FROM challenges WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Challenge
	for rows.Next() {
		c, err := scanChallenge(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (q *Queries) UpdateChallengeStatus(ctx context.Context, arg UpdateChallengeStatusParams) (*Challenge, error) {
	row := q.pool.QueryRow(ctx,
		`UPDATE challenges SET status=$2, completed_at=$3, failed_at=$4, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING
		 id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		 min_lines_per_day, languages, challenge_amount, penalty_amount,
		 terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at`,
		arg.ID, arg.Status, arg.CompletedAt, arg.FailedAt)
	return scanChallenge(row)
}

func (q *Queries) ListActiveChallengesToJudge(ctx context.Context) ([]*Challenge, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, status, start_date, end_date, frequency_type, frequency_value,
		        min_lines_per_day, languages, challenge_amount, penalty_amount,
		        terms_version_id, agreement_id, completed_at, failed_at, created_at, updated_at, deleted_at
		 FROM challenges WHERE status='active' AND end_date < CURRENT_DATE AND deleted_at IS NULL`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Challenge
	for rows.Next() {
		c, err := scanChallenge(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (q *Queries) SoftDeleteChallenge(ctx context.Context, id uuid.UUID) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE challenges SET deleted_at=now(), status='cancelled', updated_at=now() WHERE id=$1`, id)
	return err
}

func (q *Queries) CreateChallengeRepository(ctx context.Context, arg CreateChallengeRepositoryParams) (*ChallengeRepository, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO challenge_repositories (challenge_id, github_repo_id, full_name, webhook_secret)
		 VALUES ($1, $2, $3, $4) RETURNING
		 id, challenge_id, github_repo_id, full_name, webhook_id, webhook_secret,
		 created_at, updated_at, deleted_at`,
		arg.ChallengeID, arg.GithubRepoID, arg.FullName, arg.WebhookSecret)
	return scanChallengeRepo(row)
}

func (q *Queries) UpdateChallengeRepositoryWebhook(ctx context.Context, arg UpdateChallengeRepositoryWebhookParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE challenge_repositories SET webhook_id=$2, updated_at=now() WHERE id=$1`,
		arg.ID, arg.WebhookID)
	return err
}

func (q *Queries) ListRepositoriesByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*ChallengeRepository, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, challenge_id, github_repo_id, full_name, webhook_id, webhook_secret,
		        created_at, updated_at, deleted_at
		 FROM challenge_repositories WHERE challenge_id=$1 AND deleted_at IS NULL`, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*ChallengeRepository
	for rows.Next() {
		r, err := scanChallengeRepo(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, r)
	}
	return result, rows.Err()
}

func (q *Queries) GetRepositoryByGitHubIDAndChallenge(ctx context.Context, githubRepoID int64) (*ChallengeRepository, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT cr.id, cr.challenge_id, cr.github_repo_id, cr.full_name, cr.webhook_id, cr.webhook_secret,
		        cr.created_at, cr.updated_at, cr.deleted_at
		 FROM challenge_repositories cr
		 JOIN challenges c ON c.id = cr.challenge_id
		 WHERE cr.github_repo_id=$1 AND c.status='active' AND cr.deleted_at IS NULL AND c.deleted_at IS NULL`,
		githubRepoID)
	return scanChallengeRepo(row)
}

// ---- Commits ----

func (q *Queries) CreateRawCommit(ctx context.Context, arg CreateRawCommitParams) (*RawCommit, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO raw_commits (challenge_id, repository_id, commit_sha, author_email,
		 committed_at, message, additions, deletions, files_changed, diff_content, raw_payload)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING
		 id, challenge_id, repository_id, commit_sha, author_email, committed_at, message,
		 additions, deletions, files_changed, diff_content, raw_payload, created_at, updated_at, deleted_at`,
		arg.ChallengeID, arg.RepositoryID, arg.CommitSha, arg.AuthorEmail,
		arg.CommittedAt, arg.Message, arg.Additions, arg.Deletions,
		arg.FilesChanged, arg.DiffContent, arg.RawPayload)
	return scanRawCommit(row)
}

func (q *Queries) GetRawCommitByID(ctx context.Context, id uuid.UUID) (*RawCommit, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, challenge_id, repository_id, commit_sha, author_email, committed_at, message,
		        additions, deletions, files_changed, diff_content, raw_payload, created_at, updated_at, deleted_at
		 FROM raw_commits WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanRawCommit(row)
}

func (q *Queries) GetRawCommitBySHA(ctx context.Context, arg GetRawCommitBySHAParams) (*RawCommit, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, challenge_id, repository_id, commit_sha, author_email, committed_at, message,
		        additions, deletions, files_changed, diff_content, raw_payload, created_at, updated_at, deleted_at
		 FROM raw_commits WHERE challenge_id=$1 AND commit_sha=$2 AND deleted_at IS NULL`,
		arg.ChallengeID, arg.CommitSha)
	return scanRawCommit(row)
}

func (q *Queries) ListRawCommitsByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*ListRawCommitsByChallengeIDRow, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT rc.id, rc.challenge_id, rc.repository_id, rc.commit_sha, rc.author_email,
		        rc.committed_at, rc.message, rc.additions, rc.deletions, rc.files_changed,
		        rc.diff_content, rc.raw_payload, rc.created_at, rc.updated_at, rc.deleted_at,
		        cv.status as validation_status, cv.reason_codes
		 FROM raw_commits rc
		 LEFT JOIN commit_validations cv ON cv.raw_commit_id = rc.id
		 WHERE rc.challenge_id=$1 AND rc.deleted_at IS NULL
		 ORDER BY rc.committed_at DESC`, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*ListRawCommitsByChallengeIDRow
	for rows.Next() {
		var r ListRawCommitsByChallengeIDRow
		err := rows.Scan(
			&r.ID, &r.ChallengeID, &r.RepositoryID, &r.CommitSha, &r.AuthorEmail,
			&r.CommittedAt, &r.Message, &r.Additions, &r.Deletions, &r.FilesChanged,
			&r.DiffContent, &r.RawPayload, &r.CreatedAt, &r.UpdatedAt, &r.DeletedAt,
			&r.ValidationStatus, &r.ReasonCodes,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, &r)
	}
	return result, rows.Err()
}

func (q *Queries) ListUnvalidatedCommits(ctx context.Context) ([]*RawCommit, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT rc.id, rc.challenge_id, rc.repository_id, rc.commit_sha, rc.author_email,
		        rc.committed_at, rc.message, rc.additions, rc.deletions, rc.files_changed,
		        rc.diff_content, rc.raw_payload, rc.created_at, rc.updated_at, rc.deleted_at
		 FROM raw_commits rc
		 LEFT JOIN commit_validations cv ON cv.raw_commit_id = rc.id
		 WHERE cv.id IS NULL AND rc.deleted_at IS NULL
		 ORDER BY rc.committed_at ASC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*RawCommit
	for rows.Next() {
		c, err := scanRawCommit(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (q *Queries) CreateCommitValidation(ctx context.Context, arg CreateCommitValidationParams) (*CommitValidation, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO commit_validations (raw_commit_id, status, reason_codes, details, validated_at, validator_version)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING
		 id, raw_commit_id, status, reason_codes, details, validated_at, validator_version,
		 created_at, updated_at, deleted_at`,
		arg.RawCommitID, arg.Status, arg.ReasonCodes, arg.Details, arg.ValidatedAt, arg.ValidatorVersion)
	var cv CommitValidation
	err := row.Scan(&cv.ID, &cv.RawCommitID, &cv.Status, &cv.ReasonCodes, &cv.Details,
		&cv.ValidatedAt, &cv.ValidatorVersion, &cv.CreatedAt, &cv.UpdatedAt, &cv.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &cv, nil
}

func (q *Queries) GetCommitValidationByCommitID(ctx context.Context, rawCommitID uuid.UUID) (*CommitValidation, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, raw_commit_id, status, reason_codes, details, validated_at, validator_version,
		        created_at, updated_at, deleted_at
		 FROM commit_validations WHERE raw_commit_id=$1`, rawCommitID)
	var cv CommitValidation
	err := row.Scan(&cv.ID, &cv.RawCommitID, &cv.Status, &cv.ReasonCodes, &cv.Details,
		&cv.ValidatedAt, &cv.ValidatorVersion, &cv.CreatedAt, &cv.UpdatedAt, &cv.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &cv, nil
}

func (q *Queries) UpsertDailyProgress(ctx context.Context, arg UpsertDailyProgressParams) (*DailyProgress, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO daily_progress (challenge_id, date, valid_commit_count, suspicious_commit_count, is_achieved, total_lines_added)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (challenge_id, date) DO UPDATE SET
		   valid_commit_count=EXCLUDED.valid_commit_count,
		   suspicious_commit_count=EXCLUDED.suspicious_commit_count,
		   is_achieved=EXCLUDED.is_achieved,
		   total_lines_added=EXCLUDED.total_lines_added,
		   updated_at=now()
		 RETURNING id, challenge_id, date, valid_commit_count, suspicious_commit_count,
		           is_achieved, total_lines_added, created_at, updated_at, deleted_at`,
		arg.ChallengeID, arg.Date, arg.ValidCommitCount, arg.SuspiciousCommitCount,
		arg.IsAchieved, arg.TotalLinesAdded)
	return scanDailyProgress(row)
}

func (q *Queries) ListDailyProgressByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*DailyProgress, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, challenge_id, date, valid_commit_count, suspicious_commit_count,
		        is_achieved, total_lines_added, created_at, updated_at, deleted_at
		 FROM daily_progress WHERE challenge_id=$1 AND deleted_at IS NULL ORDER BY date ASC`, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*DailyProgress
	for rows.Next() {
		dp, err := scanDailyProgress(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, dp)
	}
	return result, rows.Err()
}

func (q *Queries) CountAchievedDays(ctx context.Context, challengeID uuid.UUID) (int64, error) {
	var count int64
	err := q.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM daily_progress WHERE challenge_id=$1 AND is_achieved=true AND deleted_at IS NULL`,
		challengeID).Scan(&count)
	return count, err
}

func (q *Queries) GetRecentCommittedAts(ctx context.Context, arg GetRecentCommittedAtsParams) ([]time.Time, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT rc.committed_at FROM raw_commits rc
		 JOIN commit_validations cv ON cv.raw_commit_id = rc.id
		 WHERE rc.challenge_id=$1 AND cv.status='valid' AND rc.committed_at>$2 AND rc.deleted_at IS NULL
		 ORDER BY rc.committed_at DESC`,
		arg.ChallengeID, arg.Since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []time.Time
	for rows.Next() {
		var t time.Time
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

// ---- Payments ----

func (q *Queries) CreatePayment(ctx context.Context, arg CreatePaymentParams) (*Payment, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO payments (user_id, challenge_id, payment_type, amount, status, scheduled_at)
		 VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING
		 id, user_id, challenge_id, payment_type, amount, status, stripe_payment_intent_id,
		 scheduled_at, pre_notified_at, paid_at, failure_reason, receipt_url,
		 created_at, updated_at, deleted_at`,
		arg.UserID, arg.ChallengeID, arg.PaymentType, arg.Amount, arg.ScheduledAt)
	return scanPayment(row)
}

func (q *Queries) GetPaymentByID(ctx context.Context, id uuid.UUID) (*Payment, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, challenge_id, payment_type, amount, status, stripe_payment_intent_id,
		        scheduled_at, pre_notified_at, paid_at, failure_reason, receipt_url,
		        created_at, updated_at, deleted_at
		 FROM payments WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanPayment(row)
}

func (q *Queries) UpdatePaymentStatus(ctx context.Context, arg UpdatePaymentStatusParams) (*Payment, error) {
	row := q.pool.QueryRow(ctx,
		`UPDATE payments SET status=$2, stripe_payment_intent_id=$3, paid_at=$4,
		 failure_reason=$5, receipt_url=$6, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL RETURNING
		 id, user_id, challenge_id, payment_type, amount, status, stripe_payment_intent_id,
		 scheduled_at, pre_notified_at, paid_at, failure_reason, receipt_url,
		 created_at, updated_at, deleted_at`,
		arg.ID, arg.Status, arg.StripePaymentIntentID, arg.PaidAt, arg.FailureReason, arg.ReceiptURL)
	return scanPayment(row)
}

func (q *Queries) UpdatePaymentPreNotified(ctx context.Context, id uuid.UUID) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE payments SET pre_notified_at=now(), updated_at=now() WHERE id=$1`, id)
	return err
}

func (q *Queries) ListPendingPaymentsToProcess(ctx context.Context) ([]*Payment, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, challenge_id, payment_type, amount, status, stripe_payment_intent_id,
		        scheduled_at, pre_notified_at, paid_at, failure_reason, receipt_url,
		        created_at, updated_at, deleted_at
		 FROM payments WHERE status='pending' AND scheduled_at<=now() AND deleted_at IS NULL
		 ORDER BY scheduled_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Payment
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (q *Queries) ListPaymentsByChallengeID(ctx context.Context, challengeID uuid.UUID) ([]*Payment, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, challenge_id, payment_type, amount, status, stripe_payment_intent_id,
		        scheduled_at, pre_notified_at, paid_at, failure_reason, receipt_url,
		        created_at, updated_at, deleted_at
		 FROM payments WHERE challenge_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Payment
	for rows.Next() {
		p, err := scanPayment(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (q *Queries) CreatePaymentAttempt(ctx context.Context, arg CreatePaymentAttemptParams) (*PaymentAttempt, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO payment_attempts (payment_id, attempt_number, status, stripe_response, error_code, next_retry_at, attempted_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING
		 id, payment_id, attempt_number, status, stripe_response, error_code, next_retry_at, attempted_at,
		 created_at, updated_at, deleted_at`,
		arg.PaymentID, arg.AttemptNumber, arg.Status, arg.StripeResponse,
		arg.ErrorCode, arg.NextRetryAt, arg.AttemptedAt)
	var pa PaymentAttempt
	err := row.Scan(&pa.ID, &pa.PaymentID, &pa.AttemptNumber, &pa.Status, &pa.StripeResponse,
		&pa.ErrorCode, &pa.NextRetryAt, &pa.AttemptedAt, &pa.CreatedAt, &pa.UpdatedAt, &pa.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &pa, nil
}

func (q *Queries) GetLastPaymentAttempt(ctx context.Context, paymentID uuid.UUID) (*PaymentAttempt, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, payment_id, attempt_number, status, stripe_response, error_code, next_retry_at, attempted_at,
		        created_at, updated_at, deleted_at
		 FROM payment_attempts WHERE payment_id=$1 ORDER BY attempt_number DESC LIMIT 1`, paymentID)
	var pa PaymentAttempt
	err := row.Scan(&pa.ID, &pa.PaymentID, &pa.AttemptNumber, &pa.Status, &pa.StripeResponse,
		&pa.ErrorCode, &pa.NextRetryAt, &pa.AttemptedAt, &pa.CreatedAt, &pa.UpdatedAt, &pa.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &pa, nil
}

func (q *Queries) CountPaymentAttempts(ctx context.Context, paymentID uuid.UUID) (int64, error) {
	var count int64
	err := q.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM payment_attempts WHERE payment_id=$1`, paymentID).Scan(&count)
	return count, err
}

// ---- Notifications ----

func (q *Queries) CreateNotification(ctx context.Context, arg CreateNotificationParams) (*Notification, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO notifications (user_id, type, title, body, action_url)
		 VALUES ($1, $2, $3, $4, $5) RETURNING
		 id, user_id, type, title, body, action_url, read_at, email_sent_at, created_at, updated_at, deleted_at`,
		arg.UserID, arg.Type, arg.Title, arg.Body, arg.ActionURL)
	return scanNotification(row)
}

func (q *Queries) ListNotificationsByUserID(ctx context.Context, userID uuid.UUID) ([]*Notification, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, type, title, body, action_url, read_at, email_sent_at, created_at, updated_at, deleted_at
		 FROM notifications WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Notification
	for rows.Next() {
		n, err := scanNotification(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, n)
	}
	return result, rows.Err()
}

func (q *Queries) MarkNotificationRead(ctx context.Context, arg MarkNotificationReadParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE notifications SET read_at=now(), updated_at=now() WHERE id=$1 AND user_id=$2`,
		arg.ID, arg.UserID)
	return err
}

func (q *Queries) MarkNotificationEmailSent(ctx context.Context, id uuid.UUID) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE notifications SET email_sent_at=now(), updated_at=now() WHERE id=$1`, id)
	return err
}

func (q *Queries) CountUnreadNotifications(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := q.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read_at IS NULL AND deleted_at IS NULL`,
		userID).Scan(&count)
	return count, err
}

// ---- Reviews ----

func (q *Queries) CreateSuspiciousReview(ctx context.Context, arg CreateSuspiciousReviewParams) (*SuspiciousReview, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO suspicious_reviews (raw_commit_id, status, suspicion_reasons)
		 VALUES ($1, 'pending', $2) RETURNING
		 id, raw_commit_id, status, reviewer_id, suspicion_reasons, contacted_at,
		 user_response, responded_at, final_decision, decided_at, created_at, updated_at, deleted_at`,
		arg.RawCommitID, arg.SuspicionReasons)
	return scanSuspiciousReview(row)
}

func (q *Queries) GetSuspiciousReviewByID(ctx context.Context, id uuid.UUID) (*SuspiciousReview, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, raw_commit_id, status, reviewer_id, suspicion_reasons, contacted_at,
		        user_response, responded_at, final_decision, decided_at, created_at, updated_at, deleted_at
		 FROM suspicious_reviews WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanSuspiciousReview(row)
}

func (q *Queries) UpdateSuspiciousReviewContacted(ctx context.Context, id uuid.UUID) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE suspicious_reviews SET status='contacted', contacted_at=now(), updated_at=now() WHERE id=$1`, id)
	return err
}

func (q *Queries) UpdateSuspiciousReviewResponse(ctx context.Context, arg UpdateSuspiciousReviewResponseParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE suspicious_reviews SET status='responded', user_response=$2, responded_at=now(), updated_at=now() WHERE id=$1`,
		arg.ID, arg.UserResponse)
	return err
}

func (q *Queries) UpdateSuspiciousReviewDecision(ctx context.Context, arg UpdateSuspiciousReviewDecisionParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE suspicious_reviews SET status=$2, final_decision=$3, reviewer_id=$4, decided_at=now(), updated_at=now() WHERE id=$1`,
		arg.ID, arg.Status, arg.FinalDecision, arg.ReviewerID)
	return err
}

func (q *Queries) ListPendingSuspiciousReviews(ctx context.Context) ([]*ListPendingSuspiciousReviewsRow, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT sr.id, sr.raw_commit_id, sr.status, sr.reviewer_id, sr.suspicion_reasons,
		        sr.contacted_at, sr.user_response, sr.responded_at, sr.final_decision, sr.decided_at,
		        sr.created_at, sr.updated_at, sr.deleted_at,
		        rc.commit_sha, rc.challenge_id
		 FROM suspicious_reviews sr
		 JOIN raw_commits rc ON rc.id = sr.raw_commit_id
		 WHERE sr.status='pending' AND sr.deleted_at IS NULL ORDER BY sr.created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*ListPendingSuspiciousReviewsRow
	for rows.Next() {
		var r ListPendingSuspiciousReviewsRow
		err := rows.Scan(
			&r.ID, &r.RawCommitID, &r.Status, &r.ReviewerID, &r.SuspicionReasons,
			&r.ContactedAt, &r.UserResponse, &r.RespondedAt, &r.FinalDecision, &r.DecidedAt,
			&r.CreatedAt, &r.UpdatedAt, &r.DeletedAt,
			&r.CommitSha, &r.ChallengeID,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, &r)
	}
	return result, rows.Err()
}

func (q *Queries) ListExpiredSuspiciousReviews(ctx context.Context) ([]*SuspiciousReview, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, raw_commit_id, status, reviewer_id, suspicion_reasons, contacted_at,
		        user_response, responded_at, final_decision, decided_at, created_at, updated_at, deleted_at
		 FROM suspicious_reviews
		 WHERE status='contacted' AND contacted_at + INTERVAL '7 days' <= now() AND deleted_at IS NULL`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*SuspiciousReview
	for rows.Next() {
		sr, err := scanSuspiciousReview(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, sr)
	}
	return result, rows.Err()
}

func (q *Queries) CreateAppeal(ctx context.Context, arg CreateAppealParams) (*Appeal, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO appeals (user_id, target_type, target_id, reason, status)
		 VALUES ($1, $2, $3, $4, 'submitted') RETURNING
		 id, user_id, target_type, target_id, reason, status, reviewer_id,
		 decision_reason, decided_at, created_at, updated_at, deleted_at`,
		arg.UserID, arg.TargetType, arg.TargetID, arg.Reason)
	return scanAppeal(row)
}

func (q *Queries) GetAppealByID(ctx context.Context, id uuid.UUID) (*Appeal, error) {
	row := q.pool.QueryRow(ctx,
		`SELECT id, user_id, target_type, target_id, reason, status, reviewer_id,
		        decision_reason, decided_at, created_at, updated_at, deleted_at
		 FROM appeals WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanAppeal(row)
}

func (q *Queries) UpdateAppealStatus(ctx context.Context, arg UpdateAppealStatusParams) error {
	_, err := q.pool.Exec(ctx,
		`UPDATE appeals SET status=$2, reviewer_id=$3, decision_reason=$4, decided_at=$5, updated_at=now() WHERE id=$1`,
		arg.ID, arg.Status, arg.ReviewerID, arg.DecisionReason, arg.DecidedAt)
	return err
}

func (q *Queries) ListAppealsByUserID(ctx context.Context, userID uuid.UUID) ([]*Appeal, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, user_id, target_type, target_id, reason, status, reviewer_id,
		        decision_reason, decided_at, created_at, updated_at, deleted_at
		 FROM appeals WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*Appeal
	for rows.Next() {
		a, err := scanAppeal(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

// ---- Audit ----

func (q *Queries) CreateAuditLog(ctx context.Context, arg CreateAuditLogParams) (*AuditLog, error) {
	row := q.pool.QueryRow(ctx,
		`INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, payload, ip_address, user_agent)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING
		 id, actor_id, actor_type, action, target_type, target_id, payload, ip_address::text, user_agent, occurred_at`,
		arg.ActorID, arg.ActorType, arg.Action, arg.TargetType, arg.TargetID,
		arg.Payload, ipToString(arg.IPAddress), arg.UserAgent)
	var al AuditLog
	var ip string
	err := row.Scan(&al.ID, &al.ActorID, &al.ActorType, &al.Action, &al.TargetType, &al.TargetID,
		&al.Payload, &ip, &al.UserAgent, &al.OccurredAt)
	if err != nil {
		return nil, err
	}
	al.IPAddress = net.ParseIP(ip)
	return &al, nil
}

func (q *Queries) ListAuditLogsByActorID(ctx context.Context, actorID uuid.UUID) ([]*AuditLog, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, actor_id, actor_type, action, target_type, target_id, payload, ip_address::text, user_agent, occurred_at
		 FROM audit_logs WHERE actor_id=$1 ORDER BY occurred_at DESC LIMIT 100`, actorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAuditLogs(rows)
}

func (q *Queries) ListAuditLogsByTarget(ctx context.Context, arg ListAuditLogsByTargetParams) ([]*AuditLog, error) {
	rows, err := q.pool.Query(ctx,
		`SELECT id, actor_id, actor_type, action, target_type, target_id, payload, ip_address::text, user_agent, occurred_at
		 FROM audit_logs WHERE target_type=$1 AND target_id=$2 ORDER BY occurred_at DESC`,
		arg.TargetType, arg.TargetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAuditLogs(rows)
}
