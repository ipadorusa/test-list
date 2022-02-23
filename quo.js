const puppeteer = require('puppeteer'); // postman으로 요청 보냈을 때 이미지 로딩 상태 확인하기
const dotenv = require('dotenv');
dotenv.config();


let crawArray = [];
const crawler = async () => {
  try {
    const result = [];
    const browser = await puppeteer.launch({ headless: false, args: [`--window-size=1920,1080`] });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36');
    await page.goto(`http://www.wa.or.kr/board/list.asp?BoardID=0006`);
    const ipoName = await page.evaluate(() => {
      const name = Array.from(document.querySelectorAll(".gallery_list > ul> li > a > dl> dt"))
                      .map(v => v.textContent);      
      console.log(name)
      return name.map((v,i) => {
        return {
          name:v,
          ib: ib[i]
        }
      })
    });    
  } catch (e) {
    console.error('error',e);
  }
};
crawler();
