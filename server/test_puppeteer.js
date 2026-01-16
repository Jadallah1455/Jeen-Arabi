const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting Puppeteer test...');
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Browser launched successfully.');

        const page = await browser.newPage();
        console.log('New page created.');

        await page.setContent('<h1>Hello Puppeteer</h1>');
        console.log('Page content set.');

        const buffer = await page.screenshot();
        console.log('Screenshot taken successfully. Size:', buffer.length);

        await browser.close();
        console.log('Browser closed. Test PASSED.');
    } catch (err) {
        console.error('Puppeteer Test FAILED:', err);
    }
})();
