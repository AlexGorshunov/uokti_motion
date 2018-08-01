_log = console.log;
console.log = function() {
  _log.apply(_log, [`[${new Date().toLocaleString()}]`, ...arguments]);
};

const Aqara = require('lumi-aqara');
const moment = require('moment');
const config = require('./config');
const requestPromise = require('request-promise');
const request = requestPromise.defaults({
  auth: {
    'user': config.elasticsearch.username,
    'pass': config.elasticsearch.password,
  },
  baseUrl: config.elasticsearch.url,
  json: true,
});

const aqara = new Aqara();

aqara.on('gateway', (gateway) => {
  console.log('Gateway discovered');
  gateway.on('ready', () => {
    console.log('Gateway is ready');
    gateway.setPassword('962E316837AA4588')
  });

  gateway.on('offline', () => {
    // gateway = null;
    console.log('Gateway is offline')
  });

  gateway.on('subdevice', (device) => {
    console.log('New device');
    console.log(`  Battery: ${device.getBatteryPercentage()}%`);
    console.log(`  Type: ${device.getType()}`);
    console.log(`  SID: ${device.getSid()}`);
    switch (device.getType()) {
      case 'magnet':
        console.log(`  Magnet (${device.isOpen() ? 'open' : 'close'})`);
        device.on('open', () => {
          console.log(`${device.getSid()} is now open`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'open'
            }
          }).catch(console.error)
        });
        device.on('close', () => {
          console.log(`${device.getSid()} is now close`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'close'
            }
          }).catch(console.error)
        });
        break;
      case 'switch':
        console.log(`  Switch`);
        device.on('click', () => {
          console.log(`${device.getSid()} is clicked`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'click'
            }
          }).catch(console.error)
        });
        device.on('doubleClick', () => {
          console.log(`${device.getSid()} is double clicked`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'doubleClick'
            }
          }).catch(console.error)
        });
        device.on('longClickPress', () => {
          console.log(`${device.getSid()} is long pressed`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'longClickPress'
            }
          }).catch(console.error)
        });
        device.on('longClickRelease', () => {
          console.log(`${device.getSid()} is long released`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              magnet: 'longClickRelease'
            }
          }).catch(console.error)
        });
        break;
      case 'motion':
        console.log(`  Motion (${device.hasMotion() ? 'motion' : 'no motion'})`);
        device.on('motion', () => {
          console.log(`${device.getSid()} has motion${device.getLux() !== null ? ' (lux:' + device.getLux() + ')' : ''}`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              motion: true
            }
          }).catch(console.error)
        });
        device.on('noMotion', () => {
          console.log(`${device.getSid()} has no motion (inactive:${device.getSecondsSinceMotion()}${device.getLux() !== null ? ' lux:' + device.getLux() : ''})`);
          request.post(`wc/_doc`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              device: {
                type: device.getType(),
                sid: device.getSid()
              },
              secondsSinceMotion: device.getSecondsSinceMotion(),
              motion: false
            }
          }).catch(console.error)
        });
        break;
    }
  });
});