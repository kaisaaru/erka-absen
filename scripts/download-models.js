const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '..', 'public', 'models');

// Ensure public/models directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

function downloadFile(filename) {
  const dest = path.join(modelsDir, filename);
  const file = fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
    https.get(baseUrl + filename, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: Status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading face-api.js models...');
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    console.log('All models downloaded successfully!');
  } catch (err) {
    console.error('Error downloading models:', err);
    process.exit(1);
  }
}

main();
