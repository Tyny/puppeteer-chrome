const serverless = require("serverless-http");
const express = require("express");
const app = express();

const chrome = require('chrome-aws-lambda');
const puppeteer = chrome.puppeteer;

app.get("/", async (req, res, next) => {
  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
  });

  const page = await browser.newPage();
  // Use A5 size at 150dpi
  const width = 874
  const height = 1240

  await page.setViewport({ width, height });

  await page.setDefaultNavigationTimeout(0);
  await page.goto("https://www.google.com");
  await page.waitForNetworkIdle({ idleTime: 5000, timeout: 20000 });

  const data = await page.evaluate(() => document.querySelector('*').outerHTML);
  console.log(data);

  const pdfBuffer = await page.pdf({
    margin: { top: '30px' },
    scale: 0.98,
    format: 'A4',
    printBackground: true,
    headless: true
  });

  console.log("PDFService: generate pdf SUCCESS");
  console.log(`BufferSize: ${pdfBuffer.length}`);

  // return res.status(200).json({
  //   message: "Hello from root!",
  // });

  const fileName = "demo.pdf";
  res.setHeader('Content-disposition', 'inline; filename="' + fileName + '"');
  res.setHeader('Content-type', 'application/pdf');
  res.set('Content-Length', Buffer.byteLength(pdfBuffer, 'utf-8')); 

  res.status(200).send(pdfBuffer);
  res.on("end", async () => {
    await browser.close();
  })
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
