'use strict';

const { v4: uuidv4 } = require('uuid');
const { agentKey } = require('../config');
const utils = require('../lib/utils');
const logger = require('../proxy/logger');

exports.shutdown = function(traceId, message, socket) {
  if (!socket) {
    return;
  }
  const extra = utils.getClientInfo(socket[agentKey]);
  logger.error(`${extra} shutdown: ${message}`);
  const data = { traceId, type: 'shutdown' };
  socket.send(JSON.stringify(data));
};


exports.send = function(type, data, socket, traceId) {
  traceId = traceId || uuidv4();
  const body = { traceId, type, data };
  socket.send(JSON.stringify(body));

  // get response
  const { expiredTime } = data;
  return Promise.race([
    new Promise(resolve => utils.responseEvent.once(traceId, resolve)),
    new Promise(resolve => setTimeout(() => resolve({ ok: false, message: `request: ${data} timeout` }), expiredTime)),
  ]);
};
