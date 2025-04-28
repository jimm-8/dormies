import fs from "fs";
import { put } from "@vercel/blob"; // Ensure this package is installed
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
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Failed to parse form data" });
      }

      const file = files.file && files.file[0]; // Assuming single file upload
      const filename = fields.filename[0]; // Assuming single filename field

      if (!file || !filename) {
        return res.status(400).json({ error: "Missing file or filename" });
      }

      // Read file content
      const fileData = await fs.promises.readFile(file.filepath);

      // Upload to Vercel Blob
      const blob = await put(filename, fileData, {
        access: "public",
        contentType: file.mimetype,
      });

      return res.status(200).json(blob); // Return the blob info (including URL)
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return res.status(500).json({ error: error.message });
  }
}
