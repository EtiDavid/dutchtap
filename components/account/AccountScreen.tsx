"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/auth/useAccount";
import { clearLocalProgress, loadLocalProgress } from "@/lib/sync/localProgress";
import { TextField } from "@/components/ui/TextField";
import { RecoveryCodeReveal } from "./RecoveryCodeReveal";

type View = "login" | "register" | "forgot";

function guestHasProgress(): boolean {
  const local = loadLocalProgress();
  return local.totalCorrect + local.totalWrong > 0;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function AccountScreen() {
  const { account, loading, refresh, logout } = useAccount();
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [mergePrompt, setMergePrompt] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">Loading…</div>;
  }

  if (revealedCode) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm items-center justify-center px-6">
        <RecoveryCodeReveal
          code={revealedCode}
          onContinue={() => {
            clearLocalProgress();
            setRevealedCode(null);
            router.push("/");
          }}
        />
      </div>
    );
  }

  if (account) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-8">
        <Link href="/" className="text-sm text-muted">
          ← Back
        </Link>
        <div>
          <p className="text-xl font-bold text-foreground">{account.username}</p>
          <p className="text-sm text-muted">{account.lifetimeScore} lifetime points</p>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              const data = await postJson("/api/auth/recovery/regenerate", {});
              setRevealedCode(data.recoveryCode);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            } finally {
              setSubmitting(false);
            }
          }}
          className="h-12 w-full rounded-xl border border-border text-sm font-medium text-foreground"
        >
          Regenerate recovery code
        </button>
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="h-12 w-full rounded-xl border border-border text-sm font-medium text-foreground"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-8">
      <Link href="/" className="text-sm text-muted">
        ← Back
      </Link>

      <div className="flex rounded-xl border border-border p-1 text-sm font-medium">
        {(["login", "register", "forgot"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              setError(null);
              setForgotSuccess(false);
            }}
            className={`flex-1 rounded-lg py-2 ${view === v ? "bg-accent text-accent-foreground" : "text-muted"}`}
          >
            {v === "login" ? "Log In" : v === "register" ? "Create Account" : "Forgot"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {view === "login" && (
        <LoginForm
          submitting={submitting}
          setSubmitting={setSubmitting}
          setError={setError}
          mergePrompt={mergePrompt}
          onSignedIn={async () => {
            if (guestHasProgress()) {
              setMergePrompt(true);
            } else {
              await refresh();
              router.push("/");
            }
          }}
          onResolveMerge={async (shouldMerge) => {
            if (shouldMerge) {
              try {
                const local = loadLocalProgress();
                await postJson("/api/guest-merge", {
                  progressByKey: local.progressByKey,
                  lifetimeScore: local.lifetimeScore,
                  totalCorrect: local.totalCorrect,
                  totalWrong: local.totalWrong,
                });
              } catch {
                // Merge failure shouldn't block sign-in; account data remains intact.
              }
            }
            clearLocalProgress();
            setMergePrompt(false);
            await refresh();
            router.push("/");
          }}
        />
      )}

      {view === "register" && (
        <RegisterForm
          submitting={submitting}
          setSubmitting={setSubmitting}
          setError={setError}
          onRegistered={(code) => setRevealedCode(code)}
        />
      )}

      {view === "forgot" &&
        (forgotSuccess ? (
          <div className="flex flex-col gap-3 text-center">
            <p className="text-sm text-foreground">Password updated. You can log in now.</p>
            <button
              type="button"
              onClick={() => setView("login")}
              className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
            >
              Go to Log In
            </button>
          </div>
        ) : (
          <ForgotForm
            submitting={submitting}
            setSubmitting={setSubmitting}
            setError={setError}
            onReset={() => setForgotSuccess(true)}
          />
        ))}
    </div>
  );
}

function LoginForm({
  submitting,
  setSubmitting,
  setError,
  onSignedIn,
  mergePrompt,
  onResolveMerge,
}: {
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string | null) => void;
  onSignedIn: () => void;
  mergePrompt: boolean;
  onResolveMerge: (shouldMerge: boolean) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (mergePrompt) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground">You have guest progress on this device. Save it to your account?</p>
        <button
          type="button"
          onClick={() => onResolveMerge(true)}
          className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
        >
          Save my current progress to this account
        </button>
        <button type="button" onClick={() => onResolveMerge(false)} className="text-sm text-muted underline">
          Discard guest progress
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
          await postJson("/api/auth/login", { username, password });
          onSignedIn();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-40"
      >
        Log In
      </button>
    </form>
  );
}

function RegisterForm({
  submitting,
  setSubmitting,
  setError,
  onRegistered,
}: {
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string | null) => void;
  onRegistered: (code: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveGuestProgress, setSaveGuestProgress] = useState(true);
  const hasGuestProgress = guestHasProgress();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          return;
        }
        setSubmitting(true);
        setError(null);
        try {
          const local = loadLocalProgress();
          const body: Record<string, unknown> = { username, password };
          if (hasGuestProgress && saveGuestProgress) {
            body.guestProgress = {
              progressByKey: local.progressByKey,
              lifetimeScore: local.lifetimeScore,
              totalCorrect: local.totalCorrect,
              totalWrong: local.totalWrong,
            };
          }
          const data = await postJson("/api/auth/register", body);
          onRegistered(data.recoveryCode);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        minLength={3}
        maxLength={20}
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <TextField
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      {hasGuestProgress && (
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={saveGuestProgress}
            onChange={(e) => setSaveGuestProgress(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
          />
          Save my current guest progress to this account
        </label>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-40"
      >
        Create Account
      </button>
    </form>
  );
}

function ForgotForm({
  submitting,
  setSubmitting,
  setError,
  onReset,
}: {
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setError: (v: string | null) => void;
  onReset: () => void;
}) {
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
          await postJson("/api/auth/recovery/reset", { username, recoveryCode, newPassword });
          onReset();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <TextField
        label="Recovery code"
        value={recoveryCode}
        onChange={(e) => setRecoveryCode(e.target.value)}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        required
      />
      <TextField
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        minLength={8}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-14 w-full rounded-2xl bg-accent text-base font-semibold text-accent-foreground disabled:opacity-40"
      >
        Reset Password
      </button>
    </form>
  );
}
