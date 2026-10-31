import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller';
// import { protect } from '../middleware/auth';

const router = Router();

// router.use(protect); // Will add in Phase 4
router.get('/me', getMe);
router.put('/me', updateMe);

export default router;
