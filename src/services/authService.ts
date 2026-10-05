import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

// REGISTER SERVICE

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

interface LoginInput {
  email: string;
  password: string;
}

//LOGIN SERVICE

export async function loginUser(input: LoginInput) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  const user = await User.findOne({
    email: input.email,
  }).select("+password");

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign({}, secret, {
    subject: user._id.toString(),
    expiresIn: "3h",
    algorithm: "HS256",
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
}
