import { Router } from "express";
import { getDb } from "../db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticateToken, (req, res) => {
	res.json({ user: req.user });
});

router.get("/student", authenticateToken, requireRole("student"), (req, res) => {
	const db = getDb();
	const courses = db.prepare(
		`SELECT c.id, c.title, c.description
		 FROM enrollments e JOIN courses c ON e.course_id=c.id
		 WHERE e.student_id=?`
	).all(req.user.id);
	res.json({ courses });
});

router.get("/teacher", authenticateToken, requireRole("teacher"), (_req, res) => {
	// For demo, teachers see all courses and enrolled counts
	const db = getDb();
	const rows = db.prepare(
		`SELECT c.id, c.title, COUNT(e.id) as enrolled
		 FROM courses c LEFT JOIN enrollments e ON c.id=e.course_id
		 GROUP BY c.id, c.title`
	).all();
	res.json({ courses: rows });
});

router.get("/admin", authenticateToken, requireRole("admin"), (_req, res) => {
	const db = getDb();
	const userCounts = db.prepare(
		"SELECT role, COUNT(1) as count FROM users GROUP BY role"
	).all();
	res.json({ summary: userCounts });
});

export default router;

