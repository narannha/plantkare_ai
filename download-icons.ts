import fs from 'fs';
import https from 'https';

const download = (url: string, dest: string) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function run() {
  await download('https://dummyimage.com/192x192/ccfb3c/1e2b58.png&text=B', 'public/icon-192.png');
  await download('https://dummyimage.com/512x512/ccfb3c/1e2b58.png&text=B', 'public/icon-512.png');
  console.log('done');
}
run();
