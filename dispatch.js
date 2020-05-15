'use strict';

const http = require('http');
const WebSocket = require('ws');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const config = require('./config');
const logger = require('./proxy/logger');
const utils = require('./lib/utils');
const checkSign = require('./middleware/checkSign');
const apiController = require('./controller/api');
const messageHandler = require('./handler/message');
const closeHandler = require('./handler/close');

const { agentKey } = config;

// http server
const app = new Koa();
app
  .use(bodyParser())
  .use(checkSign);
const router = new Router();
router.post('/xapi/shutdown', apiController.shutdown);
app
  .use(router.routes())
  .use(router.allowedMethods());
const server = http.createServer(app.callback());

// ws server
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
  function shutdown(traceId, message, socket) {
    const extra = utils.getClientInfo(ws[agentKey]);
    logger.error(`${extra} shutdown: ${message}`);
    const data = { traceId, ok: false, message, code: 'SHUTDOWN' };
    const client = socket || ws;
    client.send(JSON.stringify(data));
  }

  ws.on('message', messageHandler.bind({ ws, shutdown }));
  ws.on('close', closeHandler.bind({ ws, shutdown }));
});
server.on('error', err => logger.error(`server error: ${err}`));

server.listen(config.serverPort, () => console.log(`websockt server listening at ${config.serverPort}...`));
