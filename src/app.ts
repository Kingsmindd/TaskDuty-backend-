import express from "express";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "TaskDuty API is running",
  });
});

app.use("/api/tasks", taskRoutes);

app.use("/api/auth", authRoutes);

export default app;
