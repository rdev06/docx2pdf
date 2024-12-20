import axios from '@rdev06/fetch-axios';
import redisClient from './redisClient.js';
const teenantId = '38a3f678-5fe7-4dbb-8eb9-eee7a0c6fd57';
const username = process.env.MSAL_PDF_USER;
const password = process.env.MSAL_PDF_PASS;

const body = new URLSearchParams();
body.append('grant_type', 'client_credentials');
body.append('scope', 'https://graph.microsoft.com/.default');

export async function loginToken() {
  const TokenKey = 'Docx2Pdf_MSAL';
  const token = await redisClient.get(TokenKey);
  if (token) {
    return token;
  }
  const res = await axios.post(`https://login.microsoftonline.com/${teenantId}/oauth2/v2.0/token`, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  });
  await redisClient.set(TokenKey, res.data.access_token, 'EX', res.data.expires_in);
  return res.data.access_token;
}

export async function uploadFileToSharePoint(buff, driveId, folderId, fileName) {
  const res = await axios.put(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${fileName}:/content`, buff, {
    headers: {
      'Content-Type': 'application/pdf',
      Authorization: 'Bearer ' + (await loginToken())
    }
  });
  return res.data.id;
}
