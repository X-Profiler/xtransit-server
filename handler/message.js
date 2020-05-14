'use strict';

const { v4: uuidv4 } = require('uuid');
const appService = require('../service/app');
// const logger = require('../proxy/logger');

module.exports = async function messageHandler(message) {
  const { shutdown } = this;

  try {
    message = JSON.parse(message);
  } catch (err) {
    const traceId = uuidv4();
    return shutdown(traceId, `parse message failed: ${err}, raw message: ${message}`);
  }

  const { traceId, appId } = message;
  if (!appId) {
    return shutdown(traceId, 'appId can\'t be empty!');
  }

  const secret = await appService.getAppSecret(appId);
  console.log(secret);
};
