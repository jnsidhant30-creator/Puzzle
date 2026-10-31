import { Router } from 'express';
import { getGlobalLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/global', getGlobalLeaderboard);
router.get('/daily', getGlobalLeaderboard); // mock for now
router.get('/weekly', getGlobalLeaderboard); // mock for now
router.get('/monthly', getGlobalLeaderboard); // mock for now

export default router;
