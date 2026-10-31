import { Router } from 'express';
import { getDailyPuzzle, submitDailyPuzzle } from '../controllers/daily.controller';

const router = Router();

router.get('/', getDailyPuzzle);
router.post('/submit', submitDailyPuzzle);

export default router;
