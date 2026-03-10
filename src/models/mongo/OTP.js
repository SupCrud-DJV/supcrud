import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    ticketReferenceCode: { type: String, required: true, index: true },
    email: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
