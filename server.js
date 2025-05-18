const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const YtDlpWrap = require('yt-dlp-wrap').default;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ytDlpWrap = new YtDlpWrap(path.join(__dirname, 'yt-dlp')); // Linux binary

const FFMPEG_PATH = path.join(__dirname, 'ffmpeg'); // Linux binary

app.post('/download', async (req, res) => {
  const { url, format } = req.body;

  if (!url || !format) {
    return res.status(400).json({ error: 'Missing url or format parameter' });
  }

  const id = uuidv4();
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const outputFile = path.join(__dirname, `${id}.${ext}`);

  const ytdlArgs = format === 'mp3'
    ? [url, '-f', 'bestaudio', '-x', '--audio-format', 'mp3',
       '--ffmpeg-location', FFMPEG_PATH,
       '--no-playlist',
       '-o', outputFile]
    : [url, '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
       '--merge-output-format', 'mp4',
       '--ffmpeg-location', FFMPEG_PATH,
       '--no-playlist',
       '-o', outputFile];

  try {
    const ytProcess = ytDlpWrap.exec(ytdlArgs);

    ytProcess.on('close', (code) => {
      if (code === 0) {
        res.setHeader('Content-Disposition', `attachment; filename="media.${ext}"`);
        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

        const readStream = fs.createReadStream(outputFile);
        readStream.pipe(res);

        readStream.on('close', () => {
          fs.unlink(outputFile, () => {});
        });
      } else {
        console.error(`yt-dlp exited with code ${code}`);
        res.status(500).json({ error: `yt-dlp exited with code ${code}` });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.listen(port, () => {
  console.log(`✅ Media downloader backend running on port ${port}`);
});
