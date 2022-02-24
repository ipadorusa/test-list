//const Analyzer = require('./lib/crawler');
const LightHouseCrawler = require('./lib/light');
const { log } = require('./util/help');
const fs = require('fs');
const path = require('path');
const jsYml = require('js-yaml');
let list;

(async () => {
  // const crawling = new Analyzer();
  // await crawling.run();
  // let siteUrl = await crawling.returnData();
  // const data = siteUrl.map(el => el.url);
  // log(data);

  try {
    const list = jsYml.load(fs.readFileSync(path.resolve(`${__dirname}/entry.yml`), 'utf-8'));
    const a = new LightHouseCrawler(entries: list);
    a.run();


  }catch(e) {
    log('e', e)
  }
  
})();
