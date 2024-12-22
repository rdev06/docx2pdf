import http from 'http';
import bodyParser from './utils/bodyParser.js';
import {docxFilesBuffer} from './utils/getFilesBuffer.js';
import { readFileSync } from 'fs';
import redisClient from './utils/redisClient.js';
import { AddJob, AddWorker } from './utils/queue.js';
import { handleResAction, postFile } from './utils/handleAction.js';

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
        const docxBuffer = await docxFilesBuffer(req.body.toProcess, req.headers);
        return await handleResAction(docxBuffer, req.body, res);
      } else if (req.url === '/ms/docx2pdf/bulk') {
        const missing = [];
        for (let i = 0; i < req.body.length; i++) {
          const payload = req.body[i];
          payload.headers = req.headers;
          if(!payload.action?.destination){
            missing.push(i)
            continue;
          }
          AddJob(BulkDocTopic, JSON.stringify(payload));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Your file will be posted at your given destination', unprocessed: missing }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: error.message, error }));
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ message: 'Not Found' }));
}

const HTTP_PORT = 8000;

async function main() {
  await redisClient.ping();
  console.log('Redis client connected');
  AddWorker(BulkDocTopic, {
    exec: async (_, payload) => {
      payload = JSON.parse(payload);
      const docxBuffer = await docxFilesBuffer(payload, req.headers);
      postFile(docxBuffer, payload);
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
