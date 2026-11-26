import { Router } from 'express';
import { getPublishedEvent } from '../services/eventService.js';
const router = Router();

router.get("/", async (req, res) => {
  const event = await getPublishedEvent();
  res.json(event)
});
export default router;
