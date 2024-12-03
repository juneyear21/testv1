const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Telegram Bot Token
const botToken = '7758299226:AAGl2ClQc6ZAUQFkfDvNXL0V4imtU1GQZUg'; // Replace with your bot's token

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "images" folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Default route with a form to enter file_id
app.get('/file', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Upload File ID</title>
      </head>
      <body>
        <h1>Upload File ID</h1>
        <form action="/file" method="post">
          <label for="file_id">Enter File ID:</label>
          <input type="text" id="file_id" name="file_id" required>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

// Handle form submission and process the file_id
app.post('/file', async (req, res) => {
  const fileId = req.body.file_id;

  try {
    // Fetch file path from Telegram
    const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const filePath = fileResponse.data.result.file_path;

    // Fetch the file content
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    // Save the file locally
    const fileName = path.basename(filePath);
    const fileDir = path.join(__dirname, 'images');
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir);
    }
    const localFilePath = path.join(fileDir, fileName);
    const writer = fs.createWriteStream(localFilePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      const localFileUrl = `http://localhost:${port}/images/${fileName}`;
      res.send(`
        <html>
          <head>
            <title>File Saved</title>
          </head>
          <body>
            <h1>File Saved Successfully</h1>
            <p>View your file here:</p>
            <a href="${localFileUrl}" target="_blank">${localFileUrl}</a>
          </body>
        </html>
      `);
    });

    writer.on('error', (error) => {
      console.error('Error saving file:', error);
      res.status(500).send('Failed to save file.');
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Failed to process file.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
