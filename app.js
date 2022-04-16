'use strict';

const WebSocket = require('ws');

class XtransitServerBoot {
  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    const { app, app: { server, logger } } = this;
    const { service: { handler } } = app.createAnonymousContext();
    const wss = new WebSocket.Server({ server });

    wss.on('connection', ws => {
      // handle message event
      ws.on('message', message =>
        handler
          .message(ws, message)
          .catch(err => logger.error(`ws handle message error: ${err}, message: ${message}.`)));

      // handle close event
      ws.on('close', () =>
        handler
          .close(ws)
          .catch(err => logger.error(`ws handle close error: ${err}.`)));
    });

    wss.on('error', err => logger.error(`websocket server error: ${err}.`));
  }

  async didReady() {
    const { app } = this;
    const { service: { ipc } } = app.createAnonymousContext();

    // register ipc channel
    ipc.register();
  }
}

module.exports = XtransitServerBoot;
