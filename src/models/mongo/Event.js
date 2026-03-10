import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    ticketReferenceCode: { type: String, required: true, index: true },
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
