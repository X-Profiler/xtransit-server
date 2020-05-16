'use strict';

const { agentKey } = require('../config');
const utils = require('../lib/utils');
const logger = require('../proxy/logger');

exports.shutdown = function(traceId, message, socket) {
  if (!socket) {
    return;
  }
  const extra = utils.getClientInfo(socket[agentKey]);
  logger.error(`${extra} shutdown: ${message}`);
  const data = { traceId, ok: false, message, code: 'SHUTDOWN' };
  socket.send(JSON.stringify(data));
};
