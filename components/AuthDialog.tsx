"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import {
  confirmPhoneOtp,
  firebaseReady,
  loginWithEmail,
  loginWithGoogle,
  makeRecaptcha,
  registerWithEmail,
  sendPhoneOtp,
} from "@/lib/firebase";
import { useCommerce } from "@/components/CommerceProvider";

type Mode = "email" | "google" | "phone";

export function AuthDialog() {
  const { authOpen, closeAuth } = useCommerce();
  const [mode, setMode] = useState<Mode>("email");
  const [action, setAction] = useState<"login" | "register">("login");
  const [status, setStatus] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  async function run(task: () => Promise<unknown>, message: string) {
    setStatus("");
    try {
      await task();
      setStatus(message);
      window.setTimeout(closeAuth, 500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function sendOtp() {
    setStatus("");
    try {
      const activeVerifier = verifier ?? makeRecaptcha("auth-recaptcha");
      setVerifier(activeVerifier);
      setConfirmation(await sendPhoneOtp(form.phone, activeVerifier));
      setStatus("OTP sent. Enter the code below.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send OTP.");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-ink/45 backdrop-blur-[2px]" onMouseDown={closeAuth}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-kora p-6  sm:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button autoFocus aria-label="Close account dialog" className="ml-auto grid size-10 place-items-center border border-line transition-transform duration-500 ease-silk hover:rotate-90" onClick={closeAuth}>
          <X size={18} />
        </button>
        <h2 id="auth-title" className="mt-2 text-[22px] font-semibold uppercase tracking-[0.1em]">{action === "login" ? "Welcome back." : "Create your account."}</h2>

        <div className="mt-8 grid grid-cols-3 gap-1 bg-cream p-1 text-[13px] font-medium">
          {(["email", "google", "phone"] as Mode[]).map((item) => (
            <button key={item} className={`h-10 capitalize transition-colors ${mode === item ? "bg-ink text-white" : "text-ink/70"}`} onClick={() => setMode(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4">
          {mode !== "google" && action === "register" && (
            <label className="form-field">Name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          )}
          {mode === "email" && (
            <>
              <label className="form-field">Email<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label className="form-field">Password<input type="password" autoComplete={action === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
              <button className="btn btn-primary h-12" disabled={!firebaseReady} onClick={() => run(
                () => action === "login" ? loginWithEmail(form.email, form.password) : registerWithEmail(form.name, form.email, form.password),
                action === "login" ? "Welcome back." : "Your account is ready.",
              )}><Mail size={16} /> {action === "login" ? "Sign in" : "Register"}</button>
              <button className="text-sm text-ink/70 link-underline justify-self-center" onClick={() => setAction(action === "login" ? "register" : "login")}>
                {action === "login" ? "New here? Create an account" : "Already registered? Sign in"}
              </button>
            </>
          )}
          {mode === "google" && (
            <button className="btn btn-primary h-12" disabled={!firebaseReady} onClick={() => run(loginWithGoogle, "Google sign-in complete.")}><Mail size={16} /> Continue with Google</button>
          )}
          {mode === "phone" && (
            <>
              <label className="form-field">Phone<input type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <button className="btn btn-primary h-12" disabled={!firebaseReady} onClick={sendOtp}><Phone size={16} /> Send OTP</button>
              {confirmation && <>
                <label className="form-field">OTP<input inputMode="numeric" autoComplete="one-time-code" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value })} /></label>
                <button className="btn btn-outline" onClick={() => run(() => confirmPhoneOtp(confirmation, form.otp, form.name || "BAAGAY customer"), "Phone verified.")}>Verify OTP</button>
              </>}
            </>
          )}
          <div id="auth-recaptcha" />
          {status && <p role="status" className="rounded-2xl bg-paper p-3 text-sm text-mute">{status}</p>}
        </div>
      </section>
    </div>
  );
}
