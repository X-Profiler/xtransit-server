'use strict';

const http = require('http');
const WebSocket = require('ws');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const config = require('./config');
const routes = require('./routes');
const logger = require('./proxy/logger');
const checkSign = require('./middleware/checkSign');
const messageHandler = require('./handler/message');
const closeHandler = require('./handler/close');

// http server
const app = new Koa();
app
  .use(bodyParser())
  .use(checkSign);
const router = new Router();
routes(router);
app
  .use(router.routes())
  .use(router.allowedMethods());
const server = http.createServer(app.callback());

// ws server
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
  ws.on('message', messageHandler.bind({ ws }));
  ws.on('close', closeHandler.bind({ ws }));
});
server.on('error', err => logger.error(`server error: ${err}`));

server.listen(config.serverPort, () => console.log(`websockt server listening at ${config.serverPort}...`));
