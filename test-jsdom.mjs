import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => {
  console.log("JSDOM Error:", e);
});
virtualConsole.on("log", (message) => {
  console.log("JSDOM Log:", message);
});

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

setTimeout(() => {
  console.log("Root content:", dom.window.document.getElementById('root').innerHTML);
}, 2000);
