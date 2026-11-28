import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getRedirectResult, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const DESKTOP_AUTH_CTX_KEY = 'pv_desktop_oauth_ctx_v1';

interface DesktopAuthParams {
  port: number;
  state: string;
  cc: string;
}

function parseDesktopParams(): DesktopAuthParams | null {
  const params = new URLSearchParams(window.location.search);
  const rawPort = Number(params.get('port'));
  const state = params.get('state') || '';
  const cc = params.get('cc') || '';
  if (
    Number.isInteger(rawPort) &&
    rawPort >= 1024 &&
    rawPort <= 65535 &&
    /^[a-f0-9]{24,128}$/i.test(state) &&
    /^[A-Za-z0-9_-]{32,128}$/.test(cc)
  ) {
    return { port: rawPort, state, cc };
  }
  try {
    const saved = sessionStorage.getItem(DESKTOP_AUTH_CTX_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DesktopAuthParams;
      if (
        Number.isInteger(parsed.port) &&
        parsed.port >= 1024 &&
        parsed.port <= 65535 &&
        /^[a-f0-9]{24,128}$/i.test(parsed.state) &&
        /^[A-Za-z0-9_-]{32,128}$/.test(parsed.cc)
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read issue
  }
  return null;
}

function submitViaHiddenForm(targetPort: number, payload: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `http://127.0.0.1:${targetPort}/callback`;
  Object.entries(payload).forEach(([key, val]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = val;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export const DesktopAuthPage: React.FC = () => {
  const authCtx = useMemo(() => parseDesktopParams(), []);
  const validParams = Boolean(authCtx);

  const [status, setStatus] = useState<'ready' | 'signing_in' | 'done' | 'error'>(
    validParams ? 'ready' : 'error'
  );
  const [message, setMessage] = useState<string>(
    validParams
      ? 'Click below to sign in with Google in your browser and securely return your session to PuzzleVerse Desktop.'
      : 'Invalid or expired desktop authentication request. Please start Google Sign-In again from PuzzleVerse Desktop.'
  );

  const deliverCredentialsToDesktop = useCallback(
    async (ctx: DesktopAuthParams, idToken: string, accessToken: string) => {
      try {
        sessionStorage.removeItem(DESKTOP_AUTH_CTX_KEY);
      } catch {}

      try {
        const res = await fetch(`http://127.0.0.1:${ctx.port}/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: ctx.state,
            cc: ctx.cc,
            idToken: idToken || undefined,
            accessToken: accessToken || undefined,
          }),
        });
        if (!res.ok) {
          throw new Error('Loopback confirmation returned non-200.');
        }
        setStatus('done');
        setMessage('Signed in! Return to PuzzleVerse Desktop — you can safely close this tab.');
      } catch {
        // Fallback when browser shields/PNA block background fetch() to 127.0.0.1
        setStatus('done');
        setMessage('Completing handoff to PuzzleVerse Desktop...');
        submitViaHiddenForm(ctx.port, {
          state: ctx.state,
          cc: ctx.cc,
          idToken,
          accessToken,
        });
      }
    },
    []
  );

  useEffect(() => {
    document.title = 'Sign in to PuzzleVerse Desktop';
    if (!authCtx) return;

    getRedirectResult(auth)
      .then((res) => {
        if (!res) return;
        const cred = GoogleAuthProvider.credentialFromResult(res);
        if (cred && (cred.idToken || cred.accessToken)) {
          return deliverCredentialsToDesktop(authCtx, cred.idToken || '', cred.accessToken || '');
        }
      })
      .catch(() => {});
  }, [authCtx, deliverCredentialsToDesktop]);

  const handleContinueGoogle = async () => {
    if (!authCtx || status === 'signing_in') return;
    setStatus('signing_in');
    setMessage('Opening Google account chooser...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (!cred || (!cred.idToken && !cred.accessToken)) {
        throw new Error('Google sign-in completed without an OAuth credential.');
      }
      await deliverCredentialsToDesktop(authCtx, cred.idToken || '', cred.accessToken || '');
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          sessionStorage.setItem(DESKTOP_AUTH_CTX_KEY, JSON.stringify(authCtx));
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setStatus('error');
          setMessage(redirectErr?.message || 'Browser blocked sign-in popup and redirect failed.');
          return;
        }
      }
      setStatus('error');
      setMessage(
        err?.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in popup was closed. Click below to retry.'
          : err?.message || 'Google sign-in failed. Please return to PuzzleVerse Desktop and retry.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#142331] text-[#F5F7F8] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#F5F2E9] text-[#142331] border border-[#D5DEDB] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="bg-[#142331] px-3 py-2 rounded-lg inline-flex">
            <BrandLogo size={26} />
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#D7F1EC] border border-[#087F8C] text-[#142331]">
            Desktop Auth
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold tracking-tight">Sign in to PuzzleVerse Desktop</h1>
          <p className="text-sm text-[#526575] leading-relaxed">{message}</p>
        </div>

        {status === 'done' && (
          <div className="p-3.5 rounded-lg bg-[#D1FAE5] border border-[#6EE7B7] text-[#065F46] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Authentication token delivered securely to PuzzleVerse Desktop.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please retry or trigger Google Sign-In again from PuzzleVerse Desktop.</span>
          </div>
        )}

        {(status === 'ready' || status === 'signing_in' || (status === 'error' && validParams)) && (
          <Button
            variant="primary"
            size="lg"
            loading={status === 'signing_in'}
            onClick={handleContinueGoogle}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Continue with Google</span>
          </Button>
        )}

        <div className="pt-2 border-t border-[#D5DEDB] text-xs text-[#526575] flex items-center justify-between">
          <a href="/login" className="font-semibold text-[#066B75] hover:underline">
            Back to Web Sign-In
          </a>
          <a href="/download" className="font-semibold text-[#066B75] hover:underline">
            Download Apps
          </a>
        </div>
      </div>
    </div>
  );
};
