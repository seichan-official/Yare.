export interface User {
  id: string
  github_login: string
  email: string
  display_name?: string
  avatar_url?: string
  age_verified_at?: string
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'suspended' | 'deleted'
}

export interface AuthResponse {
  data: {
    access_token: string
    refresh_token: string
    expires_in: number
    user: {
      id: string
      github_login: string
      email: string
      is_first_login: boolean
      agreement_status: 'not_agreed' | 'agreed'
      payment_method_status: 'not_registered' | 'registered'
    }
  }
}

export interface Challenge {
  id: string
  user_id: string
  status: 'active' | 'completed' | 'failed' | 'cancelled' | 'under_review'
  start_date: string
  end_date: string
  frequency_type: 'daily' | 'weekly_n'
  frequency_value?: number
  min_lines_per_day: number
  languages: string[]
  challenge_amount: number
  penalty_amount: number
  completed_at?: string
  failed_at?: string
  created_at: string
}

export interface ChallengeRepository {
  id: string
  challenge_id: string
  github_repo_id: number
  full_name: string
  webhook_id?: number
}

export interface DailyProgress {
  id: string
  challenge_id: string
  date: string
  valid_commit_count: number
  suspicious_commit_count: number
  is_achieved: boolean
  total_lines_added: number
}

export interface RawCommit {
  id: string
  challenge_id: string
  commit_sha: string
  author_email?: string
  committed_at: string
  message: string
  additions: number
  deletions: number
  validation_status?: 'valid' | 'invalid' | 'suspicious'
  reason_codes?: string[]
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  action_url?: string
  read_at?: string
  created_at: string
}

export interface TermsVersion {
  id: string
  version: string
  content: string
  content_hash: string
  checkpoint_items: CheckpointItem[]
  published_at: string
  is_current: boolean
}

export interface CheckpointItem {
  id: number
  label: string
  required_scroll_anchor: string
}

export interface GitHubRepository {
  id: number
  full_name: string
  private: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
