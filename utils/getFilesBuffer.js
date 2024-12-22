import { createReport } from 'docx-templates';
import parseDataForImage from './parseDataForImage.js';
import { getTemplateBuffer } from './utils.js';

export async function getFileBuffer(body, headers) {
  const template = await getTemplateBuffer(body.templateId, headers);
  await parseDataForImage(body.data, headers);
  const contentBuff = await createReport({ template: template.data, data: body.data, cmdDelimiter: ['{{', '}}'] });
  return Buffer.from(contentBuff);
}

export function docxFilesBuffer(toProcess, headers){
  return Promise.all(toProcess.map(req => getFileBuffer(req, headers)))
}