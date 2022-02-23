const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const puppeteer = require('puppeteer'); // postman으로 요청 보냈을 때 이미지 로딩 상태 확인하기
const dotenv = require('dotenv');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
dotenv.config();





const crawler = async () => {
  try {
    
    const browser = await puppeteer.launch({ headless: false, args: [`--window-size=1920,1080`] });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36');
    let idx = 1;
    let result = [];
    while(idx <= 5) {
      await page.goto(`http://www.wa.or.kr/board/list.asp?Page=${idx}&search=&SearchString=&BoardID=0006&cate=`);
      const list = await page.evaluate(() => {
        const name = Array.from(document.querySelectorAll(".gallery_list > ul> li > a > dl> dt"))
                        .map(v => v.textContent);
        const siteUrl = Array.from(document.querySelectorAll(".gallery_list > ul> li > a > dl> dd > p:nth-child(2)"))
                        .map(v => v.textContent);
        return name.map((v,i) => ({name: v.replace(v.slice(0,6), ''), url: siteUrl[i]}));
      });
      result.push(...list);
      idx++;
    }
    const csv = new ObjectsToCsv(result);
 
    // Save to file:
    await csv.toDisk(`${__dirname}/report/list.csv`);

    const txtList = result.map(el => el.url);
    console.log('txtList', txtList);

    /* fs.writeFile(`${__dirname}/report/siteList.json`, JSON.stringify(result, null, 2), e => {
      if(e) log(e);
    }); */
  } catch (e) {
    console.error('error',e);
  }
};
crawler();

