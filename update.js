const { parse } = require('yaml').default;
const { readFileSync, writeFileSync } = require('fs');
const { mapSeries } = require('bluebird');
const rp = require('request-promise');

const devices = parse(readFileSync('_data/devices.yml', 'utf8'));

mapSeries(devices, (item) =>
  rp.post(process.env.UPDATE_URL, {
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
  })
)
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
