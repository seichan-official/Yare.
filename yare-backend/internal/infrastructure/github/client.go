package github

import (
	"context"
	"fmt"

	gogithub "github.com/google/go-github/v61/github"
	"golang.org/x/oauth2"
	githuboauth "golang.org/x/oauth2/github"
)

type Client struct {
	oauthConfig *oauth2.Config
}

type UserInfo struct {
	ID        int64
	Login     string
	Email     string
	Name      *string
	AvatarURL *string
}

type Repository struct {
	ID       int64  `json:"id"`
	FullName string `json:"full_name"`
	Private  bool   `json:"private"`
}

type CommitDetail struct {
	SHA         string
	Message     string
	AuthorEmail string
	AuthorName  string
	Additions   int
	Deletions   int
	Files       []CommitFile
}

type CommitFile struct {
	Filename  string
	Status    string
	Additions int
	Deletions int
	Patch     string
}

type WebhookConfig struct {
	ID     int64
	Secret string
}

func NewClient(clientID, clientSecret string) *Client {
	return &Client{
		oauthConfig: &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			Scopes:       []string{"read:user", "user:email", "public_repo"},
			Endpoint:     githuboauth.Endpoint,
		},
	}
}

func (c *Client) GetOAuthURL(state string) string {
	return c.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

func (c *Client) ExchangeCode(ctx context.Context, code string) (string, error) {
	token, err := c.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return "", fmt.Errorf("oauth exchange: %w", err)
	}
	return token.AccessToken, nil
}

func newGitHubClient(ctx context.Context, token string) *gogithub.Client {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
	tc := oauth2.NewClient(ctx, ts)
	return gogithub.NewClient(tc)
}

func (c *Client) GetUserInfo(ctx context.Context, token string) (*UserInfo, error) {
	gc := newGitHubClient(ctx, token)
	user, _, err := gc.Users.Get(ctx, "")
	if err != nil {
		return nil, fmt.Errorf("get github user: %w", err)
	}

	email := user.GetEmail()
	if email == "" {
		emails, _, err := gc.Users.ListEmails(ctx, nil)
		if err != nil {
			return nil, fmt.Errorf("list github emails: %w", err)
		}
		for _, e := range emails {
			if e.GetPrimary() && e.GetVerified() {
				email = e.GetEmail()
				break
			}
		}
	}
	if email == "" {
		return nil, fmt.Errorf("github account has no accessible email")
	}

	info := &UserInfo{
		ID:    user.GetID(),
		Login: user.GetLogin(),
		Email: email,
	}
	if n := user.GetName(); n != "" {
		info.Name = &n
	}
	if av := user.GetAvatarURL(); av != "" {
		info.AvatarURL = &av
	}
	return info, nil
}

func (c *Client) ListUserRepositories(ctx context.Context, token string) ([]*Repository, error) {
	gc := newGitHubClient(ctx, token)
	opt := &gogithub.RepositoryListByAuthenticatedUserOptions{
		ListOptions: gogithub.ListOptions{PerPage: 100},
	}
	repos, _, err := gc.Repositories.ListByAuthenticatedUser(ctx, opt)
	if err != nil {
		return nil, fmt.Errorf("list repos: %w", err)
	}
	result := make([]*Repository, 0, len(repos))
	for _, r := range repos {
		result = append(result, &Repository{
			ID:       r.GetID(),
			FullName: r.GetFullName(),
			Private:  r.GetPrivate(),
		})
	}
	return result, nil
}

func (c *Client) CheckRepoAccess(ctx context.Context, token, owner, repo string) error {
	gc := newGitHubClient(ctx, token)
	_, resp, err := gc.Repositories.Get(ctx, owner, repo)
	if err != nil {
		if resp != nil && resp.StatusCode == 404 {
			return fmt.Errorf("repository not found or no access")
		}
		return fmt.Errorf("check repo access: %w", err)
	}
	return nil
}

func (c *Client) GetCommit(ctx context.Context, token, owner, repo, sha string) (*CommitDetail, error) {
	gc := newGitHubClient(ctx, token)
	commit, _, err := gc.Repositories.GetCommit(ctx, owner, repo, sha, nil)
	if err != nil {
		return nil, fmt.Errorf("get commit %s: %w", sha, err)
	}

	detail := &CommitDetail{
		SHA:     commit.GetSHA(),
		Message: commit.GetCommit().GetMessage(),
	}
	if a := commit.GetCommit().GetAuthor(); a != nil {
		detail.AuthorEmail = a.GetEmail()
		detail.AuthorName = a.GetName()
	}
	if s := commit.GetStats(); s != nil {
		detail.Additions = s.GetAdditions()
		detail.Deletions = s.GetDeletions()
	}
	for _, f := range commit.Files {
		detail.Files = append(detail.Files, CommitFile{
			Filename:  f.GetFilename(),
			Status:    f.GetStatus(),
			Additions: f.GetAdditions(),
			Deletions: f.GetDeletions(),
			Patch:     f.GetPatch(),
		})
	}
	return detail, nil
}

func (c *Client) RegisterWebhook(ctx context.Context, token, owner, repo, callbackURL, secret string) (*WebhookConfig, error) {
	gc := newGitHubClient(ctx, token)
	hook := &gogithub.Hook{
		Events: []string{"push"},
		Config: &gogithub.HookConfig{
			URL:         gogithub.String(callbackURL),
			ContentType: gogithub.String("json"),
			Secret:      gogithub.String(secret),
		},
		Active: gogithub.Bool(true),
	}
	created, _, err := gc.Repositories.CreateHook(ctx, owner, repo, hook)
	if err != nil {
		return nil, fmt.Errorf("create webhook: %w", err)
	}
	return &WebhookConfig{
		ID:     created.GetID(),
		Secret: secret,
	}, nil
}

func (c *Client) DeleteWebhook(ctx context.Context, token, owner, repo string, hookID int64) error {
	gc := newGitHubClient(ctx, token)
	_, err := gc.Repositories.DeleteHook(ctx, owner, repo, hookID)
	return err
}
