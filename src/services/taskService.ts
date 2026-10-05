import { Task } from "../models/Tasks.js";

// CREATE TASK SERVICE

interface CreateTaskInput {
  title: string;
  description: string;
}

export async function createTask(input: CreateTaskInput, userId: string) {
  const task = await Task.create({
    title: input.title,
    description: input.description,
    owner: userId,
  });

  return task;
}

// GET ALL TASK SERVICE

export async function getUserTasks(userId: string) {
  const tasks = await Task.find({
    owner: userId,
  }).sort({
    createdAt: -1,
  });

  return tasks;
}

// GET A SINGLE TASK BY TASK ID AND USER ID TOO

export async function getUserTaskById(taskId: string, userId: string) {
  const task = await Task.findOne({
    _id: taskId,
    owner: userId,
  });

  return task;
}

// UPDATE A SINGLE TASK BY TASKID AND USERID SERVICE

interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export async function updateUserTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
) {
  const task = await Task.findOneAndUpdate(
    {
      _id: taskId,
      owner: userId,
    },
    {
      $set: input,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return task;
}

// DELETE TASK BY ID AND USER ID

export async function deleteUserTask(taskId: string, userId: string) {
  const task = await Task.findOneAndDelete({
    _id: taskId,
    owner: userId,
  });

  return task;
}
