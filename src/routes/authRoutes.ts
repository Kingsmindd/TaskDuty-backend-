import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/check", authenticate, (_req, res) => {
  res.status(200).json({
    message: "You are authenticated",
    userId: res.locals.userId,
  });
});

export default router;
