module.exports = {
  apps : [{
    name   : "docx2pdf",
    script : "./index.js",
    env: {
      SHARED_MS_HOST: 'https://shared-ms.agp-dev.com'
    }
  }]
}
