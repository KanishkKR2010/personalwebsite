import os
import sqlite3
import datetime
from typing import Optional, Tuple, Dict, Any

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt


DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")
WEB_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    ensure_db()

    @app.get("/api/health")
    def health() -> Any:
        return {"status": "ok"}

    @app.post("/api/auth/register")
    def register() -> Any:
        payload = request.get_json(silent=True) or {}
        full_name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        role = (payload.get("role") or "student").strip().lower()

        if not full_name or not email or not password:
            return jsonify({"error": "name, email and password are required"}), 400

        if role not in ("student", "teacher", "admin"):
            return jsonify({"error": "invalid role"}), 400

        with db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email=?", (email,))
            if cur.fetchone():
                return jsonify({"error": "email already registered"}), 409

            password_hash = generate_password_hash(password)
            now = datetime.datetime.utcnow().isoformat()
            cur.execute(
                "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (full_name, email, password_hash, role, now),
            )
            user_id = cur.lastrowid

        token = issue_token(user_id, email, role)
        return jsonify({"token": token, "user": {"id": user_id, "name": full_name, "email": email, "role": role}})

    @app.post("/api/auth/login")
    def login() -> Any:
        payload = request.get_json(silent=True) or {}
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        with db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, name, email, password_hash, role FROM users WHERE email=?", (email,))
            row = cur.fetchone()
            if not row or not check_password_hash(row[3], password):
                return jsonify({"error": "invalid credentials"}), 401

            user = {"id": row[0], "name": row[1], "email": row[2], "role": row[4]}

        token = issue_token(user["id"], user["email"], user["role"])
        return jsonify({"token": token, "user": user})

    @app.get("/api/me")
    def me() -> Any:
        auth = authenticate_request(request)
        if auth[0] is None:
            return jsonify({"error": auth[1]}), 401
        return jsonify({"user": auth[0]})

    @app.get("/api/dashboard")
    def dashboard() -> Any:
        auth = authenticate_request(request)
        if auth[0] is None:
            return jsonify({"error": auth[1]}), 401

        user = auth[0]
        data: Dict[str, Any] = {
            "welcome": f"Welcome, {user['name']}!",
            "role": user["role"],
            "cards": [],
        }

        if user["role"] == "student":
            data["cards"] = [
                {"title": "My Courses", "value": 5},
                {"title": "Assignments Due", "value": 2},
                {"title": "GPA", "value": 3.8},
            ]
        elif user["role"] == "teacher":
            data["cards"] = [
                {"title": "Classes", "value": 3},
                {"title": "Papers to Grade", "value": 18},
                {"title": "Meetings Today", "value": 1},
            ]
        else:  # admin
            with db() as conn:
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM users")
                total_users = cur.fetchone()[0] or 0
            data["cards"] = [
                {"title": "Total Users", "value": total_users},
                {"title": "System Health", "value": "OK"},
                {"title": "Pending Requests", "value": 4},
            ]

        return jsonify(data)

    # Static file serving (single-origin app: HTML + API on port 8080)
    @app.get("/")
    def serve_index() -> Any:
        return send_from_directory(WEB_ROOT, "index.html")

    @app.get("/<path:path>")
    def serve_static(path: str) -> Any:
        # Prevent catching API routes
        if path.startswith("api/"):
            return jsonify({"error": "not found"}), 404
        try:
            return send_from_directory(WEB_ROOT, path)
        except Exception:
            # Fallback to index for unknown paths (basic SPA-like behavior)
            return send_from_directory(WEB_ROOT, "index.html")

    return app


def ensure_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def issue_token(user_id: int, email: str, role: str) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + datetime.timedelta(hours=8),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def authenticate_request(req) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    header = req.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, "missing bearer token"
    token = header.split(" ", 1)[1].strip()
    payload = verify_token(token)
    if not payload:
        return None, "invalid or expired token"

    user_id = payload.get("sub")
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, role FROM users WHERE id=?", (user_id,))
        row = cur.fetchone()
        if not row:
            return None, "user not found"
        user = {"id": row[0], "name": row[1], "email": row[2], "role": row[3]}
        return user, None


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)

