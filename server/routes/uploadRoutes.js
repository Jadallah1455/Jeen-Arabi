const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();


const cloudinary = require('cloudinary').v2;

// Ensure uploads directory exists for local storage
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Cloudinary (Optional based on env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Determine storage engine
console.log('Using Local Disk Storage');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Get name and extension separately
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt);

        // Sanitize base name: allow Arabic, alphanumeric, dots, and hyphens
        let sanitizedBase = baseName
            .replace(/[^\u0600-\u06FFa-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .slice(0, 60); // Limit base name to leave room for suffix

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Final format: sanitizedName-uniqueSuffix.ext
        cb(null, `${sanitizedBase}-${uniqueSuffix}${fileExt}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Update route to accept fields: 'file' (PDF) and 'pages' (Images)
router.post('/', protect, admin, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'pages', maxCount: 100 }]), async (req, res) => {
    if (req.files && req.files.file) {
        // --- تصحيح الروابط (HTTP -> HTTPS) ---
        const host = req.get('host');
        const protocol = host.includes('localhost') ? 'http' : 'https';

        const pdfFile = req.files.file[0];
        const fileUrl = `${protocol}://${host}/uploads/${pdfFile.filename}`;

        let images = [];

        // --- Handle Uploaded Images (Client-Side Converted) ---
        if (req.files.pages && req.files.pages.length > 0) {
            try {
                const pdfFilename = path.parse(pdfFile.filename).name;
                const imagesDir = path.join(uploadDir, pdfFilename);

                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir, { recursive: true });
                }

                console.log(`Processing ${req.files.pages.length} pages for ${pdfFilename}...`);

                // Move uploaded images to the dedicated folder
                for (let i = 0; i < req.files.pages.length; i++) {
                    const pageFile = req.files.pages[i];
                    const extension = path.extname(pageFile.originalname) || '.png';
                    // Ensure ordered filenames: page-1.png, page-2.png, etc.
                    // We assume the client sends them in order, or we use the index.
                    const newFilename = `page-${i + 1}${extension}`;
                    const newPath = path.join(imagesDir, newFilename);

                    // Move file from temp upload location to target folder
                    fs.renameSync(pageFile.path, newPath);

                    images.push(`${protocol}://${host}/uploads/${pdfFilename}/${newFilename}`);
                }
                console.log('Images saved successfully via Client-Side conversion.');

            } catch (err) {
                console.error('Error saving uploaded page images:', err);
                // Don't fail the entire request, but log it
            }
        }

        // Delete old file and its folder if it's a PDF
        if (req.body.oldFileUrl) {
            try {
                const oldFilename = req.body.oldFileUrl.split('/uploads/').pop();
                if (oldFilename) {
                    const oldFilePath = path.join(uploadDir, oldFilename);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log(`Deleted old file: ${oldFilePath}`);
                    }

                    // Also delete folder if it was a PDF
                    if (oldFilename.toLowerCase().endsWith('.pdf')) {
                        const oldDirName = path.parse(oldFilename).name;
                        const oldDirPath = path.join(uploadDir, oldDirName);
                        if (fs.existsSync(oldDirPath) && fs.lstatSync(oldDirPath).isDirectory()) {
                            fs.rmSync(oldDirPath, { recursive: true, force: true });
                            console.log(`Deleted old associated folder: ${oldDirPath}`);
                        }
                    }
                }
            } catch (err) { console.error('Error deleting old file/folder:', err); }
        }

        res.json({ url: fileUrl, images: images });
    } else {
        res.status(400).json({ message: 'File upload failed' });
    }
});

router.delete('/:filename', protect, admin, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ message: 'File deleted' });
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
