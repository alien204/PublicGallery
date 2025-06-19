require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

console.log('--- Script started ---');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Store uploaded image URLs and public_ids in memory (for demo; use DB for production)
let gallery = [];

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);
    gallery.push({ url: result.secure_url, public_id: result.public_id });
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete endpoint
app.delete('/delete', async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: 'No public_id provided' });
    await cloudinary.uploader.destroy(public_id);
    gallery = gallery.filter(img => img.public_id !== public_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery endpoint
app.get('/gallery', (req, res) => {
  res.json({ images: gallery });
});

// Test endpoint
app.get('/test', (req, res) => res.send('Test route working'));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
process.on('exit', (code) => {
  console.log('Process exit event with code:', code);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
