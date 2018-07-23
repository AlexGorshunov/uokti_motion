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
    gateway = null;
    console.log('Gateway is offline')
  });

  gateway.on('subdevice', (device) => {
    console.log('New device');
    console.log(`  Battery: ${device.getBatteryPercentage()}%`);
    console.log(`  Type: ${device.getType()}`);
    console.log(`  SID: ${device.getSid()}`);
    switch (device.getType()) {
      case 'motion':
        console.log(`  Motion (${device.hasMotion() ? 'motion' : 'no motion'})`);
        device.on('motion', () => {
          console.log(`${device.getSid()} has motion${device.getLux() !== null ? ' (lux:' + device.getLux() + ')' : ''}`)
          request.post(`wc/motion`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format(moment.defaultFormat),
              device: {
                sid: device.getSid(),
                lux: device.getLux()
              },
              motion: true
            }
          }).catch(console.error)
        });
        device.on('noMotion', () => {
          console.log(`${device.getSid()} has no motion (inactive:${device.getSecondsSinceMotion()}${device.getLux() !== null ? ' lux:' + device.getLux() : ''})`)
          request.post(`wc/motion`, {
            body: {
              '@timestamp': moment().utcOffset('+03:00').format(moment.defaultFormat),
              device: {
                sid: device.getSid(),
                lux: device.getLux()
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