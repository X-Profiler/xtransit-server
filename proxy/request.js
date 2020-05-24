'use strict';

const urllib = require('urllib');
const Agent = require('agentkeepalive');
const { sign } = require('../lib/utils');
const { xtransitManager, httpTimeout, security: { secret } } = require('../config');

const keepaliveAgent = new Agent({
  maxSockets: 1000,
  maxFreeSockets: 100,
  timeout: 1200000,
  freeSocketTimeout: 60000,
});

module.exports = async function sendMessage(url, data, method = 'POST') {
  const requestUrl = `${xtransitManager}${url}`;
  data.signature = sign(data, secret);
  return urllib.request(requestUrl, {
    method,
    data,
    timeout: data.expiredTime || httpTimeout,
    agent: keepaliveAgent,
    contentType: 'json',
  });
};
