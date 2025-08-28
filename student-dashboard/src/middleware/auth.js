import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (!token) return res.status(401).json({ error: "Missing token" });
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}

export function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ error: "Forbidden" });
		}
		next();
	};
}

