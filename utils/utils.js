import axios from '@rdev06/fetch-axios';


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
        `${process.env.SHARED_MS_HOST}/ms/document/${documentId}?expiresIn=60&projection={"type":"$document.type"}&preview=true`,
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