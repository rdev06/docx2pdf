import srv from './deploy/srv.js';

const usage = [
  {
    name: 'start',
    to: 'to install and start the script in service daemon'
  },
  {
    name: 'stop',
    to: 'stop and uninstall the script from service daemon'
  },
  {
    name: 'applog',
    to: 'monitor service application logs'
  }
];

const cmds = {
  help: () => {
    const toPrint = usage.map((c) => `Use \x1b[33m${c.name}\x1b[0m : To ${c.to}.`).join('\n');
    console.log(toPrint);
  },
  start: () => srv.install(),
  stop: () => srv.stop()
};

const inputCmd = process.argv.at(-1);

if (!cmds.hasOwnProperty(inputCmd)) {
  cmds.help();
  process.exit(0);
}

cmds[inputCmd]();
