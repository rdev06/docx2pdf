export default (req) =>
  new Promise((resolve, reject) => {
    let chunk = '';

    req
      .on('data', (_chunk) => {
        chunk += _chunk;
      })
      .on('end', () => {
        try {
          req.body = JSON.parse(chunk);
          return resolve(chunk);
        } catch (error) {
          reject({ message: 'Body payload not parsable', error });
        }
      });
  });
