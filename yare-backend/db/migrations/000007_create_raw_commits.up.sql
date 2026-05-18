CREATE TABLE raw_commits (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id    UUID        NOT NULL REFERENCES challenges(id),
    repository_id   UUID        NOT NULL REFERENCES challenge_repositories(id),
    commit_sha      VARCHAR(64) NOT NULL,
    author_email    VARCHAR(255),
    committed_at    TIMESTAMPTZ NOT NULL,
    message         TEXT        NOT NULL,
    additions       INT         NOT NULL DEFAULT 0,
    deletions       INT         NOT NULL DEFAULT 0,
    files_changed   JSONB       NOT NULL DEFAULT '[]',
    diff_content    TEXT,
    raw_payload     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_raw_commits_unique ON raw_commits (challenge_id, commit_sha);
CREATE INDEX idx_raw_commits_committed_at ON raw_commits (committed_at);
CREATE INDEX idx_raw_commits_challenge_id ON raw_commits (challenge_id);
