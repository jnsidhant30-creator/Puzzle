import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useBattleSubscription, setBattleReady, forceBattleStatus, acceptFriendBattle } from '../../services/battleService';
import { LiveBattle } from './LiveBattle';
import { Button } from '../../components/ui/Button';
import { Swords, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useLiveAnnouncer } from '../../components/common/LiveAnnouncer';

export const BattleResolver = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { battle, loading, error } = useBattleSubscription(battleId || null);
  const { announce } = useLiveAnnouncer();

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!battle) return;

    // Handle Friend Battle Acceptance if we are the targeted targetUid and it's still waiting
    // Wait, the notification passes us here. If we are not playerA and playerB is null, we should accept it.
    if (battle.isFriendBattle && battle.status === 'waiting' && battle.playerA.uid !== user?.uid && !battle.playerB) {
      acceptFriendBattle(battle.id!).catch(err => {
        console.error("Failed to accept friend battle", err);
        alert("This challenge is no longer valid or you don't have permission.");
        navigate('/battle');
      });
    }

    if (battle.status === 'countdown' && battle.startedAt) {
      const target = battle.startedAt.toMillis();
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((target - now) / 1000);
        if (diff <= 0) {
          setCountdown(null);
          forceBattleStatus(battle.id!, 'active').catch(console.error);
          clearInterval(interval);
        } else {
          setCountdown(diff);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [battle, user?.uid, navigate]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-textMuted uppercase tracking-widest font-bold">Connecting to Battle...</p>
    </div>
  );

  if (error || !battle) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <XCircle className="w-12 h-12 text-error mb-4" />
      <h2 className="text-2xl font-bold text-textMain mb-2">Battle Not Found</h2>
      <p className="text-textMuted mb-6">This battle may have expired or was cancelled.</p>
      <Button onClick={() => navigate('/battle')} variant="secondary">Return to Dashboard</Button>
    </div>
  );

  const isPlayerA = battle.playerA.uid === user?.uid;
  const isPlayerB = battle.playerB?.uid === user?.uid;
  if (!isPlayerA && !isPlayerB) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <XCircle className="w-12 h-12 text-error mb-4" />
        <h2 className="text-2xl font-bold text-textMain mb-2">Access Denied</h2>
        <p className="text-textMuted mb-6">You are not a participant in this battle.</p>
        <Button onClick={() => navigate('/battle')} variant="secondary">Return to Dashboard</Button>
      </div>
    );
  }

  const me = isPlayerA ? battle.playerA : battle.playerB;
  const opp = isPlayerA ? battle.playerB : battle.playerA;

  const renderLobby = () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 max-w-4xl mx-auto w-full">
      <div className="w-full text-center mb-12 animate-in slide-in-from-top-4">
        <h1 className="text-4xl font-black text-textMain uppercase tracking-widest mb-2">Battle Lobby</h1>
        <p className="text-textMuted uppercase tracking-wider text-sm font-bold">
          {battle.gameType} • {battle.difficulty}
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full animate-in zoom-in duration-500 delay-100">
        
        {/* You */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${me?.ready ? 'border-success' : 'border-border/50 bg-surface'}`}>
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="You" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-textMuted">{me?.displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="text-center">
            <h3 className="font-bold text-textMain text-xl">{me?.displayName} (You)</h3>
            <p className={`text-sm font-bold uppercase tracking-wider ${me?.ready ? 'text-success' : 'text-textMuted'}`}>
              {me?.ready ? 'READY' : 'Waiting...'}
            </p>
          </div>
        </div>

        {/* VS Badge */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--color-primary),0.3)]">
            <Swords className="w-8 h-8" />
          </div>
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${!opp ? 'border-dashed border-border/50 animate-pulse' : opp.ready ? 'border-success' : 'border-border/50 bg-surface'}`}>
            {opp?.avatarUrl ? (
              <img src={opp.avatarUrl} alt="Opponent" className="w-full h-full rounded-full object-cover" />
            ) : opp ? (
              <span className="text-4xl font-bold text-textMuted">{opp.displayName.charAt(0).toUpperCase()}</span>
            ) : (
              <Loader2 className="w-8 h-8 text-textMuted animate-spin" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-bold text-textMain text-xl">{opp ? opp.displayName : 'Searching...'}</h3>
            <p className={`text-sm font-bold uppercase tracking-wider ${!opp ? 'text-textMuted' : opp.ready ? 'text-success' : 'text-textMuted'}`}>
              {!opp ? 'Waiting for opponent' : opp.ready ? 'READY' : 'Waiting...'}
            </p>
          </div>
        </div>

      </div>

      {battle.status === 'matched' && !me?.ready && (
        <div className="mt-16 animate-in slide-in-from-bottom-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-48 text-lg font-bold shadow-[0_0_20px_rgba(var(--color-primary),0.5)]"
            onClick={() => setBattleReady(battle.id!)}
          >
            READY UP
          </Button>
        </div>
      )}

      {battle.status === 'countdown' && countdown !== null && (
        <div className="mt-16 animate-in zoom-in">
          <h2 className="text-6xl md:text-8xl font-black text-primary drop-shadow-[0_0_20px_rgba(var(--color-primary),0.8)]">
            {countdown > 0 ? countdown : 'GO!'}
          </h2>
        </div>
      )}
    </div>
  );

  const renderResult = () => {
    const isWin = me?.result === 'VICTORY';
    const isDraw = me?.result === 'DRAW';

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 max-w-4xl mx-auto w-full">
        <div className="w-full text-center mb-12 animate-in slide-in-from-top-4">
          <h1 className={`text-5xl font-black uppercase tracking-widest mb-4 drop-shadow-lg ${isWin ? 'text-success' : isDraw ? 'text-textMain' : 'text-error'}`}>
            {me?.result}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 w-full animate-in zoom-in duration-500 delay-100">
          
          {/* You */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${isWin ? 'border-success' : 'border-border/50'}`}>
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="You" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-textMuted">{me?.displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-textMain text-xl">{me?.displayName}</h3>
              <p className="text-3xl font-black text-textMain my-2">{me?.score}</p>
              <p className="text-sm font-bold text-textMuted uppercase tracking-wider">
                Time: {me?.timeTaken !== undefined ? `${Math.floor(me.timeTaken / 60)}:${(me.timeTaken % 60).toString().padStart(2, '0')}` : 'DNF'}
              </p>
            </div>
          </div>

          {/* VS */}
          <div className="hidden md:flex flex-col items-center justify-center text-textMuted font-black text-2xl uppercase tracking-widest">
            VS
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-4 opacity-80">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${!isWin && !isDraw ? 'border-success' : 'border-border/50'}`}>
              {opp?.avatarUrl ? (
                <img src={opp.avatarUrl} alt="Opponent" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-textMuted">{opp?.displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-textMain text-xl">{opp?.displayName}</h3>
              <p className="text-3xl font-black text-textMain my-2">{opp?.score}</p>
              <p className="text-sm font-bold text-textMuted uppercase tracking-wider">
                Time: {opp?.timeTaken !== undefined ? `${Math.floor(opp.timeTaken / 60)}:${(opp.timeTaken % 60).toString().padStart(2, '0')}` : 'DNF'}
              </p>
            </div>
          </div>

        </div>

        <div className="mt-16 flex gap-4 animate-in slide-in-from-bottom-4">
          <Button onClick={() => navigate('/battle')} variant="secondary" size="lg">Back to Battles</Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="lg">Dashboard</Button>
        </div>
      </div>
    );
  };

  if (battle.status === 'waiting' || battle.status === 'matched' || battle.status === 'countdown') {
    return renderLobby();
  }

  if (battle.status === 'active') {
    return <LiveBattle battle={battle} />;
  }

  if (battle.status === 'completed') {
    return renderResult();
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <XCircle className="w-12 h-12 text-textMuted mb-4" />
      <h2 className="text-2xl font-bold text-textMain mb-2">Battle {battle.status}</h2>
      <p className="text-textMuted mb-6">This battle is no longer active.</p>
      <Button onClick={() => navigate('/battle')} variant="secondary">Return to Dashboard</Button>
    </div>
  );
};
