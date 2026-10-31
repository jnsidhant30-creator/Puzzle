import { Request, Response, NextFunction } from 'express';
import db from '../config/db';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username } = req.body;
    res.status(201).json({ success: true, data: { email, username } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ success: true, token: 'mock-jwt-token' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ success: true, token: 'new-mock-jwt-token' });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
