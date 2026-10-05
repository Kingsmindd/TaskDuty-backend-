import type { Request, Response } from "express";
import { z } from "zod";
import {
  createTask,
  deleteUserTask,
  getUserTaskById,
  getUserTasks,
  updateUserTask,
} from "../services/taskService.js";

// CREATE TASK VALIDATION AND CONTROLLER

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(5000, "Description must not exceed 5000 characters")
    .default(""),
});

export async function create(req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId;

  if (typeof userId !== "string") {
    res.status(401).json({
      message: "Authentication is required",
    });
    return;
  }

  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid task data",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const task = await createTask(result.data, userId);

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Task creation failed:", error);

    res.status(500).json({
      message: "Unable to create task",
    });
  }
}

// GET ALL TASK CONTROLLER

export async function getAll(_req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId;

  if (typeof userId !== "string") {
    res.status(401).json({
      message: "Authentication is required",
    });
    return;
  }

  try {
    const tasks = await getUserTasks(userId);

    res.status(200).json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  } catch (error) {
    console.error("Fetching tasks failed:", error);

    res.status(500).json({
      message: "Unable to retrieve tasks",
    });
  }
}

//GET A SINGLE TASK BY ID

export async function getOneTask(req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId;
  const taskId = req.params.id;

  if (typeof userId !== "string") {
    res.status(401).json({
      message: "Authentication is required",
    });
    return;
  }

  if (typeof taskId !== "string" || !/^[a-fA-F0-9]{24}$/.test(taskId)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  try {
    const task = await getUserTaskById(taskId, userId);

    if (!task) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      message: "Task retrieved successfully",
      task,
    });
  } catch (error) {
    console.error("Fetching task failed:", error);

    res.status(500).json({
      message: "Unable to retrieve task",
    });
  }
}

// UPDATE A TASK BY ID AND USERID  CONTROLLER

const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must not exceed 200 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "Description must not exceed 5000 characters")
      .optional(),

    completed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

// UPDATE TASK BY TASK ID AND USER ID

export async function update(req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId;
  const taskId = req.params.id;

  if (typeof userId !== "string") {
    res.status(401).json({
      message: "Authentication is required",
    });
    return;
  }

  if (typeof taskId !== "string" || !/^[a-fA-F0-9]{24}$/.test(taskId)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  const result = updateTaskSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid task update",
      errors: result.error.flatten(),
    });
    return;
  }

  try {
    const task = await updateUserTask(taskId, userId, result.data);

    if (!task) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Updating task failed:", error);

    res.status(500).json({
      message: "Unable to update task",
    });
  }
}

// DELETE TASK BY TASK ID AND USER ID

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId;
  const taskId = req.params.id;

  if (typeof userId !== "string") {
    res.status(401).json({
      message: "Authentication is required",
    });
    return;
  }

  if (typeof taskId !== "string" || !/^[a-fA-F0-9]{24}$/.test(taskId)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  try {
    const task = await deleteUserTask(taskId, userId);

    if (!task) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Deleting task failed:", error);

    res.status(500).json({
      message: "Unable to delete task",
    });
  }
}
