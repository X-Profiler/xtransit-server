'use strict';

// const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const utils = require('../lib/utils');
const manager = require('../service/manager');
const logger = require('../proxy/logger');

const { agentKey, agentSplitter } = config;

module.exports = async function messageHandler(message) {
  const { ws, shutdown } = this;
  // parse message
  try {
    message = JSON.parse(message);
    console.log(message);
  } catch (err) {
    return logger.error(`parse message failed: ${err}, raw message: ${message}`);
  }

  // check appId / clientId
  const { traceId, appId, clientId } = message;
  if (!appId || !clientId) {
    return shutdown(traceId, 'appId & clientId can\'t be empty');
  }

  // check signature
  const { secret, code } = await manager.getAppSecret(appId);
  if (!secret) {
    if (code !== 'HTTPREQUESTFAILED') {
      return shutdown(traceId, 'appId not exists');
    }
    return;
  }
  const { signature, timestamp } = message;
  if (!timestamp || Date.now() - timestamp > 5 * 60 * 1000) {
    return logger.error(`[${traceId}] timestamp expired`);
  }
  delete message.signature;
  if (signature !== utils.sign(message, secret)) {
    return shutdown(traceId, 'sign error');
  }

  const { agentId, type } = message;
  const clientIdentity = [appId, agentId, clientId].join(agentSplitter);
  // handle heartbeat
  if (type === 'heartbeat') {
    ws[agentKey] = clientIdentity;
    await manager.updateClient(appId, agentId, clientId, timestamp);
    utils.setClient(clientIdentity, ws);
  }
};
