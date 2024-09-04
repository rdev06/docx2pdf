import { createReport } from 'docx-templates';
import parseDataForImage from './parseDataForImage.js';
import { getTemplateBuffer } from './utils.js';

export default async function (body, headers) {
  const template = await getTemplateBuffer(body.templateId, headers);
  await parseDataForImage(body.data, headers);
  return createReport({ template: template.data, data: body.data, cmdDelimiter: ['{{', '}}'] });
}
