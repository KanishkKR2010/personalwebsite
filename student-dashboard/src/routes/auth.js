import { Router } from "express";
import { getDb } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ error: "Email and password required" });

	const db = getDb();
	const user = db.prepare("SELECT id, name, email, password_hash, role FROM users WHERE email=?").get(email);
	if (!user) return res.status(401).json({ error: "Invalid credentials" });

	const valid = bcrypt.compareSync(password, user.password_hash);
	if (!valid) return res.status(401).json({ error: "Invalid credentials" });

	const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
	return res.json({ token, role: user.role, name: user.name });
});

export default router;

