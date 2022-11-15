'use strict';

const WebSocket = require('ws');

class XtransitServerBoot {
  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    const { app, app: { server, logger: appLogger } } = this;
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      const { service: { handler }, logger } = app.createAnonymousContext();

      logger.info(`new connection connect. ip: ${req.headers['x-real-ip']}`);

      // check valid
      handler.checkValid(ws);

      // handle message event
      ws.on('message', message =>
        handler
          .message(ws, message)
          .catch(err => logger.error(`ws handle message error: ${err}, message: ${message}.`)));

      // handle close event
      ws.on('close', () =>
        handler
          .close(ws, req)
          .catch(err => logger.error(`ws handle close error: ${err}.`)));

      // handle error event
      ws.on('error', err => {
        logger.error(`ws handle receive error: ${err}.`);
      });
    });

    wss.on('error', err => appLogger.error(`websocket server error: ${err}.`));
  }

  async didReady() {
    const { app } = this;
    const { service: { ipc } } = app.createAnonymousContext();

    // register ipc channel
    ipc.register();
  }
}

module.exports = XtransitServerBoot;
