const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs');
const path = require('path');
const { log } = require('../util/help');
const dotenv = require('dotenv');
const reportPath = path.resolve(__dirname, `../`, `report/`);
const {URL} = require('url');
const config = require('lighthouse/lighthouse-core/config/desktop-config.js');
dotenv.config();



class lightHouseCrawler {
  constructor({entries, auth}) {
    this.siteInfo = [];
    this.entries = [...entries];
    this.auth = auth;
    this.browser = null;
    this.agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36';
    this.PORT = 8041;
    this.puppeteerOpt = { headless: true, args: [`--window-size=1920,1080`, `--remote-debugging-port=${this.PORT}`]};
    this.viewPortOpt = {width: 1280,height: 1080};
    this.loginUrl = 'https://www.saramin.co.kr/zf_user/auth';
  }

  #blockedDomains = [
    `adservice.google.co.kr`,
    `adservice.google.com`,
    `bam-cell.nr-data.net`,
    `pagead2.googlesyndication.com`,
    `securepubads.g.doubleclick.net`,
    `tpc.googlesyndication.com`,
    `wcs.naver.com`,
    `wcs.naver.net`,
    `www.google-analytics.com`,
    `www.google.com`,
    `www.googletagmanager.com`,
    `www.googletagservices.com`,
  ];

  async launchBrowser() {
    log('launchBrowser!');    
    this.browser = await puppeteer.launch(this.puppeteerOpt);
  }

  async closeBrowwser() {
    await this.browser.close();
  }

  async setupPage() {
    const page = await this.browser.newPage();
    await page.setBypassCSP(true);
    await page.setJavaScriptEnabled(true);
    await page.setRequestInterception(true);
    await page.setCacheEnabled(true);
    await page.setViewport(this.viewPortOpt);
    await page.setUserAgent(this.agent);
    
    
    page.on(`request`, request => {
      const url = request.url();
      if(this.#blockedDomains.some(domain => url.includes(domain))) {
        request.abort();
      } else {
        request.continue();
      }
    });
    page.on(`dialog`, async dialog => {
      await dialog.dismiss();
    });

    return page;
  }

  async run() {
    log('---------------------RUN--------------------');    
    

    const entries = [...this.entries];
    for(const entry of entries) {
      const { url, auth, category, subcategory } = entry;      
      await this.launchBrowser();
      const page = await this.setupPage();
      if(auth) {
        log('--------------------auth-------------')
        await this.login(page, url);
      }else {
        log('--------------------no-------------', url)
        await this.explorer(page, url);
      }
    }
    fs.writeFile(`${reportPath}/scoreArray.json`, JSON.stringify(this.siteInfo, null, 2), e => {
      if(e) log(e);
    });
  }

  async login(page, url) {
    const {ID, PASSWORD} = process.env;    
    await page.goto(this.loginUrl, {waitUntil: 'networkidle0', timeout: 0});
    await page.evaluate((id, pwd) => {
      document.querySelector('#id').value = id;
      document.querySelector('#password').value = pwd;
    }, ID, PASSWORD);
    await page.click('.login-form .btn-login');
    log('---------------------explorer-aaa--------------------');
    await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 0});
    log('---------------------explorer-bbb--------------------');
    await this.explorer(page, url);
  }

  async explorer(page, url) {
    log('---------------------explorer-start--------------------');
    await page.goto(url,  {waitUntil: 'networkidle0', timeout: 0});

    const {lhr} = await lighthouse(url, {
      port: (new URL(this.browser.wsEndpoint())).port,
      output: 'json',
      logLevel: 'info',
      onlyCategories: ['accessibility'],
    }, config);

    await this.siteInfo.push({
      site: url,
      score: lhr.categories.accessibility.score
    });

    await this.closeBrowwser();

    log('---------------------explorer-end--------------------');
  }
}
module.exports = lightHouseCrawler;