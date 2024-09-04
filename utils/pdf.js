import axios from '@rdev06/fetch-axios';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, openAsBlob } from 'fs';
import path from 'path';
import winax from 'winax';

const rootTemDir = '.temp';
if (!existsSync(rootTemDir)) {
    mkdirSync(rootTemDir);
    console.log('created Root Temp Directory');
}

const wordApp = new winax.Object('Word.Application');


function getTempFilePath(tempFolder, file) {
    return path.win32.normalize(path.join(process.cwd(), tempFolder, file))
}

async function sendFile(filePath, webhook) {
    const buf = await openAsBlob(filePath, {type: 'application/pdf'});
    const form = new FormData();
    form.append(webhook?.data?.useFileField || 'file', buf, 'output.pdf');
    for (const k in webhook.data) {
        if(k === 'useFileField') continue;
        if(typeof webhook.data[k] === 'string'){
            form.append(k, webhook.data[k])
        }
    }
    webhook.headers['Content-Type'] = 'multipart/form-data';
    webhook.data = form;
    return axios(webhook)
}

export async function sendPdfRightAway(buffer, res) {
    const tempFolder = mkdtempSync(rootTemDir + '/temp-');
    writeFileSync(tempFolder + '/output.docx', buffer);
    const doc = wordApp.Documents.Open(getTempFilePath(tempFolder, '/output.docx'));
    doc.SaveAs(getTempFilePath(tempFolder, '/output.pdf'), 17);
    doc.Close();
    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=output.pdf"
    });
    const pipe = createReadStream(tempFolder + '/output.pdf').pipe(res);
    pipe.on('finish', () => rmSync(tempFolder, { recursive: true, force: true }));
}

export async function handelAsyncSend(buffer, webhook) {
    const tempFolder = mkdtempSync(rootTemDir + '/temp-');
    writeFileSync(tempFolder + '/output.docx', buffer);
    const doc = wordApp.Documents.Open(getTempFilePath(tempFolder, '/output.docx'));
    doc.SaveAs(getTempFilePath(tempFolder, '/output.pdf'), 17);
    doc.Close();
    // in case file is successfully send
    await sendFile(getTempFilePath(tempFolder, '/output.pdf'), webhook);
    rmSync(tempFolder, { recursive: true, force: true });
}