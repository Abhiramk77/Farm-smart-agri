import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('Login Flow E2E Test', function () {
  this.timeout(60000); // 60 seconds timeout for CI
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,800');

    // Use the chromedriver path provided by CI if available
    const service = process.env.CHROMEWEBDRIVER
      ? new chrome.ServiceBuilder(process.env.CHROMEWEBDRIVER + '/chromedriver')
      : undefined;

    const builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options);

    if (service) builder.setChromeService(service);

    driver = await builder.build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should successfully log in as farmer and redirect to dashboard', async function () {
    // Navigate to the local dev server
    await driver.get('http://localhost:5173/Farm-smart-agri/#/login');

    // Wait for the email input to be visible
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);

    // Type the farmer email
    await emailInput.sendKeys('farmer@farming.com');

    // Click the login button
    const loginButton = await driver.findElement(By.id('login-button'));
    await loginButton.click();

    // Wait for redirect to happen (wait for URL to change to dashboard)
    await driver.wait(until.urlContains('/dashboard'), 15000);

    // Verify the URL
    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl.includes('/dashboard'), true, 'User was not redirected to the dashboard');
  });
});
