const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Telegram Bot Token
const botToken = '7758299226:AAGl2ClQc6ZAUQFkfDvNXL0V4imtU1GQZUg'; // Replace with your bot's token

// Folder to store images
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir); // Create directory if it doesn't exist
}

// Serve a default message with a hyperlink for the /file route
app.get('/file', (req, res) => {
  const getUpdatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;

  // Send an HTML response with the hyperlink
  res.send(`
    <html>
      <head>
        <title>File Route</title>
      </head>
      <body>
        <h1>File Route</h1>
        <p>To fetch updates, click the link below:</p>
        <a href="${getUpdatesUrl}" target="_blank">Get Updates</a>
        <p> Add "file_id" value after "https://testv1-dj4g.onrender.com/file/{file_id}" </p>
      </body>
    </html>
  `);
});

// Serve images dynamically and save them with ".jpg" extension
app.get('/file/:id', async (req, res) => {
  const fileId = req.params.id;

  try {
    // Fetch file path from Telegram
    const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const filePath = fileResponse.data.result.file_path;

    // Fetch the file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    // Get the original filename (last part of the file path)
    const originalFileName = path.basename(filePath);

    // Ensure the filename ends with ".jpg"
    const fileName = originalFileName.endsWith('.jpg') ? originalFileName : `${originalFileName}.jpg`;

    // Full path to save the file
    const fileFullPath = path.join(imagesDir, fileName);

    // Save the file locally
    const writer = fs.createWriteStream(fileFullPath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`Image saved as ${fileName}`);
      // Redirect directly to the saved image URL
      res.redirect(`/saved_image/${fileName}`);
    });

    writer.on('error', (err) => {
      console.error('Error saving image:', err);
      res.status(500).send('Error saving image');
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Image not found');
  }
});

// Serve saved images
app.get('/saved_image/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(imagesDir, fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
