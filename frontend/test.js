import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';
import path from 'path';

const APP_URL = 'http://localhost:5173';
const REPORT_FILE = path.join(process.cwd(), '..', 'Selenium_Test_Report.csv');

// Helper to write to CSV
const writeReport = (results) => {
  const header = 'Test Case ID,Description,Status,Error Details\n';
  const rows = results.map(r => `"${r.id}","${r.desc}","${r.status}","${r.error || ''}"`).join('\n');
  fs.writeFileSync(REPORT_FILE, header + rows);
  console.log(`\nReport generated at: ${REPORT_FILE}`);
};

async function runTests() {
  const results = [];
  let driver;

  try {
    // Launch Chrome
    console.log('Launching Chrome browser...');
    driver = await new Builder().forBrowser('chrome').build();
    
    // Set implicitly wait
    await driver.manage().setTimeouts({ implicit: 5000 });

    // ==========================================
    // TC-01: Load Application
    // ==========================================
    console.log('Running TC-01: Load Application...');
    try {
      await driver.get(APP_URL);
      await driver.wait(until.elementLocated(By.tagName('body')), 10000);
      const title = await driver.getTitle();
      console.log(`✅ TC-01 Passed. Title: ${title}`);
      results.push({ id: 'TC-01', desc: 'Load Application', status: 'Pass' });
    } catch (err) {
      console.error('❌ TC-01 Failed', err);
      results.push({ id: 'TC-01', desc: 'Load Application', status: 'Fail', error: err.message });
    }

    // ==========================================
    // TC-02: Invalid Login
    // ==========================================
    console.log('Running TC-02: Invalid Login...');
    try {
      await driver.get(`${APP_URL}/login`);
      
      const emailInput = await driver.wait(until.elementLocated(By.name('email')), 5000);
      const submitBtn = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);

      await emailInput.sendKeys('wrong@email.com');
      await submitBtn.click();

      // Wait for error message
      const errorEl = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'bg-red-50')]")),
        5000
      );
      const errorText = await errorEl.getText();
      
      console.log(`✅ TC-02 Passed. Error shown: ${errorText}`);
      results.push({ id: 'TC-02', desc: 'Invalid Login', status: 'Pass' });
    } catch (err) {
      console.error('❌ TC-02 Failed', err);
      results.push({ id: 'TC-02', desc: 'Invalid Login', status: 'Fail', error: err.message });
    }

    // ==========================================
    // TC-03: Valid Login
    // ==========================================
    console.log('Running TC-03: Valid Login...');
    try {
      await driver.get(`${APP_URL}/login`);
      
      const emailInput = await driver.wait(until.elementLocated(By.name('email')), 5000);
      const submitBtn = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);
      
      await emailInput.clear();
      await emailInput.sendKeys('farmer@farming.com');
      await submitBtn.click();

      // Wait for URL to change away from /login
      await driver.wait(until.urlContains('/chat'), 10000);
      
      console.log(`✅ TC-03 Passed. Successfully logged in.`);
      results.push({ id: 'TC-03', desc: 'Valid Login', status: 'Pass' });
    } catch (err) {
      console.error('❌ TC-03 Failed', err);
      results.push({ id: 'TC-03', desc: 'Valid Login', status: 'Fail', error: err.message });
    }



  } catch (err) {
    console.error('Critical Setup Error:', err);
  } finally {
    if (driver) {
      console.log('Closing browser...');
      await driver.quit();
    }
    // Write out the report
    writeReport(results);
  }
}

runTests();
