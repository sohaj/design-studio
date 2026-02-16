import puppeteer from 'puppeteer';

(async () => {
  console.log('🌐 Starting browser test for http://localhost:3002/\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('❌ PAGE ERROR:', error.message);
  });
  
  // Navigate to the page
  console.log('📍 Navigating to http://localhost:3002/...\n');
  await page.goto('http://localhost:3002/', { waitUntil: 'networkidle2', timeout: 10000 });
  
  // Wait for React to render
  await page.waitForTimeout(2000);
  
  // Check for canvas element
  console.log('\n🔍 Testing canvas element...');
  const canvasTest = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      return {
        found: true,
        width: canvas.width,
        height: canvas.height,
        context: canvas.getContext('webgl2') ? 'webgl2' : canvas.getContext('webgl') ? 'webgl' : 'no webgl'
      };
    }
    return { found: false };
  });
  
  console.log('Canvas test result:', JSON.stringify(canvasTest, null, 2));
  
  // Check for upload area
  console.log('\n🔍 Checking for upload area...');
  const uploadArea = await page.evaluate(() => {
    const uploadText = document.body.innerText;
    const hasAddScreens = uploadText.includes('Add screens or videos');
    const hasDropZone = uploadText.includes('Drop your screens here');
    const hasClickToBrowse = uploadText.includes('click to browse');
    
    return {
      hasAddScreens,
      hasDropZone,
      hasClickToBrowse,
      fullText: uploadText.substring(0, 500)
    };
  });
  
  console.log('Upload area check:', JSON.stringify(uploadArea, null, 2));
  
  // Take screenshot
  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: 'browser-test-screenshot.png', fullPage: true });
  console.log('Screenshot saved to browser-test-screenshot.png');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors: ${errors.length}`);
  console.log(`Canvas found: ${canvasTest.found}`);
  console.log(`Upload area present: ${uploadArea.hasAddScreens || uploadArea.hasDropZone}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  } else {
    console.log('\n✅ No JavaScript errors detected!');
  }
  
  await browser.close();
})();
