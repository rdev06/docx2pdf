import { Service } from 'node-windows';
import path from 'path';

const ecosystem = new Service({
  name: 'docx2Pdf',
  description: 'This will Generate PDF from Microsodt Document Templates by injecting data into it',
  script: path.normalize(path.join(process.cwd(), 'index.js')),
  env: [
    { name: 'SHARED_MS_HOST', value: 'https://shared-ms.agp-dev.com' },
    { name: 'REDIS_HOST', value: 'redis-18809.c305.ap-south-1-1.ec2.cloud.redislabs.com' },
    { name: 'REDIS_PORT', value: 18809 },
    { name: 'MAX_REDIS_RETRY', value: 5 },
    { name: 'TOPIC_PREFIX', value: 'Docx2Pdf_DEV_' },
    { name: 'REDIS_PASSWORD', value: 'OZGV3IeQNpWb9bHWj2TDA16tYAt3w63d' }
  ]
});

ecosystem.on('install', () => {
  console.log('Installed!');
  ecosystem.start();
});
ecosystem.on('stop', () => {
  console.log('Stoppeded!');
  ecosystem.uninstall();
});

['start', 'uninstall', 'alreadyinstalled', 'invalidinstallation', 'alreadyuninstalled', 'error'].forEach((e) => {
  ecosystem.on(e, (err) => {
    console.log(`Event fired: ${e}`, err);
  });
});

export default ecosystem;
