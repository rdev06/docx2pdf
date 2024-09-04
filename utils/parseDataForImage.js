async function ByURL(url) {
  return { data: 'imageBuffer' };
}

async function ByDocumentId(documentId) {
  return { data: 'imageBuffer', extension: '.png' };
}

const imageFieldSuffixes = ['_image', '_images'];

function isImageKey(key) {
  return imageFieldSuffixes.some((suffix) => key.endsWith(suffix));
}

async function parseImage(imgObject) {
  let dataObject;
  if (imgObject.url) {
    dataObject = await ByURL(imgObject.url);
    delete imgObject.url;
  } else if (imgObject.documentId) {
    dataObject = await ByDocumentId(imgObject.documentId);
    delete imgObject.documentId;
  }else{
    throw new Error('Not able to fetch image data')
  }
  return { ...imgObject, ...dataObject };
}

// We will actually modify the request
export default async function parseDataForImage(data) {
  for (const key in data) {
    if (typeof data[key] === 'object') {
      if (!Array.isArray(data[key])) {
        // this means here this object was image
        if (isImageKey(key)) {
          data[key] = await parseImage(data[key]);
          continue;
        }

        // also check for nested item
        await parseDataForImage(data[key]);
        continue;
      }
      // Now the object is array
      // First check if root key is only images
      if (isImageKey(key)) {
        data[key] = await Promise.all(data[key].map((e) => parseImage(e)));
        continue;
      }
      // Also check if nested elements will have image Data
      for (const e of data[key]) {
        await parseDataForImage(e)
      }
    }
  }
}
