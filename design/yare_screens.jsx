
import { useState } from "react";

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const T = {
  navy: "#0f0f1a",
  navy2: "#1a1a2e",
  indigo: "#4f46e5",
  indigo2: "#6366f1",
  indigoLight: "#e0e7ff",
  white: "#ffffff",
  gray50: "#f8f8f7",
  gray100: "#f0f0ee",
  gray200: "#e4e4e0",
  gray400: "#9d9d99",
  gray600: "#666662",
  gray800: "#222220",
  green: "#22c55e",
  greenBg: "#dcfce7",
  greenText: "#15803d",
  red: "#ef4444",
  redBg: "#fee2e2",
  redText: "#b91c1c",
  amber: "#f59e0b",
  amberBg: "#fef3c7",
  amberText: "#92400e",
};

const FONT = "'DM Sans', 'Hiragino Sans', sans-serif";
const MONO = "'DM Mono', 'Courier New', monospace";

// ─────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────
const Shell = ({ children, style }) => (
  <div style={{
    width: "100%", height: 680, background: T.gray50,
    fontFamily: FONT, fontSize: 13, color: T.gray800,
    display: "flex", overflow: "hidden",
    borderRadius: 12, border: `0.5px solid ${T.gray200}`,
    ...style
  }}>
    {children}
  </div>
);

const Sidebar = ({ active, onNav }) => {
  const items = [
    { id: "dashboard", icon: "⊞", label: "ダッシュボード" },
    { id: "challenge", icon: "🔥", label: "チャレンジ" },
    { id: "commits", icon: "◎", label: "コミット履歴" },
    { id: "notifications", icon: "🔔", label: "通知", badge: 3 },
    { id: "payment", icon: "💳", label: "支払い設定" },
    { id: "settings", icon: "⚙", label: "設定" },
  ];
  return (
    <aside style={{ width: 210, background: T.navy, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "18px 20px 14px", fontSize: 20, fontWeight: 600, color: T.white, letterSpacing: -0.5, borderBottom: `0.5px solid rgba(255,255,255,0.06)` }}>
        Yare<span style={{ color: T.indigo2 }}>.</span>
      </div>
      <div style={{ padding: "18px 12px 6px", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.3)" }}>メニュー</div>
      {items.map(it => (
        <div key={it.id} onClick={() => onNav(it.id)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 8, margin: "1px 8px",
          color: active === it.id ? "#818cf8" : "rgba(255,255,255,0.5)",
          background: active === it.id ? "rgba(99,102,241,0.2)" : "transparent",
          cursor: "pointer", fontSize: 13,
        }}>
          <span style={{ fontSize: 15 }}>{it.icon}</span>
          <span>{it.label}</span>
          {it.badge && (
            <span style={{ marginLeft: "auto", background: T.red, color: T.white, fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 99 }}>{it.badge}</span>
          )}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: `0.5px solid rgba(255,255,255,0.06)`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: T.white, flexShrink: 0 }}>YU</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>yamada_user</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>github.com/yamada</div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, actions }) => (
  <div style={{ height: 56, background: T.white, borderBottom: `0.5px solid ${T.gray200}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0 }}>
    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{title}</span>
    {actions}
  </div>
);

const Btn = ({ children, primary, small, onClick, danger, style }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: small ? "5px 12px" : "8px 16px",
    borderRadius: 8, fontSize: small ? 12 : 13, cursor: "pointer",
    fontFamily: FONT, fontWeight: primary ? 500 : 400,
    background: danger ? T.redBg : primary ? T.indigo : "transparent",
    color: danger ? T.redText : primary ? T.white : T.gray600,
    border: primary || danger ? "none" : `0.5px solid ${T.gray200}`,
    ...style
  }}>
    {children}
  </button>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.white, borderRadius: 12, border: `0.5px solid ${T.gray200}`, padding: 16, ...style }}>
    {children}
  </div>
);

const Badge = ({ children, type = "valid" }) => {
  const colors = {
    valid:   { bg: T.greenBg, color: T.greenText },
    invalid: { bg: T.redBg,   color: T.redText },
    susp:    { bg: T.amberBg, color: T.amberText },
    info:    { bg: T.indigoLight, color: T.indigo },
  };
  const c = colors[type] || colors.valid;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500, background: c.bg, color: c.color }}>
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────
// Screen 1: Landing Page
// ─────────────────────────────────────────────
const LandingScreen = ({ onNav }) => (
  <div style={{ width: "100%", height: 680, background: T.navy, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", borderRadius: 12 }}>
    {/* BG pattern */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 40%)", pointerEvents: "none" }} />

    {/* Nav */}
    <nav style={{ display: "flex", alignItems: "center", padding: "20px 48px", zIndex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.white, letterSpacing: -1 }}>Yare<span style={{ color: T.indigo2 }}>.</span></div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <Btn small>ログイン</Btn>
        <Btn small primary onClick={() => onNav("consent")}>無料で始める →</Btn>
      </div>
    </nav>

    {/* Hero */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1, padding: "0 48px", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.15)", border: `0.5px solid rgba(99,102,241,0.3)`, borderRadius: 99, padding: "6px 16px", marginBottom: 24 }}>
        <span style={{ fontSize: 12, color: "#818cf8" }}>🔥 三日坊主を、お金で封じ込める</span>
      </div>

      <h1 style={{ fontSize: 52, fontWeight: 700, color: T.white, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16, maxWidth: 560 }}>
        学習を続けなければ、<span style={{ color: T.indigo2 }}>お金が消える。</span>
      </h1>

      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36, maxWidth: 420, lineHeight: 1.7 }}>
        GitHubのコミットで学習を証明。達成できなければ自分で設定した金額が引き落とされる。損失回避バイアスを使った、新しい学習継続サービス。
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn primary onClick={() => onNav("signup")} style={{ padding: "12px 28px", fontSize: 14 }}>GitHubで無料登録 →</Btn>
        <Btn style={{ padding: "12px 28px", fontSize: 14, color: "rgba(255,255,255,0.6)", border: "0.5px solid rgba(255,255,255,0.15)" }}>仕組みを見る</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 40, marginTop: 52, paddingTop: 32, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
        {[["2,847", "登録ユーザー"], ["91%", "チャレンジ達成率"], ["¥0", "払った人の割合（達成者）"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.white }}>{v}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Screen 2: Sign Up / GitHub OAuth
// ─────────────────────────────────────────────
const SignupScreen = ({ onNav }) => (
  <Shell style={{ alignItems: "center", justifyContent: "center", background: T.gray50 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: 400, width: "100%", padding: "0 24px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Yare<span style={{ color: T.indigo }}>.</span></div>

      <Card style={{ width: "100%", padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>アカウントを作成</div>
          <div style={{ fontSize: 13, color: T.gray400, lineHeight: 1.6 }}>GitHubアカウントで登録します。<br />コミット履歴を取得するために必要です。</div>
        </div>

        <button onClick={() => onNav("age")} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          width: "100%", padding: "13px 20px", borderRadius: 10,
          background: T.navy, color: T.white, border: "none",
          fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHubでサインアップ
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 0.5, background: T.gray200 }} />
          <span style={{ fontSize: 12, color: T.gray400 }}>取得する権限</span>
          <div style={{ flex: 1, height: 0.5, background: T.gray200 }} />
        </div>

        {[
          ["read:user", "プロフィール情報の読み取り"],
          ["user:email", "メールアドレスの取得"],
          ["public_repo", "パブリックリポジトリのコミット取得"],
        ].map(([scope, desc]) => (
          <div key={scope} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: T.indigo, background: T.indigoLight, padding: "2px 6px", borderRadius: 4 }}>{scope}</span>
            <span style={{ fontSize: 12, color: T.gray400 }}>{desc}</span>
          </div>
        ))}
      </Card>

      <p style={{ fontSize: 11, color: T.gray400, textAlign: "center", lineHeight: 1.6 }}>
        登録することで<span style={{ color: T.indigo, cursor: "pointer" }}>利用規約</span>および<span style={{ color: T.indigo, cursor: "pointer" }}>プライバシーポリシー</span>に同意したものとみなされます。
      </p>
    </div>
  </Shell>
);

// ─────────────────────────────────────────────
// Screen 3: Age Verification
// ─────────────────────────────────────────────
const AgeScreen = ({ onNav }) => (
  <Shell style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ maxWidth: 400, width: "100%", padding: "0 24px", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: T.amberBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⚠️</div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>年齢確認</div>
        <div style={{ fontSize: 13, color: T.gray400, lineHeight: 1.7 }}>
          Yareは金銭の授受を伴うサービスです。<br />ご利用には<strong>18歳以上</strong>であることが必要です。
        </div>
      </div>

      <Card style={{ width: "100%", padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>生年月日を入力してください</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["年", "1990", 70], ["月", "1", 50], ["日", "1", 50]].map(([label, placeholder, w]) => (
            <div key={label} style={{ flex: w }}>
              <div style={{ fontSize: 10, color: T.gray400, marginBottom: 4 }}>{label}</div>
              <input defaultValue={placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `0.5px solid ${T.gray200}`, fontFamily: FONT, fontSize: 13, outline: "none" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: T.amberBg, borderRadius: 8, marginBottom: 16 }}>
          <span style={{ color: T.amber, fontSize: 14, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 11, color: T.amberText, lineHeight: 1.6, margin: 0 }}>
            虚偽申告は利用規約違反となります。18歳未満の方は本サービスをご利用いただけません。
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input type="checkbox" id="ageCheck" style={{ width: 16, height: 16, accentColor: T.indigo }} />
          <label htmlFor="ageCheck" style={{ fontSize: 12, color: T.gray600, cursor: "pointer" }}>
            私は18歳以上であることを確認しました
          </label>
        </div>

        <Btn primary onClick={() => onNav("consent")} style={{ width: "100%", justifyContent: "center" }}>確認して次へ →</Btn>
      </Card>
    </div>
  </Shell>
);

// ─────────────────────────────────────────────
// Screen 4: Terms Consent
// ─────────────────────────────────────────────
const ConsentScreen = ({ onNav }) => {
  const [checked, setChecked] = useState({});
  const items = [
    { id: 1, title: "課金の仕組みについて理解した", body: "チャレンジ未達成時に、事前に設定した金額が自動的に引き落とされることを理解しました。" },
    { id: 2, title: "設定可能な金額範囲について理解した", body: "チャレンジ金額は最低500円から最高100,000円の範囲で自由に設定できます。" },
    { id: 3, title: "不正コミットの禁止について理解した", body: "実際の学習活動を伴わない空コミット・自動生成コードの使用は規約違反となります。" },
    { id: 4, title: "不正確定時の措置について理解した", body: "不正と判定された場合、予定損害賠償金の課金およびアカウント停止が行われます。" },
    { id: 5, title: "リポジトリ情報の参照に同意した", body: "コミット内容・差分情報をYareサービスが参照することに同意します。" },
    { id: 6, title: "個人情報の取り扱いに同意した", body: "プライバシーポリシーに従い、個人情報が適切に取り扱われることに同意します。" },
    { id: 7, title: "返金不可ポリシーについて理解した", body: "一度課金された金額は、原則として返金されません。" },
    { id: 8, title: "規約変更時の通知方法について理解した", body: "規約変更時はメールおよびアプリ内通知で事前にお知らせします。" },
  ];
  const allChecked = items.every(i => checked[i.id]);

  return (
    <Shell>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar title="利用規約への同意" />
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", overflow: "hidden" }}>
          {/* Left: terms content */}
          <div style={{ padding: 24, overflowY: "auto", borderRight: `0.5px solid ${T.gray200}` }}>
            <div style={{ fontSize: 13, color: T.gray600, marginBottom: 16, lineHeight: 1.7 }}>
              Yareをご利用いただくにあたり、以下の重要事項を<strong>1項目ずつ</strong>ご確認ください。各項目の内容をお読みの上、チェックボックスにチェックを入れてください。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map(item => (
                <div key={item.id} onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))} style={{
                  display: "flex", gap: 12, padding: "14px 16px",
                  borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${checked[item.id] ? T.indigo : T.gray200}`,
                  background: checked[item.id] ? T.indigoLight : T.white,
                  transition: "all 0.15s",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                    border: `1.5px solid ${checked[item.id] ? T.indigo : T.gray200}`,
                    background: checked[item.id] ? T.indigo : T.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked[item.id] && <span style={{ color: T.white, fontSize: 12 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: checked[item.id] ? T.indigo : T.gray800 }}>{item.id}. {item.title}</div>
                    <div style={{ fontSize: 12, color: T.gray400, lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: summary */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>同意状況</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {items.map(i => (
                <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: checked[i.id] ? T.greenBg : T.gray100 }}>
                  <span style={{ fontSize: 12, color: checked[i.id] ? T.greenText : T.gray400 }}>{checked[i.id] ? "✓" : "○"}</span>
                  <span style={{ fontSize: 11, color: checked[i.id] ? T.greenText : T.gray400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px 12px", background: T.gray100, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>進捗</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{Object.values(checked).filter(Boolean).length} / {items.length}</div>
              <div style={{ marginTop: 6, height: 4, background: T.gray200, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", background: T.indigo, borderRadius: 99, width: `${(Object.values(checked).filter(Boolean).length / items.length) * 100}%`, transition: "width 0.3s" }} />
              </div>
            </div>

            <Btn primary onClick={() => onNav("card")} style={{ width: "100%", justifyContent: "center", opacity: allChecked ? 1 : 0.4, cursor: allChecked ? "pointer" : "not-allowed" }}>
              同意して次へ →
            </Btn>
            {!allChecked && <p style={{ fontSize: 11, color: T.gray400, textAlign: "center", margin: 0 }}>すべての項目にチェックしてください</p>}
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Screen 5: Card Registration
// ─────────────────────────────────────────────
const CardScreen = ({ onNav }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <Shell style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 480, width: "100%", padding: "0 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>カード情報を登録</div>
          <div style={{ fontSize: 13, color: T.gray400, lineHeight: 1.6 }}>チャレンジ未達成時の自動課金のために必要です。<br />カード情報はStripeが安全に管理します。</div>
        </div>

        {/* Card preview */}
        <div style={{ width: "100%", height: 160, borderRadius: 16, background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navy2} 100%)`, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(99,102,241,0.2)" }} />
          <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(139,92,246,0.15)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>クレジットカード</div>
            <div style={{ fontSize: 22, color: T.white }}>≋≋</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: T.white, letterSpacing: 3, marginBottom: 12 }}>●●●● ●●●● ●●●● ●●●●</div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>カード保有者</div>
                <div style={{ fontSize: 12, color: T.white, marginTop: 2 }}>TARO YAMADA</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>有効期限</div>
                <div style={{ fontSize: 12, color: T.white, marginTop: 2 }}>MM / YY</div>
              </div>
            </div>
          </div>
        </div>

        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "カード番号", placeholder: "1234 5678 9012 3456", type: "text" },
              { label: "カード保有者名", placeholder: "TARO YAMADA", type: "text" },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${T.gray200}`, fontFamily: MONO, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>有効期限</div>
                <input placeholder="MM / YY" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${T.gray200}`, fontFamily: MONO, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>CVC</div>
                <input placeholder="●●●" type="password" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${T.gray200}`, fontFamily: MONO, fontSize: 13, outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.indigoLight, borderRadius: 8 }}>
              <span style={{ color: T.indigo, fontSize: 14 }}>🔒</span>
              <p style={{ fontSize: 11, color: T.indigo, lineHeight: 1.5, margin: 0 }}>カード情報はStripeが暗号化して管理します。Yareはカード番号を保持しません。</p>
            </div>

            <Btn primary onClick={() => onNav("challenge-create")} style={{ width: "100%", justifyContent: "center" }}>カードを登録してチャレンジを始める →</Btn>
          </div>
        </Card>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Screen 6: Challenge Create
// ─────────────────────────────────────────────
const ChallengeCreateScreen = ({ onNav }) => {
  const [amount, setAmount] = useState(5000);
  const penalty = Math.min(30000, Math.max(5000, amount * 2));

  return (
    <Shell>
      <Sidebar active="challenge" onNav={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar title="新規チャレンジ作成" />
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
            {/* Left form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>対象リポジトリ</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { name: "yamada_user / typescript-learning", lang: "TypeScript", selected: true },
                    { name: "yamada_user / react-todo-app", lang: "JavaScript", selected: false },
                    { name: "yamada_user / go-api-server", lang: "Go", selected: false },
                  ].map(r => (
                    <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${r.selected ? T.indigo : T.gray200}`, background: r.selected ? T.indigoLight : T.white, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${r.selected ? T.indigo : T.gray200}`, background: r.selected ? T.indigo : T.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {r.selected && <span style={{ color: T.white, fontSize: 11 }}>✓</span>}
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 12, flex: 1, color: r.selected ? T.indigo : T.gray600 }}>{r.name}</span>
                      <Badge type="info">{r.lang}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>チャレンジ期間</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { days: 7, label: "1週間" },
                      { days: 14, label: "2週間" },
                      { days: 30, label: "1ヶ月", selected: true },
                      { days: 60, label: "2ヶ月" },
                      { days: 90, label: "3ヶ月" },
                    ].map(p => (
                      <div key={p.days} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: p.selected ? T.indigoLight : T.gray100, cursor: "pointer", border: p.selected ? `1px solid ${T.indigo}` : "1px solid transparent" }}>
                        <span style={{ fontSize: 13, fontWeight: p.selected ? 500 : 400, color: p.selected ? T.indigo : T.gray600 }}>{p.label}</span>
                        <span style={{ fontSize: 11, color: p.selected ? T.indigo : T.gray400 }}>{p.days}日</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>コミット頻度</div>
                  {[
                    { label: "毎日", desc: "週7回", selected: true },
                    { label: "週5回", desc: "平日毎日", selected: false },
                    { label: "週3回", desc: "最低3回/週", selected: false },
                  ].map(f => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 8, border: `1px solid ${f.selected ? T.indigo : T.gray200}`, background: f.selected ? T.indigoLight : T.white, cursor: "pointer" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${f.selected ? T.indigo : T.gray200}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {f.selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.indigo }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: f.selected ? 500 : 400, color: f.selected ? T.indigo : T.gray600 }}>{f.label}</div>
                        <div style={{ fontSize: 11, color: T.gray400 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>1日最小変更行数</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="range" min="10" max="200" defaultValue="30" style={{ flex: 1, accentColor: T.indigo }} />
                      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 36 }}>30行</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>対象プログラミング言語</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[["TypeScript", true], ["JavaScript", false], ["Python", false], ["Go", false], ["Ruby", false], ["Java", false], ["Rust", false], ["PHP", false]].map(([lang, sel]) => (
                    <div key={lang} style={{ padding: "6px 14px", borderRadius: 99, border: `1px solid ${sel ? T.indigo : T.gray200}`, background: sel ? T.indigoLight : T.white, color: sel ? T.indigo : T.gray600, fontSize: 12, fontWeight: sel ? 500 : 400, cursor: "pointer" }}>{lang}</div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: amount + summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>チャレンジ金額</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: T.red }}>¥{amount.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="100000" step="500" value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ width: "100%", accentColor: T.red, marginBottom: 12 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.gray400, marginBottom: 16 }}>
                  <span>¥500</span><span>¥100,000</span>
                </div>
                <div style={{ padding: "12px 14px", background: T.redBg, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: T.redText, marginBottom: 4 }}>未達成時の予定損害賠償金</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.red }}>¥{penalty.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: T.redText, marginTop: 2 }}>（設定額 × 2倍、上限30,000円）</div>
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>確認サマリー</div>
                {[
                  ["リポジトリ", "typescript-learning"],
                  ["期間", "30日（6/18まで）"],
                  ["頻度", "毎日"],
                  ["最小行数", "30行/日"],
                  ["言語", "TypeScript"],
                  ["金額", `¥${amount.toLocaleString()}`],
                  ["違反時", `¥${penalty.toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${T.gray100}`, fontSize: 12 }}>
                    <span style={{ color: T.gray400 }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <Btn primary onClick={() => onNav("dashboard")} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                  チャレンジを開始する →
                </Btn>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Screen 7: Dashboard (main)
// ─────────────────────────────────────────────
const DashboardScreen = ({ onNav }) => {
  const calData = [3,3,2,3,2,1,0,3,3,2,3,1,3,3,"s",3,3,2,0,"x",3];
  const barData = [45, 82, 67, 120, 95, 38, 110];
  const maxBar = Math.max(...barData);
  const days = ["月","火","水","木","金","土","今日"];

  return (
    <Shell>
      <Sidebar active="dashboard" onNav={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar title="ダッシュボード" actions={
          <Btn primary small onClick={() => onNav("challenge-create")}>+ 新規チャレンジ</Btn>
        } />
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "継続日数", value: "23日", sub: "↑ 最長記録更新中", subColor: T.green, iconBg: "#ede9fe", icon: "🔥" },
              { label: "有効コミット", value: "89/92", sub: "▲ 96.7% 達成率", subColor: T.green, iconBg: T.greenBg, icon: "✓" },
              { label: "残日数", value: "7日", sub: "2026/05/25 まで", subColor: T.amber, iconBg: T.amberBg, icon: "⏰" },
              { label: "チャレンジ金額", value: "¥5,000", sub: "違反金 ¥10,000", subColor: T.gray400, iconBg: T.redBg, icon: "¥" },
            ].map(k => (
              <Card key={k.label} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{k.icon}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5, marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: k.subColor }}>{k.sub}</div>
              </Card>
            ))}
          </div>

          {/* Challenge + Ring */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>🔥 アクティブチャレンジ</span>
                <Btn small onClick={() => onNav("challenge-detail")}>詳細 →</Btn>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T.gray400, marginBottom: 10 }}>yamada_user / typescript-learning</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[["ステータス","● 進行中", T.green],["頻度","毎日",null],["最小行数","30行/日",null]].map(([l,v,c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: c || T.gray800 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.gray400, marginBottom: 4 }}>
                <span>進捗</span><span style={{ fontWeight: 500, color: T.indigo }}>89 / 96日</span>
              </div>
              <div style={{ height: 6, background: T.gray100, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "92.7%", background: T.indigo, borderRadius: 99 }} />
              </div>
              {/* Calendar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>最近21日のコミット</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(21,1fr)", gap: 3 }}>
                  {calData.map((v, i) => {
                    const bg = v === "s" ? "#fbbf24" : v === "x" ? "#fecaca" : v === 0 ? T.gray100 : v === 1 ? "#c7d2fe" : v === 2 ? "#818cf8" : T.indigo;
                    return <div key={i} style={{ aspectRatio: "1", borderRadius: 3, background: bg }} />;
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 10, color: T.gray400 }}>
                  {[["#4f46e5","有効"],["#fbbf24","審査中"],["#fecaca","無効"],[T.gray100,"なし"]].map(([c,l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Ring */}
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, alignSelf: "flex-start" }}>達成率</div>
              <div style={{ position: "relative", width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke={T.gray100} strokeWidth="9" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={T.indigo} strokeWidth="9" strokeDasharray="251.3" strokeDashoffset="18" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#c7d2fe" strokeWidth="7" strokeDasharray="188.5" strokeDashoffset="25" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>96<small style={{ fontSize: 12 }}>%</small></div>
                  <div style={{ fontSize: 10, color: T.gray400 }}>達成</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                {[["23🔥","現在連続",T.indigo],["31","最長記録",null],["¥0","支払済み",T.green],["3","完了数",null]].map(([v,l,c]) => (
                  <div key={l} style={{ textAlign: "center", background: T.gray50, borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c || T.gray800 }}>{v}</div>
                    <div style={{ fontSize: 10, color: T.gray400 }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Commits table */}
            <Card style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>最近のコミット</span>
                <Btn small onClick={() => onNav("commits")}>すべて →</Btn>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["SHA","メッセージ","日付","結果"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "5px 8px", fontSize: 10, color: T.gray400, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `0.5px solid ${T.gray200}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["a3f9c12","add TS generics examples","05/18","valid"],
                    ["b8e2d47","implement async patterns","05/17","valid"],
                    ["c1a7f85","refactor class components","05/16","susp"],
                    ["d4b3e91","fix type errors in util","05/15","valid"],
                    ["e9c5a32","add interface definitions","05/14","invalid"],
                  ].map(([sha,msg,date,status]) => (
                    <tr key={sha}>
                      <td style={{ padding: "7px 8px", borderBottom: `0.5px solid ${T.gray100}`, fontFamily: MONO, fontSize: 11, color: T.gray400 }}>{sha}</td>
                      <td style={{ padding: "7px 8px", borderBottom: `0.5px solid ${T.gray100}`, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</td>
                      <td style={{ padding: "7px 8px", borderBottom: `0.5px solid ${T.gray100}`, color: T.gray400 }}>{date}</td>
                      <td style={{ padding: "7px 8px", borderBottom: `0.5px solid ${T.gray100}` }}><Badge type={status}>{status === "susp" ? "審査中" : status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Bar chart */}
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>今週のコミット行数</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 55 }}>
                  {barData.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === 6 ? T.indigo : "#c7d2fe", height: Math.round((v / maxBar) * 50) }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
                  {days.map((d, i) => <span key={d} style={{ fontSize: 9, color: i === 6 ? T.indigo : T.gray400, fontWeight: i === 6 ? 600 : 400 }}>{d}</span>)}
                </div>
              </Card>

              {/* Notifications */}
              <Card style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>🔔 通知</span>
                  <span style={{ background: T.amber, color: T.white, fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 99 }}>3</span>
                </div>
                {[
                  { dot: T.amber, text: "コミット c1a7f85 が審査中。7日以内に回答してください。", time: "1時間前" },
                  { dot: T.indigo, text: "チャレンジ残り7日。引き続き頑張りましょう。", time: "今日 9:00" },
                  { dot: T.green, text: "昨日のコミットを確認しました。有効です。", time: "昨日" },
                ].map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "7px 8px", borderRadius: 8, background: T.gray50, marginBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.dot, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: 10, color: T.gray400, marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Screen 8: Challenge Detail
// ─────────────────────────────────────────────
const ChallengeDetailScreen = ({ onNav }) => {
  const calData = Array.from({ length: 30 }, (_, i) => {
    if (i === 14) return "s"; if (i === 19) return "x";
    if (i >= 23) return 0;
    return [1,2,3][Math.floor(Math.random() * 3)];
  });

  return (
    <Shell>
      <Sidebar active="challenge" onNav={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar title="チャレンジ詳細" actions={
          <Badge type="info">進行中</Badge>
        } />
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Card>
              <div style={{ fontFamily: MONO, fontSize: 13, color: T.indigo, marginBottom: 6 }}>yamada_user / typescript-learning</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                {[["開始日","2026/04/19"],["終了日","2026/05/25"],["期間","30日"],["金額","¥5,000"]].map(([l,v]) => (
                  <div key={l} style={{ background: T.gray50, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.gray400 }}>達成進捗</span>
                <span style={{ fontWeight: 500, color: T.indigo }}>23 / 30日</span>
              </div>
              <div style={{ height: 8, background: T.gray100, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ height: "100%", width: "76.7%", background: T.indigo, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: T.gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>30日間のコミットカレンダー</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(30,1fr)", gap: 3, marginBottom: 10 }}>
                {calData.map((v, i) => {
                  const bg = v === "s" ? "#fbbf24" : v === "x" ? "#fecaca" : v === 0 ? T.gray100 : v === 1 ? "#c7d2fe" : v === 2 ? "#818cf8" : T.indigo;
                  return <div key={i} title={`${i + 1}日目`} style={{ aspectRatio: "1", borderRadius: 3, background: bg }} />;
                })}
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>本チャレンジのリスク</div>
                <div style={{ padding: "12px 14px", background: T.redBg, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: T.redText, marginBottom: 4 }}>未達成時の課金</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: T.red }}>¥10,000</div>
                  <div style={{ fontSize: 10, color: T.redText, marginTop: 2 }}>残り7日間、毎日コミットが必要</div>
                </div>
              </Card>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>バリデーション統計</div>
                {[["valid","有効コミット","23",T.greenText,T.greenBg],["invalid","無効コミット","1",T.redText,T.redBg],["susp","審査中","1",T.amberText,T.amberBg]].map(([t,l,v,c,bg]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: bg, marginBottom: 6 }}>
                    <Badge type={t}>{t === "susp" ? "審査" : t}</Badge>
                    <span style={{ fontSize: 12, flex: 1, color: c }}>{l}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: c }}>{v}</span>
                  </div>
                ))}
              </Card>
              <Btn danger small onClick={() => onNav("dashboard")} style={{ width: "100%", justifyContent: "center" }}>
                異議を申し立てる
              </Btn>
            </div>
          </div>

          {/* Commits */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>コミット一覧</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["SHA","コミットメッセージ","日時","追加行数","結果","詳細"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 10, color: T.gray400, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `0.5px solid ${T.gray200}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["a3f9c12","add TypeScript generics examples","05/18 14:23","+87行","valid","LOW_ENTROPY"],
                  ["b8e2d47","implement async/await patterns","05/17 20:11","+134行","valid","-"],
                  ["c1a7f85","refactor class components","05/16 08:55","+42行","susp","TEMPORAL_PATTERN"],
                  ["d4b3e91","fix type errors in util files","05/15 19:30","+63行","valid","-"],
                  ["e9c5a32","add interface definitions","05/14 22:00","+8行","invalid","INSUFFICIENT_LINES"],
                ].map(([sha,msg,dt,lines,status,reason]) => (
                  <tr key={sha}>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}`, fontFamily: MONO, fontSize: 11, color: T.indigo }}>{sha}</td>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}` }}>{msg}</td>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}`, color: T.gray400, whiteSpace: "nowrap" }}>{dt}</td>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}`, color: T.green }}>{lines}</td>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}` }}><Badge type={status}>{status === "susp" ? "審査中" : status}</Badge></td>
                    <td style={{ padding: "8px", borderBottom: `0.5px solid ${T.gray100}`, fontFamily: MONO, fontSize: 10, color: T.gray400 }}>{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Screen 9: Notifications
// ─────────────────────────────────────────────
const NotificationsScreen = ({ onNav }) => (
  <Shell>
    <Sidebar active="notifications" onNav={onNav} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Topbar title="通知" actions={<Btn small>すべて既読にする</Btn>} />
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {[
          { type: T.amber, icon: "⚠", title: "審査中コミットへの回答が必要です", body: "コミット c1a7f85 (refactor class components) が不正の疑いで審査中です。7日以内にご回答ください。", time: "1時間前", action: true, unread: true },
          { type: T.indigo, icon: "🔥", title: "チャレンジ残り7日", body: "yamada_user/typescript-learning のチャレンジ終了まで7日です。毎日のコミットを忘れずに。", time: "今日 9:00", action: false, unread: true },
          { type: T.green, icon: "✓", title: "コミットが有効と確認されました", body: "コミット b8e2d47 (implement async/await patterns) は有効と判定されました。", time: "昨日 20:15", action: false, unread: false },
          { type: T.red, icon: "✕", title: "コミットが無効と判定されました", body: "コミット e9c5a32 (add interface definitions) は変更行数不足（8行）のため無効です。最小30行が必要です。", time: "2日前 22:05", action: false, unread: false },
          { type: T.green, icon: "✓", title: "コミットが有効と確認されました", body: "コミット a3f9c12 (add TypeScript generics examples) は有効と判定されました。", time: "3日前 14:30", action: false, unread: false },
          { type: T.indigo, icon: "💳", title: "課金予告: 7日後に引き落とし予定", body: "チャレンジ未達成の場合、2026/05/25 に ¥10,000 が引き落とされます。達成率96%です。引き続き頑張ってください！", time: "5日前", action: false, unread: false },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 10, background: n.unread ? T.indigoLight : T.white, border: `0.5px solid ${n.unread ? T.indigo + "40" : T.gray200}`, marginBottom: 8, position: "relative" }}>
            {n.unread && <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: T.indigo }} />}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: n.type + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: T.gray400, lineHeight: 1.6, marginBottom: n.action ? 10 : 0 }}>{n.body}</div>
              {n.action && <Btn small primary onClick={() => onNav("challenge-detail")}>回答する →</Btn>}
            </div>
            <div style={{ fontSize: 11, color: T.gray400, whiteSpace: "nowrap" }}>{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  </Shell>
);

// ─────────────────────────────────────────────
// Screen 10: Settings
// ─────────────────────────────────────────────
const SettingsScreen = ({ onNav }) => {
  const [notif, setNotif] = useState({ email: true, app: true, reminder: true, preview: false });

  return (
    <Shell>
      <Sidebar active="settings" onNav={onNav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar title="設定" />
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>プロフィール</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: `0.5px solid ${T.gray100}` }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: T.white }}>YU</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>yamada_user</div>
                <div style={{ fontSize: 12, color: T.gray400, fontFamily: MONO }}>github.com/yamada_user</div>
              </div>
              <Btn small style={{ marginLeft: "auto" }}>GitHubで更新</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["表示名","Yamada Taro"],["メールアドレス","yamada@example.com"]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: T.gray400, marginBottom: 4 }}>{l}</div>
                  <input defaultValue={v} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `0.5px solid ${T.gray200}`, fontFamily: FONT, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>登録カード</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: `0.5px solid ${T.gray200}`, marginBottom: 10 }}>
              <div style={{ width: 36, height: 24, borderRadius: 4, background: T.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.white, fontWeight: 600 }}>VISA</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: 11, color: T.gray400 }}>有効期限 12/27</div>
              </div>
              <Badge type="valid" style={{ marginLeft: "auto" }}>有効</Badge>
              <Btn small danger>削除</Btn>
            </div>
            <Btn small primary>+ 新しいカードを追加</Btn>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>通知設定</div>
            {[
              { key: "email", label: "メール通知", desc: "課金通知・審査通知など重要な通知をメールで受け取る" },
              { key: "app", label: "アプリ内通知", desc: "すべての通知をアプリ内で表示する" },
              { key: "reminder", label: "未コミットリマインダー", desc: "コミットがない日の22時にリマインドメールを送信" },
              { key: "preview", label: "新機能プレビュー", desc: "ベータ機能の早期アクセスに参加する" },
            ].map(n => (
              <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `0.5px solid ${T.gray100}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{n.label}</div>
                  <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>{n.desc}</div>
                </div>
                <div onClick={() => setNotif(p => ({ ...p, [n.key]: !p[n.key] }))} style={{
                  width: 40, height: 22, borderRadius: 99, cursor: "pointer", flexShrink: 0,
                  background: notif[n.key] ? T.indigo : T.gray200, position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{ position: "absolute", top: 3, left: notif[n.key] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: T.white, transition: "left 0.2s" }} />
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>危険な操作</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn danger small>同意ログをエクスポート</Btn>
              <Btn danger small>退会する</Btn>
            </div>
            <p style={{ fontSize: 11, color: T.gray400, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>退会後も取引履歴・同意ログは法的要件に基づき7年間保持されます。アクティブなチャレンジがある場合は退会できません。</p>
          </Card>
        </div>
      </div>
    </Shell>
  );
};

// ─────────────────────────────────────────────
// Main: Screen Switcher
// ─────────────────────────────────────────────
const SCREENS = [
  { id: "landing", label: "① LP", component: LandingScreen },
  { id: "signup", label: "② サインアップ", component: SignupScreen },
  { id: "age", label: "③ 年齢確認", component: AgeScreen },
  { id: "consent", label: "④ 規約同意", component: ConsentScreen },
  { id: "card", label: "⑤ カード登録", component: CardScreen },
  { id: "challenge-create", label: "⑥ チャレンジ作成", component: ChallengeCreateScreen },
  { id: "dashboard", label: "⑦ ダッシュボード", component: DashboardScreen },
  { id: "challenge-detail", label: "⑧ チャレンジ詳細", component: ChallengeDetailScreen },
  { id: "notifications", label: "⑨ 通知", component: NotificationsScreen },
  { id: "settings", label: "⑩ 設定", component: SettingsScreen },
];

export default function App() {
  const [current, setCurrent] = useState("landing");
  const Screen = SCREENS.find(s => s.id === current)?.component || LandingScreen;

  return (
    <div style={{ fontFamily: FONT, padding: "0 0 20px" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "12px 4px", marginBottom: 12, borderBottom: `0.5px solid ${T.gray200}` }}>
        {SCREENS.map(s => (
          <button key={s.id} onClick={() => setCurrent(s.id)} style={{
            padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontFamily: FONT,
            background: current === s.id ? T.indigo : T.gray100,
            color: current === s.id ? T.white : T.gray600,
            border: "none", fontWeight: current === s.id ? 500 : 400,
            transition: "all 0.15s",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Screen */}
      <Screen onNav={setCurrent} />

      {/* Flow hint */}
      <div style={{ marginTop: 10, fontSize: 11, color: T.gray400, textAlign: "center" }}>
        画面内のボタンから次の画面へ遷移できます
      </div>
    </div>
  );
}
