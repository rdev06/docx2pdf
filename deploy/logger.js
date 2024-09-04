import { tmpdir } from 'os';
import { writeFileSync } from 'fs';
import path from 'path';

const LOGFile = path.win32.normalize(path.join(tmpdir(),'node.log'));
const MAX_LAST_LOG = 15;

const LogWriter = process.stdout.write;
const ErrorWriter = process.stderr.write;

const toWrite = [];

function pusher(chunk, type=''){
    if(!!type){
        type = '\x1b[31mError \x1b[0m' //color red
    }
    toWrite.push(`[${type + new Date().toLocaleString()}]: ${chunk}`);
    if(toWrite.length > MAX_LAST_LOG){
        toWrite.shift();
    }
    writeFileSync(LOGFile, '\n'+toWrite.join('\n'))
}

process.stdout.write = function(chunk, encoding, callback){
    pusher(chunk);
    LogWriter.apply(process.stdout, [chunk, encoding, callback]);
}

process.stderr.write = function(chunk, encoding, callback){
    pusher(chunk, 'Error');
    ErrorWriter.apply(process.stderr, [chunk, encoding, callback]);
}