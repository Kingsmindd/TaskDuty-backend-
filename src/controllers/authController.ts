import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { registerUser, loginUser } from "../services/authService.js";

// REGISTER CONTROLLER AND VALIDATION

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must have at least 8 characters")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 bytes",
    ),
});

export async function register(req: Request, res: Response): Promise<void> {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid registration data",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = await registerUser(result.data);

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({
        message: "Email is already registered",
      });
      return;
    }

    console.error("Registration failed:", error);

    res.status(500).json({
      message: "Unable to register user",
    });
  }
}

// LOGIN CONTROLLER AND VALIDATION

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 bytes",
    ),
});

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid login data",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const data = await loginUser(result.data);

    if (!data) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    res.status(200).json({
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      message: "Unable to log in",
    });
  }
}
