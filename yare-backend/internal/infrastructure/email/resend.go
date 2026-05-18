package email

import (
	"fmt"

	"github.com/resend/resend-go/v2"
)

type Client struct {
	client    *resend.Client
	fromEmail string
}

func NewClient(apiKey, fromEmail string) *Client {
	return &Client{
		client:    resend.NewClient(apiKey),
		fromEmail: fromEmail,
	}
}

type SendParams struct {
	To      string
	Subject string
	HTML    string
}

func (c *Client) Send(params SendParams) error {
	req := &resend.SendEmailRequest{
		From:    c.fromEmail,
		To:      []string{params.To},
		Subject: params.Subject,
		Html:    params.HTML,
	}
	_, err := c.client.Emails.Send(req)
	if err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	return nil
}

func (c *Client) SendPaymentPreNotification(to, challengeName string, amount int, scheduledDate string) error {
	html := fmt.Sprintf(`
<p>%s チャレンジの期限が近づいています。</p>
<p>達成できなかった場合、%d円が%sに引き落とされます。</p>
<p>引き続き頑張ってください！</p>
`, challengeName, amount, scheduledDate)
	return c.Send(SendParams{
		To:      to,
		Subject: "【Yare】チャレンジ期限のお知らせ",
		HTML:    html,
	})
}

func (c *Client) SendPaymentFailedNotification(to string, amount int) error {
	html := fmt.Sprintf(`
<p>決済処理が失敗しました。</p>
<p>金額: %d円</p>
<p>カード情報をご確認の上、再度お試しください。</p>
`, amount)
	return c.Send(SendParams{
		To:      to,
		Subject: "【Yare】決済失敗のお知らせ",
		HTML:    html,
	})
}

func (c *Client) SendSuspiciousCommitNotification(to, commitSHA string) error {
	html := fmt.Sprintf(`
<p>コミット %s について確認が必要です。</p>
<p>7日以内にダッシュボードから回答をお願いします。</p>
<p>回答がない場合、当該コミットは無効と判定される場合があります。</p>
`, commitSHA)
	return c.Send(SendParams{
		To:      to,
		Subject: "【Yare】コミット内容の確認依頼",
		HTML:    html,
	})
}

func (c *Client) SendChallengeFailedNotification(to string, amount int) error {
	html := fmt.Sprintf(`
<p>チャレンジが未達成となりました。</p>
<p>予定損害賠償金として%d円の請求を行います。</p>
<p>詳細はダッシュボードをご確認ください。</p>
`, amount)
	return c.Send(SendParams{
		To:      to,
		Subject: "【Yare】チャレンジ未達成のお知らせ",
		HTML:    html,
	})
}

func (c *Client) SendChallengeCompletedNotification(to string) error {
	html := `<p>おめでとうございます！チャレンジを達成しました。</p>
<p>引き続き学習を続けましょう！</p>`
	return c.Send(SendParams{
		To:      to,
		Subject: "【Yare】チャレンジ達成おめでとうございます！",
		HTML:    html,
	})
}
