'use strict';

const http = require('http');
const WebSocket = require('ws');
const config = require('./config');
const logger = require('./proxy/logger');
const messageHandler = require('./handler/message');
const closeHandler = require('./handler/close');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  function shutdown(traceId, message, socket) {
    logger.error(message);
    const data = { traceId, ok: false, message, code: 'SHUTDOWN' };
    const client = socket || ws;
    client.send(JSON.stringify(data));
  }

  ws.on('message', messageHandler.bind({ ws, shutdown }));
  ws.on('close', closeHandler.bind({ ws, shutdown }));
});

server.on('error', err => logger.error(`server error: ${err}`));

server.listen(config.wsPort, () => console.log(`websockt server listening at ${config.wsPort}...`));
