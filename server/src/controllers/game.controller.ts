import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const startGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = "temp-id";
    const { puzzleId, isDaily } = req.body;

    const data = {
      puzzleId,
      userId,
      isDaily: isDaily || false,
      state: 'PLAYING',
      startTime: new Date(),
      moves: 0
    };
    const docRef = await db.collection('gameSessions').add(data);

    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error) {
    next(error);
  }
};

export const submitMove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const docRef = db.collection('gameSessions').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
        await docRef.update({ moves: (docSnap.data()?.moves || 0) + 1 });
    }

    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const completeGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isSuccess, hintsUsed, clientDuration } = req.body;

    const docRef = db.collection('gameSessions').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return res.status(404).json({ success: false, message: 'Session not found' });
    const sessionData = docSnap.data() as any;

    const serverDuration = Math.floor((new Date().getTime() - sessionData.startTime.toDate().getTime()) / 1000);
    const duration = Math.abs(serverDuration - clientDuration) < 5 ? clientDuration : serverDuration;

    let score = 0;
    let xp = 0;

    if (isSuccess) {
      score = 100;
      xp = 50;
    }

    await docRef.update({
      state: isSuccess ? 'COMPLETED' : 'FAILED',
      endTime: new Date(),
      duration,
      hintsUsed,
      score,
      xpEarned: xp
    });

    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const getGameHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = "temp-id";
    const snapshot = await db.collection('gameSessions')
      .where('userId', '==', userId)
      .orderBy('startTime', 'desc')
      .limit(20)
      .get();
      
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
