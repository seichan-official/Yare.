CREATE TABLE challenge_repositories (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id    UUID        NOT NULL REFERENCES challenges(id),
    github_repo_id  BIGINT      NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    webhook_id      BIGINT,
    webhook_secret  TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_challenge_repos_challenge_id ON challenge_repositories (challenge_id);
CREATE INDEX idx_challenge_repos_github_repo_id ON challenge_repositories (github_repo_id);

COMMENT ON COLUMN challenge_repositories.webhook_secret IS 'AES-256-GCM暗号化済み';
