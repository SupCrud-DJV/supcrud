import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      id: String,
      name: String,
      role: String,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const TicketSchema = new mongoose.Schema(
  {
    referenceCode: { type: String, required: true, unique: true, index: true },
    workspaceKey: { type: String, required: true, index: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["P", "Q", "R", "S"], required: true },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"],
      default: "OPEN",
    },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    assignedAgentId: { type: String, default: null },

    messages: { type: [MessageSchema], default: [] },
    events: { type: [EventSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
