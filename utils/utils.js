import axios from '@rdev06/fetch-axios';
import { uploadFileToSharePoint } from './useGraph.js';


const useHeaderKeys = ['organization-unit', 'bussiness-unit', 'channel', 'accept-language', 'source', 'accept-encoding'];

/**
 * 
 * @param {string} documentId 
 * @param {{[key: string]: string}} useHeaders 
 * @returns {Promise<{data: Buffer; extension: string}>}
 */
export async function getTemplateBuffer(documentId, useHeaders) {
    const headers = { 'Content-Type': 'application/json' };

    for (const k of useHeaderKeys) {
        headers[k] = useHeaders[k];
    }
    const resp = await axios.get(
        `${process.env.SHARED_DOC_MS}/${documentId}?expiresIn=60&projection={"type":"$document.type"}&preview=true`,
        { headers }
    );
    return { data: await getFile(resp.data.location), extension: resp.data?.documnentData?.type } //TODO: Need to check if this key "documnentData" come as we are sending {location, documnentData}
}

/**
 * 
 * @param {string} localtionUrl 
 * @returns {Promise<Buffer>}
 */
export async function getFile(locationUrl) {
    const dataResp = await axios.get(locationUrl, { responseType: 'arrayBuffer' });
    return dataResp.data;
}


/**
 * Sends a file to a webhook using a specific file extension.
 * 
 * @param {Buffer} buf - The file buffer to send.
 * @param {Object} webhook - The webhook configuration object.
 * @param {string} [webhook.data.useFileField] - The field name for the file in the form data.
 * @param {Object} webhook.headers - The headers for the webhook request.
 * @param {Object} webhook.data - Additional data to send with the request.
 * @param {'pdf'|'zip'|'docx'} [ext='pdf'] - The file extension for the file being sent.
 * @returns {Promise} - The result of the Axios HTTP request.
 */
export async function sendFileViaApi(buf, webhook, fileName) {
    const form = new FormData();
    form.append(webhook?.data?.useFileField || 'file', buf, fileName);
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


export async function sendFileViaSharepoint(buff, option, fileName='output.pdf'){
    const itemId = await uploadFileToSharePoint(buff, option.driveId, option.folderId, fileName);
    if(!option.postInfo){
        return {toUse: true, sharepointItemId: itemId};
    }
    option.postInfo.data[option.postInfo.data.useFileIdField] = itemId;
    delete option.postInfo.data.useFileIdField;
    return axios(postInfo)
}