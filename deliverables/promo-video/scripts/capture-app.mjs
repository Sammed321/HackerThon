import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EXE =
  process.env.CHROME_EXE ||
  'C:\\Users\\sammed\\.cache\\hyperframes\\chrome\\chrome-headless-shell\\win64-152.0.7977.30\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const URL_APP = process.env.APP_URL || 'http://localhost:5173';
const OUT = path.join(process.cwd(), 'assets', 'screens');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await sleep(350);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), type: 'png' });
  console.log(`shot: ${name}`);
}

async function clickBody(page) {
  await page.mouse.move(960, 700);
  await page.mouse.click(960, 600);
  await sleep(150);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EXE,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-device-scale-factor=1', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto(URL_APP, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#root', { timeout: 30000 });
  await sleep(3000); // fonts, canvases, hydration

  // 1 — Media Studio default (player + waveform + annotated transcript)
  await shot(page, 'studio-default');

  // 2 — Cultural Context Card open (click first highlighted term)
  try {
    await page.evaluate(() => {
      const t = document.querySelector('.term-hit');
      if (t) t.click();
    });
    await sleep(900);
    await shot(page, 'studio-context-card');
  } catch (e) {
    console.log('context card failed:', e.message);
  }

  // 3 — Heritage Constellation (force-directed graph; let physics settle)
  await clickBody(page);
  await page.reload({ waitUntil: 'load' });
  await sleep(2500);
  await page.keyboard.press('2');
  await sleep(3500);
  await shot(page, 'graph');

  // 4 — Talk to the Archive: empty state, then a grounded answer
  await page.keyboard.press('3');
  await sleep(1200);
  await shot(page, 'assistant-empty');
  try {
    await page.evaluate(() => {
      const text = 'Find all connections between Belagavi and the national movement in the archive';
      const btns = [...document.querySelectorAll('button')];
      const b = btns.find((x) => x.textContent.trim().includes(text));
      if (b) b.click();
      else throw new Error('prompt button not found');
    });
    // wait until an AI bubble with citations renders
    await page.waitForFunction(
      () => {
        const chips = [...document.querySelectorAll('button')].filter((x) => x.className.includes('mint'));
        return document.querySelectorAll('.chat-scroll > div').length >= 2 && chips.length >= 2;
      },
      { timeout: 20000 }
    );
    await sleep(1500);
    await shot(page, 'assistant-answer');
  } catch (e) {
    console.log('assistant answer failed:', e.message);
  }

  // 5 — Open Standards Hub
  await page.keyboard.press('4');
  await sleep(1500);
  await shot(page, 'standards');

  // 6 — Command palette (Ctrl+K) over the studio
  await page.keyboard.press('1');
  await sleep(800);
  await page.keyboard.down('Control');
  await page.keyboard.press('k');
  await page.keyboard.up('Control');
  await sleep(700);
  await shot(page, 'palette');

  const manifest = { url: URL_APP, viewport: '1920x1080@2x', shots: fs.readdirSync(OUT) };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
