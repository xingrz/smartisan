const { parse } = require('yaml').default;
const { readFileSync, writeFileSync } = require('fs');
const { mapSeries } = require('bluebird');
const rp = require('request-promise');

function fetch(item) {
  return rp.post(process.env.UPDATE_URL, {
    json: {
      params: {
        buildtime: '',
        device: [ item.device, ...item.tags.split(' ') ].join('_'),
        deviceid: '',
        flag: '0',
        version: '',
      }
    }
  })
  .then(({ result }) => {
    if (!result) return null;
    const update = result[0];
    console.log(`- ${item.device}: ${update.filename}`);
    return {
      device: item.device,
      update: update,
    };
  });
}

const devices = parse(readFileSync('_data/devices.yml', 'utf8'));
mapSeries(devices, (item) => fetch(item))
.then(links => {
  let latest = '';
  let updated = 0;
  for (const item of links) {
    if (item) {
      latest += `${item.device}:\n`;
      latest += `  filename: ${item.update.filename}\n`;
      latest += `  md5sum: ${item.update.md5sum}\n`;
      latest += `  timestamp: ${item.update.timestamp}\n`;
      latest += `  url: ${item.update.url}\n`;
      if (item.update.timestamp > updated) {
        updated = item.update.timestamp;
      }
    }
  }

  writeFileSync('_data/links.yml', latest);
  writeFileSync('_data/last_updated.yml', `timestamp: ${updated}\n`);
});

const exp_devices = parse(readFileSync('_data/exp/devices.yml', 'utf8'));
mapSeries(exp_devices, (item) => fetch(item))
.then(links => {
  let latest = '';
  let updated = 0;
  for (const item of links) {
    if (item) {
      latest += `${item.device}:\n`;
      latest += `  filename: ${item.update.filename}\n`;
      latest += `  md5sum: ${item.update.md5sum}\n`;
      latest += `  timestamp: ${item.update.timestamp}\n`;
      latest += `  url: ${item.update.url}\n`;
      if (item.update.timestamp > updated) {
        updated = item.update.timestamp;
      }
    }
  }

  writeFileSync('_data/exp/links.yml', latest);
  writeFileSync('_data/exp/last_updated.yml', `timestamp: ${updated}\n`);
});
