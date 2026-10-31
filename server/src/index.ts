import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import puzzleRoutes from './routes/puzzle.routes';
import gameRoutes from './routes/game.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import dailyRoutes from './routes/daily.routes';
import { errorHandler } from './middleware/error';

dotenv.config({ path: '../.env' }); // Load from root

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'PuzzleVerse API is running' });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/daily-puzzle', dailyRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
