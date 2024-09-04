import axios from '@rdev06/fetch-axios';
import { createReport } from 'docx-templates';
import parseDataForImage from './parseDataForImage.js';

const useHeaderKeys = ['organization-unit', 'bussiness-unit', 'channel', 'accept-language', 'source', 'accept-encoding'];

async function getTemplateBuffer(documentId, useHeaders) {
  const headers = { 'Content-Type': 'application/json' };

  for (const k of useHeaderKeys) {
    headers[k] = useHeaders[k];
  }
  const resp = await axios.get(
    `${process.env.SHARED_MS_HOST}/ms/document/${documentId}?expiresIn=60&projection={"type":"$document.type"}&preview=true`,
    { headers }
  );
  const dataResp = await axios.get(resp.data.location, { responseType: 'arrayBuffer' });
  return dataResp.data;
}

export default async function (body, headers) {
  const template = await getTemplateBuffer(body.templateId, headers);
  await parseDataForImage(body.data, headers);
  return createReport({ template, data: body.data, cmdDelimiter: ['{{', '}}'] });
}
