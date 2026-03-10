import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    ticketReferenceCode: { type: String, required: true, index: true },
    sender: {
      id: String,
      name: String,
      role: String,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
