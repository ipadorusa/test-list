const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ObjectsToCsv = require('objects-to-csv');
const reportPath = path.resolve(__dirname, `../`, `report/`);
const { log } = require('../util/help');

dotenv.config();


class crawlerA11y {
  constructor() {
    this.siteInfo = [];
    this.browser = null;
    this.agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36';
    this.puppeteerOpt = { headless: true, args: [`--window-size=1920,1080`] };
    this.viewPortOpt = {width: 1080,height: 1080};
  }
  readUrl(idx) {
    return `http://www.wa.or.kr/board/list.asp?Page=${idx}&search=&SearchString=&BoardID=0006&cate=`;
  }
  async returnData() {
    return await this.siteInfo;
  }
  async launchBrowser() {
    log('launchBrowser!');
    this.browser = await puppeteer.launch(this.puppeteerOpt);
  }  
  async closeBrowwser() {
    await this.browser.close();
  }
  async setupPage() {
    const page = await this.browser.newPage();
    await page.setViewport(this.viewPortOpt);
    await page.setUserAgent(this.agent);
    return page;
  }
  async run() {
    log('run!');
    await this.launchBrowser();
    const page = await this.setupPage();
    await this.loopEvt(page, 1, 5);
    await this.saveCsv(this.siteInfo);
  }
  async evaluatePage(page) {
    const list = await page.evaluate(() => {
      const name = Array.from(document.querySelectorAll(".gallery_list > ul> li > a > dl> dt"))
                      .map(v => v.textContent);
      const siteUrl = Array.from(document.querySelectorAll(".gallery_list > ul> li > a > dl> dd > p:nth-child(2)"))
                      .map(v => v.textContent);
      return name.map((v,i) => ({name: v.replace(v.slice(0,6), ''), url: siteUrl[i]}));
    });
    this.siteInfo.push(...list);
  }
  async loopEvt(page, idx, maxIdx) {
    while(idx <= maxIdx) {
      await page.goto(this.readUrl(idx), {waitUntil: 'networkidle0', timeout: 0});      
      const list = await this.evaluatePage(page);
      idx++;
    }
  }
  async saveCsv(result) {
    const csv = new ObjectsToCsv(result);
    log('save csv!');
    await csv.toDisk(`${reportPath}/list.csv`);
    await this.closeBrowwser();
  }
}

module.exports = crawlerA11y;