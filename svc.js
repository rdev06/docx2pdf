import { EventLogger } from 'node-windows';
import ecosystem from './ecosystem';

const cmds = {
  help: () =>
    console.log(
      'Use `start`: to install and start the script in service daemon.\nUse `stop`: to stop and uninstall the script from service daemon.\nUse `applog`: To monitor service application logs\nUse `syslog`: To monitor service system logs'
    ),
  start: () => ecosystem.install(),
  stop: () => ecosystem.stop(),
  applog: () =>
    new EventLogger({
      source: ecosystem.name,
      eventLog: 'APPLICATION'
    }),
  syslog: () =>
    new EventLogger({
      source: ecosystem.name,
      eventLog: 'SYSTEM'
    })
};

const inputCmd = process.argv.at(-1);

if (!cmds.hasOwnProperty(inputCmd)) {
  cmds.help();
  process.exit(0);
}

cmds[inputCmd]();