import http from 'http';
import bodyParser from './utils/bodyParser.js';
import getFileBuffer from './utils/getFileBuffer.js';
import { handelAsyncSend, sendPdfRightAway } from './utils/pdf.js';
import { readFileSync } from 'fs';
import { Worker } from 'worker_threads';

async function processBulkInBackground(payload, headers) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js');

    worker.on('message', message => {
      if (message.error) {
        reject(new Error(message.error));
      } else if (message.status === 'done') {
        resolve();
      }
    });

    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage({ payload, headers });
  });
}

async function serverHandler(req, res) {
  if (req.method === 'GET') {
    if (req.url === '/docx2pdf/docs') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const apiDoc = readFileSync('./ui/index.html', 'utf-8');
      return res.end(apiDoc);
    }
  }

  if (req.method === 'POST') {
    try {
      await bodyParser(req);
      if (req.url === '/ms/docx2pdf') {
        const docxBuffer = await getFileBuffer(req.body, req.headers);
        if (!req.body.webhook) {
          return sendPdfRightAway(docxBuffer, res);
        }
        handelAsyncSend(docxBuffer, req.body.webhook);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Your file will be posted at your given destination' }));
      }
      if (req.url === '/ms/docx2pdf/bulk') {
        await processBulkInBackground(req.body, req.headers);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Your file will be posted at your given destination' }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: error.message }));
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ message: 'Not Found' }));
}

const HTTP_PORT = 80;

http.createServer(serverHandler).listen(HTTP_PORT, () => {
  console.log(`Docx2Pdf server is running on port ${HTTP_PORT}`);
});
