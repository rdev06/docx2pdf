// const req = {
//   toProcess: [{ templateId: '', data: {}, name: '' }],
//   action: {
//     output: 'docx/pdf',
//     destination: 'webhook/sharepoint',
//     merge:{
//       fileName:'output',
//       pdf: true
//     },
//     webhook: {},
//     sharepoint: {
//       driveId: '',
//       folderId: '',
//       postInfo:{
//         url:'',
//         method: '',
//         headers:{},
//         data:{
//           useFileIdField:''
//         }
//       }
//     }
//   }
// };

import JSZip from 'jszip';
import { convert2Pdf, mergePDF } from './pdf.js';
import { sendFileViaApi, sendFileViaSharepoint } from './utils.js';

export async function postFile(docxBuffer, reqBody) {
  if (reqBody.action.output === 'docx') {
    if (docxBuffer.length === 1) {
    }
  }
  // post it as pdf file
  const pdfBuffer = await Promise.all(docxBuffer.map((docBuff, i) => convert2Pdf(docBuff, reqBody.toProcess[i].name)));
  if (pdfBuffer.length === 1) {
    const fileName = `${reqBody.toProcess[0].name || reqBody.toProcess[0].templateId}.pdf`;
    if(reqBody.action.destination === 'webhook'){
      return sendFileViaApi(pdfBuffer[0], reqBody.action.webhook, fileName);
    }
    // or sharepoint
    return sendFileViaSharepoint(pdfBuffer[0], reqBody.action.sharepoint, fileName);
  }
  // for multifile
  if(!reqBody.action.merge?.pdf){
    const zip = new JSZip();
    for (let i = 0; i < pdfBuffer.length; i++) {
      zip.file(`${reqBody.toProcess[i].name || reqBody.toProcess[i].templateId}.pdf`, pdfBuffer[i]);
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const fileName = `${reqBody.action.merge.fileName || 'output'}.zip`;
    if(reqBody.action.destination === 'webhook'){
      return sendFileViaApi(zipBuffer, reqBody.action.webhook, fileName);
    }
    // or sharepoint
    return sendFileViaSharepoint(zipBuffer, reqBody.action.sharepoint, fileName);
  }
  // Need to merge
  const fileName = `${reqBody.action.merge.fileName || 'output'}.pdf`;
  const mergedPDFBuffer = await mergePDF(pdfBuffer);
  if(reqBody.action.destination === 'webhook'){
    return sendFileViaApi(mergedPDFBuffer, reqBody.action.webhook, fileName);
  }
  // or sharepoint
  return sendFileViaSharepoint(mergedPDFBuffer, reqBody.action.sharepoint, fileName);
}

export async function handleResAction(docxBuffer, reqBody, res) {
  if (!reqBody.action.destination && !!res) {
    // this means we need to send right away
    if (reqBody.action.output === 'docx') {
      if (docxBuffer.length === 1) {
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename=${reqBody.toProcess[0].name || reqBody.toProcess[0].templateId}.docx`
        });
        return res.end(docxBuffer[0]);
      }
      // this means more then one file is their
      const zip = new JSZip();
      for (let i = 0; i < docxBuffer.length; i++) {
        zip.file(`${reqBody.toProcess[i].name || reqBody.toProcess[i].templateId}.docx`, docxBuffer[i]);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${reqBody.action.merge?.fileName || 'output'}.zip`
      });
      return res.end(zipBuffer);
    }
    // this means output is PDF
    const pdfBuffer = await Promise.all(docxBuffer.map((docBuff, i) => convert2Pdf(docBuff, reqBody.toProcess[i].name)));
    if (pdfBuffer.length === 1) {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${reqBody.toProcess[0].name || reqBody.toProcess[0].templateId}.pdf`
      });
      return res.end(pdfBuffer[0]);
    }
    // if their is multiple pdf file
    if (!reqBody.action.merge?.pdf) {
      const zip = new JSZip();
      for (let i = 0; i < pdfBuffer.length; i++) {
        zip.file(`${reqBody.toProcess[i].name || reqBody.toProcess[i].templateId}.pdf`, pdfBuffer[i]);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${reqBody.action.merge?.fileName || 'output'}.zip`
      });
      return res.end(zipBuffer);
    }
    // Need to merge both pdf files in one
    const mergedPDFBuffer = await mergePDF(pdfBuffer);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${reqBody.action.merge.fileName || 'output'}.pdf`
    });
    return res.end(mergedPDFBuffer);
  }
  // its clear that we need to post the file
  const ret = await postFile(docxBuffer, reqBody);
  const toRespond = { message: 'Your file posted at your given destination' };
  if(ret.toUse){
    Object.assign(toRespond, ret)
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(toRespond));
}
