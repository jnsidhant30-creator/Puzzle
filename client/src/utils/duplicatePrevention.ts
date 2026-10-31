export const generateFingerprint = (puzzleData: any): string => {
  try {
    return JSON.stringify(puzzleData);
  } catch {
    return String(Date.now());
  }
};

export const isDuplicatePuzzle = (gameType: string, fingerprint: string): boolean => {
  const historyRaw = localStorage.getItem(`puzzleHistory_${gameType}`);
  if (!historyRaw) return false;
  try {
    const history = JSON.parse(historyRaw) as string[];
    return history.includes(fingerprint);
  } catch {
    return false;
  }
};

export const recordPuzzleHistory = (gameType: string, fingerprint: string): void => {
  try {
    const historyRaw = localStorage.getItem(`puzzleHistory_${gameType}`);
    let history: string[] = [];
    if (historyRaw) {
      history = JSON.parse(historyRaw) as string[];
    }
    history.push(fingerprint);
    if (history.length > 20) {
      history = history.slice(history.length - 20);
    }
    localStorage.setItem(`puzzleHistory_${gameType}`, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
};
