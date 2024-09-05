import { parentPort } from 'worker_threads';
import getFileBuffer from './utils/getFileBuffer.js';
import { handelAsyncSend } from './utils/pdf.js';

async function processBulkInBackground(payload, headers) {
    try {
        const docxBuffers = await Promise.all([...payload.map(async rq => {
            const docxBuffer = await getFileBuffer(rq, headers);
            return { docxBuffer, webhook: rq.webhook };
        })]);

        await Promise.allSettled([...docxBuffers.map(docxBuffer => handelAsyncSend(docxBuffer, docxBuffer.webhook))]);
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
}

parentPort.on('message', ({ payload, headers }) => {
    processBulkInBackground(payload, headers)
        .then(() => parentPort.postMessage({ status: 'done' }))
        .catch(err => parentPort.postMessage({ error: err.message }));
});
