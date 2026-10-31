import { Router } from 'express';
import { getPuzzles, getPuzzleById, createPuzzle, updatePuzzle, deletePuzzle } from '../controllers/puzzle.controller';

const router = Router();

router.route('/')
  .get(getPuzzles)
  .post(createPuzzle); // admin only later

router.route('/:id')
  .get(getPuzzleById)
  .put(updatePuzzle) // admin only later
  .delete(deletePuzzle); // admin only later

export default router;
