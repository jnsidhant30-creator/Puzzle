import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const getDailyPuzzle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await db.collection('dailyPuzzles').where('date', '==', today).limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'No daily puzzle for today' });
    }

    const data = snapshot.docs[0].data();
    res.status(200).json({ success: true, data: { id: snapshot.docs[0].id, ...data } });
  } catch (error) {
    next(error);
  }
};

export const submitDailyPuzzle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ success: true, message: 'Daily puzzle submitted' });
  } catch (error) {
    next(error);
  }
};
