import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = "temp-id"; 
    
    const docRef = db.collection('users').doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = "temp-id";
    const { fullName, avatarUrl } = req.body;

    const docRef = db.collection('users').doc(userId);
    await docRef.set({ fullName, avatarUrl }, { merge: true });

    res.status(200).json({ success: true, data: { id: userId, fullName, avatarUrl } });
  } catch (error) {
    next(error);
  }
};
