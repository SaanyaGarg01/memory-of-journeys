// routes/memoryCircles.js
import express from "express";
import MemoryCircle from "../models/MemoryCircle.js";

const router = express.Router();

// GET all circles for a user
router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });

    const circles = await MemoryCircle.find({ user_id });
    res.json(circles);
  } catch (err) {
    console.error("Error fetching circles:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new circle
router.post("/", async (req, res) => {
  try {
    const { user_id, name, visibility, invited } = req.body;
    if (!user_id || !name)
      return res.status(400).json({ message: "Missing fields" });

    const circle = new MemoryCircle({
      user_id,
      name,
      visibility: visibility || "private",
      invited: invited || [],
      createdAt: new Date(),
    });

    await circle.save();
    res.status(201).json(circle);
  } catch (err) {
    console.error("Error creating circle:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
