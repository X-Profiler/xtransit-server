'use strict';

const crypto = require('crypto');

const XTRANSIT_ID = Symbol('XTRANSIT::ID');

const clients = {};

exports.sign = function(message, secret) {
  message = JSON.stringify(message);
  return crypto.createHmac('sha1', secret).update(message).digest('hex');
};

exports.getAgentKey = function() {
  return XTRANSIT_ID;
};

exports.setClient = function(clientId, client) {
  clients[clientId] = client;
};

exports.deleteClient = function(clientId) {
  delete clients[clientId];
};

exports.getClient = function(clientId) {
  return clients[clientId];
};
