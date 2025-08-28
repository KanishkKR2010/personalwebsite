import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import { ensureDatabaseInitialized } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Initialize DB and seed if needed
ensureDatabaseInitialized();

// API routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Fallback to login page (Express 5: use regex for catch-all)
app.get(/.*/, (_req, res) => {
	res.sendFile(path.join(__dirname, "../public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});

