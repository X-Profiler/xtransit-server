'use strict';

const { security: { secret } } = require('../config');
const utils = require('../lib/utils');

module.exports = async function(ctx, next) {
  const { method, request: { body }, query } = ctx;
  let data;
  if (method === 'GET') {
    data = query;
  } else {
    data = body;
  }
  const { signature } = data;
  if (!signature) {
    return (ctx.body = { ok: false, message: '需要签名', code: 401 });
  }
  if (utils.sign(secret, JSON.stringify(data)) !== signature) {
    return (ctx.body = { ok: false, message: '签名错误', code: 401 });
  }
  await next();
};
