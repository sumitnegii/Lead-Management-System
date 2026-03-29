const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  chatId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["active", "inactive", "away", "busy"], default: "active" },
  mobileNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Agent", agentSchema);
