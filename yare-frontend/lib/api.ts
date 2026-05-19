const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private getHeaders(token?: string): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...this.getHeaders(token), ...options.headers },
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  }

  // Auth
  async githubCallback(code: string) {
    return this.request<{ data: { access_token: string; refresh_token: string; expires_in: number; user: { id: string; github_login: string; email: string; is_first_login: boolean; age_verified: boolean; agreement_status: string; payment_method_status: string } } }>(
      '/api/v1/auth/github/callback',
      { method: 'POST', body: JSON.stringify({ code }) }
    )
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ data: { access_token: string; refresh_token: string; expires_in: number } }>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }
    )
  }

  // Terms
  async getCurrentTerms(token: string) {
    return this.request<{ data: import('./types').TermsVersion }>(
      '/api/v1/terms/current', {}, token
    )
  }

  // Agreement
  async createAgreement(token: string, termsVersionId: string, checkboxStates: Record<string, boolean>) {
    return this.request<{ data: { agreement_id: string; signature_hash: string; agreed_at: string } }>(
      '/api/v1/agreements',
      { method: 'POST', body: JSON.stringify({ terms_version_id: termsVersionId, checkbox_states: checkboxStates }) },
      token
    )
  }

  // Payment
  async createSetupIntent(token: string) {
    return this.request<{ data: { client_secret: string } }>(
      '/api/v1/payment/setup-intent',
      { method: 'POST' },
      token
    )
  }

  async savePaymentMethod(token: string, paymentMethodId: string) {
    return this.request<void>(
      '/api/v1/payment/method',
      { method: 'POST', body: JSON.stringify({ payment_method_id: paymentMethodId }) },
      token
    )
  }

  // Challenges
  async createChallenge(token: string, body: {
    repositories: { github_repo_id: number; full_name: string }[]
    languages: string[]
    start_date: string
    end_date: string
    frequency_type: string
    frequency_value?: number
    min_lines_per_day: number
    challenge_amount: number
  }) {
    return this.request<{ data: { challenge_id: string; status: string; penalty_amount: number } }>(
      '/api/v1/challenges',
      { method: 'POST', body: JSON.stringify(body) },
      token
    )
  }

  async listChallenges(token: string) {
    return this.request<{ data: import('./types').Challenge[] }>(
      '/api/v1/challenges', {}, token
    )
  }

  async getChallenge(token: string, id: string) {
    return this.request<{ data: { challenge: import('./types').Challenge; repositories: import('./types').ChallengeRepository[] } }>(
      `/api/v1/challenges/${id}`, {}, token
    )
  }

  async getChallengeProgress(token: string, id: string) {
    return this.request<{ data: import('./types').DailyProgress[] }>(
      `/api/v1/challenges/${id}/progress`, {}, token
    )
  }

  async getChallengeCommits(token: string, id: string) {
    return this.request<{ data: import('./types').RawCommit[] }>(
      `/api/v1/challenges/${id}/commits`, {}, token
    )
  }

  async cancelChallenge(token: string, id: string) {
    return this.request<void>(`/api/v1/challenges/${id}`, { method: 'DELETE' }, token)
  }

  // GitHub repos
  async listGitHubRepos(token: string) {
    return this.request<{ data: import('./types').GitHubRepository[] }>(
      '/api/v1/github/repositories', {}, token
    )
  }

  // Notifications
  async listNotifications(token: string) {
    return this.request<{ data: { notifications: import('./types').Notification[]; unread_count: number } }>(
      '/api/v1/notifications', {}, token
    )
  }

  async markNotificationRead(token: string, id: string) {
    return this.request<void>(
      `/api/v1/notifications/${id}/read`,
      { method: 'PUT' },
      token
    )
  }
}

export const api = new ApiClient()
