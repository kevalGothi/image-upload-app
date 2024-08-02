const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Set storage engine for multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

// Initialize upload variable with multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check file type function
function checkFileType(file, cb) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check MIME type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Route to handle file upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).send(err);
        } else {
            if (req.file == undefined) {
                res.status(400).send('Error: No File Selected!');
            } else {
                res.send('File uploaded successfully!');
            }
        }
    });
});

// Route to serve all images
app.get('/images', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading upload directory.');
        } else {
            res.json(files);
        }
    });
});

// Route to handle image deletion
app.delete('/delete/:filename', (req, res) => {
    const imagePath = path.join(__dirname, 'uploads', req.params.filename);
    fs.unlink(imagePath, (err) => {
        if (err) {
            res.status(400).send('Failed to delete image.');
        } else {
            res.send('Image deleted successfully.');
        }
    });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
