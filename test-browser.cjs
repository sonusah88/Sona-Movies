const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer-core');

(async () => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless']
  });

  const response = await fetch(`http://localhost:${chrome.port}/json/version`);
  const data = await response.json();

  const browser = await puppeteer.connect({
    browserWSEndpoint: data.webSocketDebuggerUrl
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  await page.goto('http://localhost:5173');
  
  // Wait a bit for React to render
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await browser.close();
  await chrome.kill();
})();
