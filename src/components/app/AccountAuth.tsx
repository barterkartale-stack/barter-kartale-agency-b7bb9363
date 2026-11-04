import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, BadgeCheck, Clock3, Copy, KeyRound, LockKeyhole, Share2, ShieldCheck, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { captureSignUpIp, generateDeviceFingerprint } from "@/components/app/AuthPanels";

export type AuthMode = "creator" | "partner";

/* ---------- Saved accounts (Instagram-style chooser) ---------- */
export type SavedAccount = { email: string; name: string };
const SAVED_KEY = "bk_saved_accounts";

export function readSavedAccounts(): SavedAccount[] {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]") as SavedAccount[];
  } catch {
    return [];
  }
}
export function rememberAccount(acc: SavedAccount): void {
  const list = readSavedAccounts().filter((a) => a.email !== acc.email);
  window.localStorage.setItem(SAVED_KEY, JSON.stringify([acc, ...list].slice(0, 5)));
}
function forgetAccount(email: string): void {
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(readSavedAccounts().filter((a) => a.email !== email)));
}

/* ---------- Keep me signed in ---------- */
const EPHEMERAL_KEY = "bk_ephemeral";
const ALIVE_KEY = "bk_alive";
function setKeepSignedIn(keep: boolean): void {
  if (keep) window.localStorage.removeItem(EPHEMERAL_KEY);
  else window.localStorage.setItem(EPHEMERAL_KEY, "1");
  window.sessionStorage.setItem(ALIVE_KEY, "1");
}
/** Call once on app start: signs out sessions that were not marked "keep me signed in" once the browser was closed. */
export async function enforceKeepSignedIn(): Promise<void> {
  if (window.localStorage.getItem(EPHEMERAL_KEY) === "1" && !window.sessionStorage.getItem(ALIVE_KEY)) {
    window.localStorage.removeItem(EPHEMERAL_KEY);
    await supabase.auth.signOut();
  }
  window.sessionStorage.setItem(ALIVE_KEY, "1");
}

/* ---------- Pending signup info (survives Google redirect / email confirm) ---------- */
const PENDING_KEY = "bk_pending_signup";
type PendingSignup = { mode: AuthMode; referral?: string; invite?: string };
function savePending(p: PendingSignup): void {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(p));
}
export function readPending(): PendingSignup | null {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) || "null") as PendingSignup | null;
  } catch {
    return null;
  }
}
export function clearPending(): void {
  window.localStorage.removeItem(PENDING_KEY);
}
function referralFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get("ref") || "";
  } catch {
    return "";
  }
}

export async function completeAccountSetup(input: {
  name: string;
  mobile: string;
  mode: AuthMode;
  referral?: string;
  invite?: string;
}) {
  const [ip, fp] = await Promise.all([captureSignUpIp(), Promise.resolve(generateDeviceFingerprint())]);
  return supabase.rpc("complete_account_setup", {
    p_display_name: input.name,
    p_mobile_number: input.mobile,
    p_sign_up_ip: ip ?? undefined,
    p_device_fingerprint: fp,
    p_referral_code: input.referral || undefined,
    p_invite_code: input.invite || undefined,
    p_partner: input.mode === "partner",
  });
}

function friendlyRpcError(message: string | undefined): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invitation")) return "That agency invitation code is not valid.";
  if (m.includes("mobile")) return "Please enter a valid 10–15 digit phone number.";
  return "We could not finish your account setup. Please try again.";
}

/* ---------- Google button ---------- */
function GoogleButton({ mode, onError }: { mode: AuthMode; onError: (m: string) => void }) {
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setLoading(true);
    savePending({ mode, referral: referralFromUrl() || undefined });
    setKeepSignedIn(true);
    window.sessionStorage.setItem("bk_after_login", mode === "partner" ? "/partner-console" : "/dashboard");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth/callback` });
    if (result.error) {
      setLoading(false);
      onError("Google sign-in is temporarily unavailable. Please try again.");
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };
  return (
    <button type="button" className="google-button" onClick={go} disabled={loading}>
      <span className="google-mark">G</span>
      {loading ? "Opening secure sign-in…" : "Continue with Google"} <ArrowRight size={16} />
    </button>
  );
}

/* ---------- Gateway modal (used for both normal users and partners) ---------- */
export function AuthGateway({
  mode,
  onClose,
  onError,
  onForgot,
}: {
  mode: AuthMode;
  onClose: () => void;
  onError: (m: string) => void;
  onForgot: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [saved, setSaved] = useState<SavedAccount[]>([]);
  const [prefill, setPrefill] = useState("");
  useEffect(() => {
    setSaved(readSavedAccounts());
    if (referralFromUrl() && mode === "creator") setTab("signup");
  }, [mode]);

  const isPartner = mode === "partner";
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="login-modal access-gateway" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <div className="section-kicker">{isPartner ? "PRIVATE PARTNER CONSOLE" : "ACCESS GATEWAY"}</div>
        <h2>{isPartner ? <>Partner<br /><em>Console.</em></> : <>Welcome to<br /><em>BarterKartale.</em></>}</h2>
        <p>{isPartner ? "Sign in, or join with the agency invitation code you received from our team." : "Sign in to your dashboard or create a new account."}</p>

        {saved.length > 0 && tab === "signin" && (
          <div className="saved-accounts">
            <small>Continue as</small>
            {saved.map((a) => (
              <div className="saved-account" key={a.email}>
                <button type="button" onClick={() => setPrefill(a.email)}>
                  <span className="user-avatar">{(a.name || a.email).slice(0, 2).toUpperCase()}</span>
                  <span><strong>{a.name || a.email.split("@")[0]}</strong><em>{a.email}</em></span>
                </button>
                <button type="button" className="saved-remove" aria-label={`Remove ${a.email}`} onClick={() => { forgetAccount(a.email); setSaved(readSavedAccounts()); }}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <GoogleButton mode={mode} onError={onError} />
        <div className="auth-separator"><span>— Or use your credentials —</span></div>
        <div className="auth-tabs">
          <button className={tab === "signin" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("signin")}>Sign In</button>
          <button className={tab === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setTab("signup")}>Sign Up</button>
        </div>
        {tab === "signin" ? (
          <SignInForm key={prefill} initialEmail={prefill} mode={mode} onDone={onClose} onError={onError} onForgot={onForgot} />
        ) : (
          <SignUpForm mode={mode} onDone={onClose} onError={onError} />
        )}
      </div>
    </div>
  );
}

function KeepSignedIn({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="keep-signed-in">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> Keep me signed in
    </label>
  );
}

function SignInForm({ initialEmail, mode, onDone, onError, onForgot }: { initialEmail: string; mode: AuthMode; onDone: () => void; onError: (m: string) => void; onForgot: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setKeepSignedIn(keep);
    window.sessionStorage.setItem("bk_after_login", mode === "partner" ? "/partner-console" : "/dashboard");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      onError("Those credentials were not accepted. Check your email and password.");
      return;
    }
    onDone();
  };
  return (
    <form className="email-auth-panel" onSubmit={submit}>
      <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" /></label>
      <label>Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoFocus={!!initialEmail} /></label>
      <KeepSignedIn value={keep} onChange={setKeep} />
      <button className="primary-button full-button" disabled={loading}>{loading ? "Signing in…" : "Sign In"} <ArrowRight size={16} /></button>
      <button type="button" className="text-button forgot-link" onClick={onForgot}><KeyRound size={14} /> Forgot password?</button>
    </form>
  );
}

function SignUpForm({ mode, onDone, onError }: { mode: AuthMode; onDone: () => void; onError: (m: string) => void }) {
  const isPartner = mode === "partner";
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(() => (isPartner ? "" : referralFromUrl()));
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setKeepSignedIn(keep);
    const pending: PendingSignup = { mode, referral: isPartner ? undefined : code.trim() || undefined, invite: isPartner ? code.trim() : undefined };
    savePending(pending);
    window.sessionStorage.setItem("bk_after_login", isPartner ? "/partner-console" : "/dashboard");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: name, mobile_number: mobile, signup_mode: mode, referral_code: pending.referral, invite_code: pending.invite },
      },
    });
    if (error || !data.user || (data.user.identities && data.user.identities.length === 0)) {
      setLoading(false);
      const m = error?.message?.toLowerCase() || "registered";
      onError(m.includes("registered") ? "This email is already registered. Please Sign In." : m.includes("password") ? "Password too weak. Use 8+ characters with letters and numbers." : "Could not create your account. Please try again.");
      return;
    }
    if (!data.session) {
      setLoading(false);
      onError("Account created! Check your email inbox and click the confirmation link to sign in.");
      onDone();
      return;
    }
    const { error: rpcError } = await completeAccountSetup({ name, mobile, ...pending });
    setLoading(false);
    if (rpcError) {
      onError(friendlyRpcError(rpcError.message));
      return;
    }
    clearPending();
    rememberAccount({ email: email.trim(), name });
    onDone();
  };

  return (
    <form className="email-auth-panel" onSubmit={submit}>
      <label>Full Name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" /></label>
      <label>Active WhatsApp / Phone Number<input required inputMode="tel" pattern="[0-9+() -]{10,15}" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" /></label>
      <label>Email Address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" /></label>
      <label>Create Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
      {isPartner ? (
        <label>Agency Invitation Code<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code given by BarterKartale" /></label>
      ) : (
        <label>Referral Code <span className="optional-tag">(optional)</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BK-A1B2C3" /></label>
      )}
      <KeepSignedIn value={keep} onChange={setKeep} />
      <button className="primary-button full-button" disabled={loading}>{loading ? "Creating account…" : isPartner ? "Request Partner Access" : "Create Account"} <ArrowRight size={16} /></button>
      <div className="privacy-disclosure"><ShieldCheck size={14} /><span>For account security, your sign-up IP and a device fingerprint are logged and visible only to administrators.</span></div>
    </form>
  );
}

/* ---------- Mandatory setup after Google / email confirmation ---------- */
export function AccountSetupModal({ session, onComplete, onError }: { session: Session; onComplete: () => void; onError: (m: string) => void }) {
  const meta = (session.user.user_metadata || {}) as { full_name?: string; name?: string; display_name?: string; mobile_number?: string; signup_mode?: AuthMode; referral_code?: string; invite_code?: string };
  const [pending] = useState(() => readPending());
  const mode: AuthMode = pending?.mode || meta.signup_mode || "creator";
  const isPartner = mode === "partner";
  const [name, setName] = useState(meta.display_name || meta.full_name || meta.name || "");
  const [mobile, setMobile] = useState(meta.mobile_number || "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState((isPartner ? pending?.invite || meta.invite_code : pending?.referral || meta.referral_code) || "");
  const isGoogle = session.user.app_metadata?.provider === "google";
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (isGoogle && password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setLoading(false);
        onError("We could not set your password. Please use at least 8 characters.");
        return;
      }
    }
    const { error } = await completeAccountSetup({ name, mobile, mode, referral: isPartner ? undefined : code, invite: isPartner ? code : undefined });
    setLoading(false);
    if (error) {
      onError(friendlyRpcError(error.message));
      return;
    }
    clearPending();
    rememberAccount({ email: session.user.email || "", name });
    onComplete();
  };

  return (
    <div className="modal-backdrop onboarding-backdrop">
      <div className="auth-panel onboarding-panel">
        <div className="login-mark"><BadgeCheck size={20} /></div>
        <div className="section-kicker">{isPartner ? "PARTNER ACCOUNT SETUP" : "COMPLETE YOUR ACCOUNT"}</div>
        <h2>One quick step<br /><em>before we begin.</em></h2>
        <p>Signed in as <strong>{session.user.email}</strong>. Please fill these details to continue.</p>
        <form onSubmit={submit}>
          <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
          <label>WhatsApp / Phone number<input required inputMode="tel" pattern="[0-9+() -]{10,15}" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit number" /></label>
          {isGoogle && <label>Create password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>}
          {isPartner ? (
            <label>Agency Invitation Code<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code given by BarterKartale" /></label>
          ) : (
            <label>Referral Code <span className="optional-tag">(optional)</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BK-A1B2C3" /></label>
          )}
          <button className="primary-button full-button" disabled={loading}>{loading ? "Saving securely…" : "Complete setup"} <ArrowRight size={16} /></button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Referral card for dashboard ---------- */
export function ReferralCard({ code }: { code: string | null }) {
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    void supabase.rpc("my_referral_count").then(({ data }) => setCount(data ?? 0));
  }, []);
  if (!code) return null;
  const link = `${window.location.origin}/?ref=${code}`;
  return (
    <div className="referral-card">
      <div className="section-kicker">YOUR REFERRAL CODE</div>
      <div className="referral-code">{code}</div>
      <p>{count} friend{count === 1 ? "" : "s"} joined with your code.</p>
      <div className="referral-actions">
        <button className="text-button" onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}><Copy size={14} /> {copied ? "Copied!" : "Copy link"}</button>
        <a className="text-button" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Join BarterKartale with my code ${code}: ${link}`)}`}><Share2 size={14} /> Share on WhatsApp</a>
      </div>
    </div>
  );
}

/* ---------- Partner pending screen ---------- */
export function PartnerPendingScreen({ reviewEta, onSignOut }: { reviewEta: string | null; onSignOut: () => void }) {
  const eta = reviewEta ? new Date(reviewEta) : new Date(Date.now() + 2 * 3600 * 1000);
  const ist = eta.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  return (
    <section className="section-wrap console-page">
      <div className="pending-card">
        <Clock3 size={30} />
        <div className="section-kicker">ACCOUNT UNDER REVIEW</div>
        <h1>Almost <em>there.</em></h1>
        <p>Account evaluation window: 2 to 4 hours. Please re-authenticate after <strong>{ist} IST</strong>.</p>
        <button className="text-button" onClick={onSignOut}><LockKeyhole size={14} /> Sign out</button>
      </div>
    </section>
  );
}

export function SavedAccountIcon() {
  return <UserRound size={14} />;
}
