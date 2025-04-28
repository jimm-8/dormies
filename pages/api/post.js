import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as formidable from "formidable";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.appspot.com",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Disable Next.js built-in body parser to handle form data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Error processing files" });
      }

      try {
        // Collect listing data
        const { title, address, description } = fields;

        // Add listing data to Firestore
        const newListingRef = await addDoc(collection(db, "listings"), {
          title: title[0],
          address: address[0],
          description: description[0],
          createdAt: new Date(),
        });

        // Handle file uploads
        const uploadedURLs = [];
        if (files.photos) {
          for (const file of files.photos) {
            const fileRef = ref(
              storage,
              `listings/${newListingRef.id}/${file.originalFilename}`
            );
            await uploadBytes(fileRef, file.file);
            const fileUrl = await getDownloadURL(fileRef);
            uploadedURLs.push(fileUrl);
          }
        }

        // Update Firestore document with image URLs
        if (uploadedURLs.length > 0) {
          await updateDoc(doc(db, "listings", newListingRef.id), {
            imageUrls: uploadedURLs,
          });
        }

        // Respond with success
        res.status(200).json({ message: "Listing saved successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
