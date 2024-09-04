import http from 'http';
import bodyParser from './utils/bodyParser.js';
import getFileBuffer from './utils/getFileBuffer.js';
import { handelAsyncSend, sendPdfRightAway } from './utils/pdf.js';
import { readFileSync } from 'fs';
import redisClient from './utils/redisClient.js';
import { AddJob, AddWorker } from './utils/queue.js';

const BulkDocTopic = 'BULK_DOCX_PDF_GEN_';

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
      } else if (req.url === '/ms/docx2pdf/bulk') {
        req.body.forEach((payload) => {
          payload.headers = req.headers;
          AddJob(BulkDocTopic, JSON.stringify(payload));
        });
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

async function main() {
  await redisClient.ping();
  console.log('Redis client connected');
  AddWorker(BulkDocTopic, {
    exec: async (_, payload) => {
      payload = JSON.parse(payload);
      const docxBuffer = await getFileBuffer(payload, payload.headers);
      handelAsyncSend(docxBuffer, payload.webhook);
    },
    onError: async (_, error) => {
      console.error(error);
    }
  });
  http.createServer(serverHandler).listen(HTTP_PORT, () => {
    console.log(`Docx2Pdf server is running on port ${HTTP_PORT}`);
  });
}

main().catch(console.error);
