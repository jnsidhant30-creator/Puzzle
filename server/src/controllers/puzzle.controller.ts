import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const getPuzzles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, difficulty, categoryId } = req.query;
    
    let query: any = db.collection('puzzles').where('isPublished', '==', true);
    if (type) query = query.where('type', '==', type);
    if (difficulty) query = query.where('difficulty', '==', difficulty);
    if (categoryId) query = query.where('categoryId', '==', categoryId);

    const snapshot = await query.get();
    const puzzles = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, count: puzzles.length, data: puzzles });
  } catch (error) {
    next(error);
  }
};

export const getPuzzleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docRef = db.collection('puzzles').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Puzzle not found' });
    }

    res.status(200).json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
  } catch (error) {
    next(error);
  }
};

export const createPuzzle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docRef = await db.collection('puzzles').add(req.body);
    const newDoc = await docRef.get();
    res.status(201).json({ success: true, data: { id: newDoc.id, ...newDoc.data() } });
  } catch (error) {
    next(error);
  }
};

export const updatePuzzle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docRef = db.collection('puzzles').doc(req.params.id);
    await docRef.update(req.body);
    res.status(200).json({ success: true, data: { id: req.params.id, ...req.body } });
  } catch (error) {
    next(error);
  }
};

export const deletePuzzle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.collection('puzzles').doc(req.params.id).delete();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
