const createError = require("http-errors");
const cleanStack = require("clean-stack");
const qsp = require("querystrings");
const loGet = require("lodash.get");
const Ajv = require("ajv");
const ajv = new Ajv({ coerceTypes: true });
const BufferHelper = require('./bufferhelper');

var wrap = function (opts = {}) {
  return (event, context, cb) => {
    return (
      Promise.resolve()
        .then(() => {
          return handlerArgs(event);
        })
        .then((arg) => {
          console.info(1);
          if (opts.validator && !opts.validator(arg)) {
            throw createError(400, "validator error", opts.validator.errors);
          }

          if (opts.schema) {
            let validate = ajv.compile(opts.schema);
            let valid = validate(arg);
            if (!valid) {
              throw createError(400, "validator error", validate.errors[0].message);
            }
          }

          return arg;
        })
        .then((arg) => {
          if (opts.get) {
            let querystring = require("querystring");
            let postData = querystring.stringify(arg);
            const https = require('https');
            let options = require("./config").https;
            options.path = opts.get.url + "?" + postData;
            const req = https.request(options, (res) => {
              var bufferHelper = new BufferHelper();
              res.on('data', (d) => {
            	  bufferHelper.concat(d);
              });
              res.on('end', function () {
                  var content = bufferHelper.toBuffer().toString();

                  let returnMsg = JSON.parse(content);
                  if (opts.handler) {
                    returnMsg = opts.handler(returnMsg)
                  }

                  const response = {
                    statusCode: 200,
                    body: returnMsg,
                  };
                  cb(null, response);
                });
            });



            req.on('error', (e) => {
              console.error(e);
              console.info(2);

              const response = {
                statusCode: 400,
                body: {
                  error: e
                },
              };

              cb(null, response);

            });

            req.end();
          } else {
            if (opts.handler) {
              return opts.handler(arg, event, context, cb)
            }
          }

        })
        .catch(err => {
        	console.error(err);
          err.stack = cleanStack(err.stack);
          const response = {
            statusCode: 400,
            body: JSON.stringify({
              error: err
            })
          };

          cb(null, response);
        })
        .catch(err => console.error)
    )
  }
}

function toObject(s) {
  if (s == null)
    return {};

  if (typeof s == "string")
    return qsp.parse(s);

  return s;
}

function handlerArgs(event) {
  return Object.assign(toObject(event.pathParameters), toObject(event.body), {});
}

module.exports = wrap;
