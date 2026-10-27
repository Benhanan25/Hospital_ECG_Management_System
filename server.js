const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/uploads",
    express.static(uploadDir)
);

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            message:
                "Hospital ECG Backend is working!",
            database:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "not connected"
        });
    }
);

app.use(
    "/api/auth",
    require("./routes/authRoutes")
);

app.use(
    "/api/patients",
    require("./routes/patientRoutes")
);

app.use(
    "/api/ecg",
    require("./routes/ecgRoutes")
);

app.use(
    (req, res, next) => {
        if (
            req.method === "GET" &&
            !req.path.startsWith("/api/")
        ) {
            return res.sendFile(
                path.join(
                    __dirname,
                    "public",
                    "index.html"
                )
            );
        }

        next();
    }
);

const mongoURI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/hospital_ecg";

mongoose
    .connect(mongoURI)
    .then(() => {
        console.log(
            "MongoDB connected successfully"
        );

        app.listen(
            PORT,
            () => {
                console.log(
                    `Server running at http://localhost:${PORT}`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });