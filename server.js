const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors"); // Import CORS middleware
const sanitize = require("sanitize-filename"); // Optional: For sanitizing file paths

const app = express();
const port = 3000;

// Use CORS middleware to allow cross-origin requests
app.use(cors({ origin: "https://dormies.vercel.app" })); // Allow requests only from your frontend domain

app.use(express.json()); // For parsing JSON payloads in POST requests

// Set up multer storage to save files in /tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sanitizedFolderPath = sanitize(req.body.folderPath); // Sanitize folder path
    const folderPath = path.join("/tmp", sanitizedFolderPath);

    // Create folder if it doesn't exist
    fs.mkdirSync(folderPath, { recursive: true });

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const sanitizedFileName = sanitize(`${Date.now()}_${file.originalname}`); // Sanitize the filename
    cb(null, sanitizedFileName);
  },
});

const upload = multer({ storage: storage });

// POST endpoint for image upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    const fileUrl = `/tmp/${sanitize(req.body.folderPath)}/${
      req.file.filename
    }`;
    res.json({ success: true, fileUrl: fileUrl });
  } else {
    res.status(400).json({ success: false, error: "No file uploaded" });
  }
});

// Serve static files (optional, if you want to serve files from /tmp directory)
app.use("/tmp", express.static(path.join(__dirname, "/tmp")));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
