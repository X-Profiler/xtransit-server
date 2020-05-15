'use strict';

const utils = require('../lib/utils');
const logger = require('../proxy/logger');

const agentKey = utils.getAgentKey();

module.exports = function closeHandler() {
  const { ws } = this;
  const clinetIdentity = ws[agentKey];
  logger.error(`client [${clinetIdentity}] has been closed.`);
  utils.deleteClient(clinetIdentity);
};
