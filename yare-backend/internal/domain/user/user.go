package user

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleUser       Role = "user"
	RoleAdmin      Role = "admin"
	RoleSuperAdmin Role = "super_admin"
)

type Status string

const (
	StatusActive    Status = "active"
	StatusSuspended Status = "suspended"
	StatusDeleted   Status = "deleted"
)

type User struct {
	ID                uuid.UUID
	GitHubUserID      int64
	GitHubLogin       string
	Email             string
	DisplayName       *string
	AvatarURL         *string
	GitHubAccessToken string
	AgeVerifiedAt     *time.Time
	Role              Role
	Status            Status
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (u *User) IsActive() bool {
	return u.Status == StatusActive
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin || u.Role == RoleSuperAdmin
}

func (u *User) HasAgreedToTerms() bool {
	return true
}

func (u *User) HasVerifiedAge() bool {
	return u.AgeVerifiedAt != nil
}
