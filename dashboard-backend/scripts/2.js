const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://openai.com");
  await page.screenshot({ path: "openai.png" });
  await browser.close();
})();