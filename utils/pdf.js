import axios from '@rdev06/fetch-axios';
import { PDFDocument } from 'pdf-lib';
import { loginToken } from './useGraph.js';

const driveId = 'b!3spiVrkLeUWmNjcHKsdY_25LoqM8yrJNvdNDusyyiHoqBJewyqVpQom725_2x3Ao';
const folderId = '01O3TWBEA6BME55UZBKBE33HBDNVYDHV7F';

export async function convert2Pdf(buff, fileName) {
  const ret = await axios.put(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${fileName}.docx:/content`, buff, {
    headers: {
      Authorization: 'Bearer ' + (await loginToken())
    }
  });

  // download file now
  const fileRes = await axios.get(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${ret.data.id}/content?format=pdf`, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: 'Bearer ' + (await loginToken())
    }
  });
  const toReturn = fileRes.data;
  await axios.post(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${ret.data.id}/permanentDelete`, null, {
    headers: {
      Authorization: 'Bearer ' + (await loginToken())
    }
  });
  return toReturn;
}

export async function mergePDF(buffs) {
  const newPdf = await PDFDocument.create();
  for (const buff of buffs) {
    const doc = await PDFDocument.load(buff);
    const pages = await newPdf.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      newPdf.addPage(page);
    }
  }
  return newPdf.save();
}