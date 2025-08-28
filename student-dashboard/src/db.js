import Database from "better-sqlite3";
import bcrypt from "bcrypt";

let db;

export function getDb() {
	if (!db) {
		db = new Database("./db/app.sqlite");
	}
	return db;
}

export function ensureDatabaseInitialized() {
	const database = getDb();

	// Create tables
	database.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('student','teacher','admin'))
		);
	`).run();

	database.prepare(`
		CREATE TABLE IF NOT EXISTS courses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT
		);
	`).run();

	database.prepare(`
		CREATE TABLE IF NOT EXISTS enrollments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id INTEGER NOT NULL,
			course_id INTEGER NOT NULL,
			FOREIGN KEY(student_id) REFERENCES users(id),
			FOREIGN KEY(course_id) REFERENCES courses(id)
		);
	`).run();

	// Seed minimal data if empty
	const userCount = database.prepare("SELECT COUNT(1) as c FROM users").get().c;
	if (userCount === 0) {
		const saltRounds = 10;
		const password = "password123";
		const hash = bcrypt.hashSync(password, saltRounds);

		const insertUser = database.prepare(
			"INSERT INTO users (name, email, password_hash, role) VALUES (@name, @email, @password_hash, @role)"
		);

		insertUser.run({ name: "Alice Student", email: "student@example.com", password_hash: hash, role: "student" });
		insertUser.run({ name: "Tom Teacher", email: "teacher@example.com", password_hash: hash, role: "teacher" });
		insertUser.run({ name: "Ada Admin", email: "admin@example.com", password_hash: hash, role: "admin" });

		const insertCourse = database.prepare("INSERT INTO courses (title, description) VALUES (?, ?)");
		const mathId = insertCourse.run("Math 101", "Introductory algebra").lastInsertRowid;
		const sciId = insertCourse.run("Science 101", "Basic physics").lastInsertRowid;

		const alice = database.prepare("SELECT id FROM users WHERE email=?").get("student@example.com");
		const enroll = database.prepare("INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)");
		enroll.run(alice.id, mathId);
		enroll.run(alice.id, sciId);

		console.log("Seeded database with sample users.\nLogin with: student@example.com / teacher@example.com / admin@example.com and password 'password123'");
	}
}

