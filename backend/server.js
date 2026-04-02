const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Lead = require("./models/lead");
const Agent = require("./models/agent");
const TeamLead = require("./models/teamLead");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

app.get("/", (req, res) => {
  res.send("Server running");
});

// get single lead by lead_id
app.get("/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.aggregate([
      { $match: { lead_id: req.params.id } },
      {
        $lookup: {
          from: "agents",
          let: { assignedId: "$assigned_agent" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$assignedId"] } } },
            { $project: { name: 1 } }
          ],
          as: "agent_lookup"
        }
      },
      {
        $addFields: {
          agent_name: {
            $cond: {
              if: { $gt: [{ $size: "$agent_lookup" }, 0] },
              then: { $arrayElemAt: ["$agent_lookup.name", 0] },
              else: "Unassigned"
            }
          }
        }
      },
      {
        $lookup: {
          from: "agents",
          let: { previousId: "$previous_agent" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$previousId"] } } },
            { $project: { name: 1 } }
          ],
          as: "previous_agent_lookup"
        }
      },
      {
        $addFields: {
          previous_agent_name: {
            $cond: {
              if: { $gt: [{ $size: "$previous_agent_lookup" }, 0] },
              then: { $arrayElemAt: ["$previous_agent_lookup.name", 0] },
              else: "None"
            }
          }
        }
      },
      { $project: { agent_lookup: 0, previous_agent_lookup: 0 } }
    ]);

    if (!lead || lead.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(lead[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all leads from database
// get agent's own leads (assigned to them, assigned/closed status only)
app.get("/my-leads/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const leads = await Lead.aggregate([
      {
        $match: {
          assigned_agent: chatId,
          status: { $in: ['assigned', 'closed'] }
        }
      },
      { $sort: { created_time: -1 } },
      {
        $lookup: {
          from: "agents",
          let: { assignedId: "$assigned_agent" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$assignedId"] } } },
            { $project: { name: 1 } }
          ],
          as: "agent_lookup"
        }
      },
      {
        $addFields: {
          agent_name: {
            $cond: {
              if: { $gt: [{ $size: "$agent_lookup" }, 0] },
              then: { $arrayElemAt: ["$agent_lookup.name", 0] },
              else: "Unassigned"
            }
          }
        }
      },
      {
        $project: { agent_lookup: 0 }
      }
    ]);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.aggregate([
      { $sort: { created_time: -1 } },
      {
        $lookup: {
          from: "agents",
          let: { assignedId: "$assigned_agent" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$assignedId"] } } },
            { $project: { name: 1 } }
          ],
          as: "agent_lookup"
        }
      },
      {
        $addFields: {
          agent_name: {
            $cond: {
              if: { $gt: [{ $size: "$agent_lookup" }, 0] },
              then: { $arrayElemAt: ["$agent_lookup.name", 0] },
              else: "Unassigned"
            }
          }
        }
      },
      {
        $lookup: {
          from: "agents",
          let: { previousId: "$previous_agent" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chatId", "$$previousId"] } } },
            { $project: { name: 1 } }
          ],
          as: "previous_agent_lookup"
        }
      },
      {
        $addFields: {
          previous_agent_name: {
            $cond: {
              if: { $gt: [{ $size: "$previous_agent_lookup" }, 0] },
              then: { $arrayElemAt: ["$previous_agent_lookup.name", 0] },
              else: "None"
            }
          }
        }
      },
      {
        $project: {
          agent_lookup: 0,
          previous_agent_lookup: 0
        }
      }
    ]);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all agents from database
app.get("/agents", async (req, res) => {
  try {
    const agents = await Agent.find({}).sort({ createdAt: -1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create agent (team lead onboarding — auto-generates a password)
app.post("/agents", async (req, res) => {
  try {
    const { name, chatId, status, mobileNumber } = req.body;
    if (!name || !chatId || !mobileNumber) {
      return res.status(400).json({ error: "name, chatId, and mobileNumber are required" });
    }

    const existing = await Agent.findOne({ chatId });
    if (existing) {
      return res.status(409).json({ error: "Agent with this chatId already exists" });
    }

    // Generate a random 10-char password for the agent
    const plainPassword = Math.random().toString(36).slice(2, 7).toUpperCase() +
                          Math.random().toString(36).slice(2, 7) +
                          Math.floor(10 + Math.random() * 90);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const agent = new Agent({
      name,
      chatId,
      status: status || "active",
      mobileNumber,
      password: hashedPassword
    });
    await agent.save();

    // Return the plain password ONCE so the team lead can share it
    res.status(201).json({ ...agent.toObject(), generatedPassword: plainPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single agent by chatId
app.get("/agents/:chatId", async (req, res) => {
  try {
    const agent = await Agent.findOne({ chatId: req.params.chatId });
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update agent details by chatId
app.put("/agents/:chatId", async (req, res) => {
  try {
    const { name, mobileNumber, status } = req.body;
    const updated = await Agent.findOneAndUpdate(
      { chatId: req.params.chatId },
      { name, mobileNumber, status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Agent not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete / remove agent by chatId
app.delete("/agents/:chatId", async (req, res) => {
  try {
    const deleted = await Agent.findOneAndDelete({ chatId: req.params.chatId });
    if (!deleted) return res.status(404).json({ error: "Agent not found" });
    res.json({ message: "Agent removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// assign lead to agent (updates current and previous agent)
app.put("/update-lead", async (req, res) => {
  try {
    const { lead_id, assigned_agent, status, notes } = req.body;

    const existingLead = await Lead.findOne({ lead_id });
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Handle previous_agent logic (if agent changed)
    const previous_agent = assigned_agent !== existingLead.assigned_agent ? existingLead.assigned_agent : existingLead.previous_agent;

    const updated = await Lead.findOneAndUpdate(
      { lead_id },
      {
        assigned_agent,
        status,
        previous_agent,
        last_update: new Date().toISOString(),
        notes: notes || existingLead.notes
      },
      { new: true }
    );

    // Trigger n8n webhook for Google Sheets sync
    if (N8N_WEBHOOK_URL) {
      console.log("Triggering n8n webhook:", N8N_WEBHOOK_URL);
      axios.post(N8N_WEBHOOK_URL, {
        lead_id,
        name: updated.name,
        phone: updated.phone,
        requirement: updated.requirement,
        budget: updated.budget,
        assigned_agent: updated.assigned_agent,
        previous_agent: updated.previous_agent,
        status: updated.status,
        notes: updated.notes,
        last_update: updated.last_update
      })
      .then(res => console.log("n8n webhook success:", res.status))
      .catch(err => console.error("n8n webhook error:", err.response?.status, err.message));
    } else {
      console.log("N8N_WEBHOOK_URL not set, skipping webhook");
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/assign", async (req, res) => {
  try {
    const { lead_id, assigned_agent } = req.body;

    const existingLead = await Lead.findOne({ lead_id });
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const updated = await Lead.findOneAndUpdate(
      { lead_id },
      {
        previous_agent: existingLead.assigned_agent || null,
        assigned_agent,
        status: "assigned",
        last_update: new Date().toISOString()
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// unassign lead from agent (move back to queue)
app.put("/unassign-lead", async (req, res) => {
  try {
    const { lead_id } = req.body;

    const existingLead = await Lead.findOne({ lead_id });
    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const updated = await Lead.findOneAndUpdate(
      { lead_id },
      {
        assigned_agent: null,
        previous_agent: existingLead.assigned_agent || null,
        status: "queued",
        last_update: new Date().toISOString()
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// --- AUTHENTICATION ENDPOINTS ---

app.post("/auth/signup", async (req, res) => {
  try {
    const { role, email, password, name, phone, requirement, budget, mobileNumber, chatId } = req.body;
    
    if (!role || !email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "agent") {
      const existing = await Agent.findOne({ email });
      if (existing) return res.status(409).json({ error: "Email already in use" });
      
      const newChatId = chatId || `AGT-${Date.now()}`;
      const agent = new Agent({
        name,
        email,
        password: hashedPassword,
        mobileNumber: mobileNumber || phone, // fallback
        chatId: newChatId,
        status: "active"
      });
      await agent.save();
      return res.status(201).json({ message: "Agent created successfully" });
    } else if (role === "team_lead") {
      const existing = await TeamLead.findOne({ email });
      if (existing) return res.status(409).json({ error: "Email already in use" });
      
      const teamLead = new TeamLead({
        name,
        email,
        password: hashedPassword,
      });
      await teamLead.save();
      return res.status(201).json({ message: "Team Lead created successfully" });
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { role, email, password, chatId } = req.body;

    if (!role || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user;
    if (role === "agent") {
      // Agents log in with chatId, not email
      if (!chatId) return res.status(400).json({ error: "chatId is required for agent login" });
      user = await Agent.findOne({ chatId });
    } else if (role === "team_lead") {
      if (!email) return res.status(400).json({ error: "email is required for team lead login" });
      user = await TeamLead.findOne({ email });
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Account has no password set. Contact your team lead." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role, chatId: user.chatId || null },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userPayload = { name: user.name };
    if (role === "agent") {
      userPayload.chatId = user.chatId;
    } else {
      userPayload.email = user.email;
    }
    res.json({ token, role, user: userPayload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});

