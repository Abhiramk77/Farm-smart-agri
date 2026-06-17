import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('Login Flow E2E Test', function () {
  this.timeout(120000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,800');

    let builder = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options);

    if (process.env.CHROMEWEBDRIVER) {
      const service = new chrome.ServiceBuilder(
        process.env.CHROMEWEBDRIVER + '/chromedriver'
      );
      builder = builder.setChromeService(service);
    }

    driver = await builder.build();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should successfully log in as farmer and redirect to farmer dashboard', async function () {
    // Navigate to login page
    await driver.get('http://localhost:5173/Farm-smart-agri/#/login');

    // Wait for form
    await driver.wait(until.elementLocated(By.css('form')), 15000);

    // Click Farmer role tab
    const farmerBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space()='Farmer']")),
      10000
    );
    await farmerBtn.click();

    // Fill Full Name
    const nameInput = await driver.findElement(By.css('input[name="name"]'));
    await nameInput.clear();
    await nameInput.sendKeys('Test Farmer');

    // Fill Phone Number
    const mobileInput = await driver.findElement(By.css('input[name="mobile"]'));
    await mobileInput.clear();
    await mobileInput.sendKeys('9999999999');

    // Fill Email
    const emailInput = await driver.findElement(By.id('email'));
    await emailInput.clear();
    await emailInput.sendKeys('farmer@farming.com');

    // Fill State
    const stateInput = await driver.findElement(By.css('input[name="state"]'));
    await stateInput.clear();
    await stateInput.sendKeys('Tamil Nadu');

    // Fill City
    const cityInput = await driver.findElement(By.css('input[name="city"]'));
    await cityInput.clear();
    await cityInput.sendKeys('Chennai');

    // Submit form
    const loginButton = await driver.findElement(By.id('login-button'));
    await loginButton.click();

    // Wait for redirect to farmer dashboard (Login.tsx navigates to /farmer/dashboard)
    await driver.wait(
      until.urlContains('/farmer/dashboard'),
      30000
    );

    const currentUrl = await driver.getCurrentUrl();
    assert.ok(
      currentUrl.includes('/farmer/dashboard'),
      `Expected URL to contain /farmer/dashboard, but got: ${currentUrl}`
    );
  });
});
