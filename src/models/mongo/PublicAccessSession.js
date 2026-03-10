import mongoose from 'mongoose';

const PublicAccessSessionSchema = new mongoose.Schema(
  {
    ticketReferenceCode: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.PublicAccessSession || mongoose.model('PublicAccessSession', PublicAccessSessionSchema);
