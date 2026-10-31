import { Router } from 'express';
import { startGame, submitMove, completeGame, getGameHistory } from '../controllers/game.controller';

const router = Router();

router.post('/start', startGame);
router.post('/:id/submit', submitMove);
router.post('/:id/complete', completeGame);
router.get('/history', getGameHistory);

export default router;
