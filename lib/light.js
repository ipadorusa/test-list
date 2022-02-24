const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const fs = require('fs');
const path = require('path');
const { log } = require('../util/help');
const dotenv = require('dotenv');

const {URL} = require('url');
const config = require('lighthouse/lighthouse-core/config/desktop-config.js');
dotenv.config();



class lightHouseCrawler {
  constructor({list}) {
    this.siteInfo = [];
    this.urlList = [...list];
    this.browser = null;
    this.agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36';
    this.PORT = 8041;
    this.puppeteerOpt = { headless: false, args: [`--window-size=1920,1080`, `--remote-debugging-port=${this.PORT}`]};
    this.viewPortOpt = {width: 1280,height: 1080};
    this.loginUrl = 'https://www.saramin.co.kr/zf_user/auth';
  }
  
  async launchBrowser() {
    log('launchBrowser!');
    log('urlList', this.urlList)
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
    log('---------------------RUN--------------------');    
    await this.launchBrowser();
    const page = await this.setupPage();
    
    await this.login(page);    
    await this.explorer(page);
  }

  async login(page) {

    const {ID, PASSWORD} = process.env;    
    await page.goto(this.loginUrl);
    await page.evaluate((id, pwd) => {
      document.querySelector('#id').value = id;
      document.querySelector('#password').value = pwd;
    }, ID, PASSWORD);
    await page.click('.login-form .btn-login');
    //await page.waitForNavigation();
  }

  async explorer(page, url) {
    log('---------------------explorer-start--------------------');
    await page.goto(url);
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
    log('---------------------explorer-end--------------------');
  }
}
module.exports = lightHouseCrawler;