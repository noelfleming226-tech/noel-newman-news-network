"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { type LoginState, loginAction } from "./actions";

const INITIAL_STATE: LoginState = {};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_STATE);

  useEffect(() => {
    if (!state.error) {
      router.replace("/staff");
      router.refresh();
    }
  }, [router, state.error]);

  return (
    <form action={formAction} className="staff-auth-form">
      <label>
        Username or Email
        <input type="text" name="identifier" required autoComplete="username" />
      </label>
      <label>
        Password
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      {state.error ? <p className="form-message form-message--error">{state.error}</p> : null}
      <button type="submit" className="button button--primary" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
