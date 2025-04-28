import fs from "fs";
import { put } from "@vercel/blob"; // Make sure it's installed
import formidable from "formidable";

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse the multipart form data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Failed to parse form data" });
      }

      const file = files.file;
      const filename = fields.filename;

      if (!file || !filename) {
        return res.status(400).json({ error: "Missing file or filename" });
      }

      // Log files and fields for debugging
      console.log("Parsed fields:", fields);
      console.log("Parsed files:", files);

      // Read the file content
      const fileData = await fs.promises.readFile(file.filepath);

      // Upload to Vercel Blob (ensure 'put' method is valid)
      const blob = await put(filename, fileData, {
        access: "public",
        contentType: file.mimetype,
      });

      // Return the URL and other blob info
      return res.status(200).json(blob);
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: error.message });
  }
}
