const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const puppeteer = require('puppeteer');

const csv = fs.readFileSync('csv/data.csv');
const records = parse(csv.toString('utf-8'));

const crawler = async () => {
  const result = [];
  const browser = await puppeteer.launch({ 
    headless: false,
    args: [`--window-size=1920,1080`]
   });   
  await Promise.all(records.map(async (r, i) => {
    result[i] = r;
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36');

    await page.goto(r[1]);
    const scoreEl = await page.$('.score.score_left .star_score'); // TODO: 바로 evaluate 하는 방식도 알려주기
    if (scoreEl) {
      const text = await page.evaluate(element => element.textContent, scoreEl);
      console.log(r[0], '평점', text.trim());
      result[i][2] = text.trim();
    }    
    await page.waitFor(3000);
    await page.close();
  }));
  await browser.close();
  const str = stringify(result);
  fs.writeFileSync('csv/result.csv', str);
};
crawler();