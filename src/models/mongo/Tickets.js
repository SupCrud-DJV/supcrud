import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String },
  created_by: { type: Number }, // user id from PostgreSQL
  created_at: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  created_by: { type: Number, required: true }, // user id from PostgreSQL
  created_at: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  workspace_id: { type: String, required: true },
  reference_code: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['P','Q','R','S'], required: true },
  status: { type: String, enum: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'], default: 'OPEN' },
  priority: { type: String, enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
  assigned_to: { type: String, default: null }, // agent user id
  messages: [messageSchema],
  events: [eventSchema],
}, { timestamps: true });

// Index for fast workspace queries
ticketSchema.index({ workspace_id: 1, status: 1 });


export default mongoose.model('Ticket', ticketSchema);