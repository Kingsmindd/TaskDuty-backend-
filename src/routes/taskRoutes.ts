import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  create,
  deleteTask,
  getAll,
  getOneTask,
  update,
} from "../controllers/taskControllers.js";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/", getAll);

router.get("/:id", getOneTask);

router.patch("/:id", update);

router.delete("/:id", deleteTask);

export default router;
