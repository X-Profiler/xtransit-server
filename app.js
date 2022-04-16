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
      const ctx = { ws };

      // handle message event
      ws.on('message', message =>
        messageHandler
          .call(ctx, message)
          .catch(err => logger.error(`ws handle message error: ${err}, message: ${message}.`)));

      // handle close event
      ws.on('close', () =>
        closeHandler
          .call(ctx)
          .catch(err => logger.error(`ws handle close error: ${err}.`)));
    });

    wss.on('error', err => logger.error(`websocket server error: ${err}.`));
  }

  async didReady() {
    const { app } = this;
    const ctx = app.createAnonymousContext();
    ctx.ipc.register();
  }
}

module.exports = XtransitServerBoot;
