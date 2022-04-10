'use strict';

const WebSocket = require('ws');
const messageHandler = require('./handler/message');
const closeHandler = require('./handler/close');

class XtransitServerBoot {
  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    const { app: { server, logger } } = this;
    const wss = new WebSocket.Server({ server });

    wss.on('connection', ws => {
      ws.on('message', messageHandler.bind({ ws }));
      ws.on('close', closeHandler.bind({ ws }));
    });

    wss.on('error', err => logger.error(`websocket server error: ${err}`));
  }
}

module.exports = XtransitServerBoot;
