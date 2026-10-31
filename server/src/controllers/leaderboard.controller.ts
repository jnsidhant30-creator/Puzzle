import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await db.collection('leaderboards').orderBy('xp', 'desc').limit(50).get();
    
    const formatted = snapshot.docs.map((doc, i) => {
      const data = doc.data();
      return {
        rank: i + 1,
        userId: data.userId,
        username: data.username,
        xp: data.xp,
        level: data.level,
        gamesWon: data.gamesWon,
        avatarUrl: data.avatarUrl
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
