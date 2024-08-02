const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).send(err);
        } else {
            if (req.file == undefined) {
                res.status(400).send('Error: No File Selected!');
            } else {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: req.file.originalname,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                    ACL: 'public-read',
                };

                s3.upload(params, (s3Err, data) => {
                    if (s3Err) {
                        return res.status(500).send(s3Err);
                    }
                    res.send(`File uploaded successfully! Access it at ${data.Location}`);
                });
            }
        }
    });
});

app.get('/images', (req, res) => {
    s3.listObjectsV2({ Bucket: process.env.AWS_S3_BUCKET }, (err, data) => {
        if (err) {
            res.status(500).send('Error listing files.');
        } else {
            const files = data.Contents.map(file => file.Key);
            res.json(files);
        }
    });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
