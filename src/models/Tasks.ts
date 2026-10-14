import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    category: { type: String, enum: ['Urgent', 'Important'], default: 'Important' },
    dueDate: { type: String, default: '' },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Task = model("Task", taskSchema);
