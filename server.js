const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Set up multer storage to save files in /tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join("/tmp", req.body.folderPath);
    fs.mkdirSync(folderPath, { recursive: true }); // Create folder if it doesn't exist
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// POST endpoint for image upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    const fileUrl = `/tmp/${req.body.folderPath}/${req.file.filename}`;
    res.json({ success: true, fileUrl: fileUrl });
  } else {
    res.status(400).json({ success: false, error: "No file uploaded" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
