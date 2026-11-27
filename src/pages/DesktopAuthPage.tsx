import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/ui/Button';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export const DesktopAuthPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const rawPort = Number(params.get('port'));
  const isMobileFlow = params.get('mobile') === '1';
  const state = params.get('state') || '';
  const validDesktopParams =
    !isMobileFlow && Number.isInteger(rawPort) && rawPort >= 1024 && rawPort <= 65535 && /^[a-f0-9]{24,128}$/i.test(state);
  const validMobileParams = isMobileFlow && /^[a-f0-9]{24,128}$/i.test(state);
  const validParams = validDesktopParams || validMobileParams;

  const [status, setStatus] = useState<'ready' | 'signing_in' | 'done' | 'error'>(
    validParams ? 'ready' : 'error'
  );
  const [message, setMessage] = useState<string>(
    validParams
      ? `Click below to sign in with Google in your browser and return the session to PuzzleVerse ${isMobileFlow ? 'Android' : 'Desktop'}.`
      : 'Invalid or expired authentication request. Please restart sign-in from PuzzleVerse.'
  );

  useEffect(() => {
    document.title = `Sign in to PuzzleVerse ${isMobileFlow ? 'Mobile' : 'Desktop'}`;
  }, [isMobileFlow]);

  const handleContinueGoogle = async () => {
    if (!validParams || status === 'signing_in') return;
    setStatus('signing_in');
    setMessage('Opening Google sign-in...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      if (!cred || (!cred.idToken && !cred.accessToken)) {
        throw new Error('Google sign-in completed without an OAuth token.');
      }

      if (validMobileParams) {
        const frag = new URLSearchParams();
        frag.set('state', state);
        if (cred.idToken) frag.set('idToken', cred.idToken);
        if (cred.accessToken) frag.set('accessToken', cred.accessToken);
        setStatus('done');
        setMessage('Signed in! Returning to PuzzleVerse Mobile...');
        window.location.href = `com.puzzleverse.app://auth#${frag.toString()}`;
        return;
      }

      const res = await fetch(`http://127.0.0.1:${rawPort}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          idToken: cred.idToken,
          accessToken: cred.accessToken,
        }),
      });
      if (!res.ok) {
        throw new Error('Could not connect back to PuzzleVerse Desktop on localhost.');
      }
      setStatus('done');
      setMessage('Signed in! Return to PuzzleVerse Desktop — you can safely close this tab.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Google sign-in failed. Please return to PuzzleVerse and retry.');
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
            {isMobileFlow ? 'Mobile Auth' : 'Desktop Auth'}
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold tracking-tight">
            Sign in to PuzzleVerse {isMobileFlow ? 'Mobile' : 'Desktop'}
          </h1>
          <p className="text-sm text-[#526575] leading-relaxed">{message}</p>
        </div>

        {status === 'done' && (
          <div className="p-3.5 rounded-lg bg-[#D1FAE5] border border-[#6EE7B7] text-[#065F46] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Authentication token delivered to PuzzleVerse.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please trigger Google Sign-In again from PuzzleVerse.</span>
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
