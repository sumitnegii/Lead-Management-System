const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  lead_id: String,
  name: String,
  phone: String,
  requirement: String,
  budget: Number,
  user_chat_id: Number,
  status: String,
  assigned_agent: String,
  previous_agent: String,
  last_update: String,
  created_time: String,
  notes: String
});

module.exports = mongoose.model("Lead", leadSchema);