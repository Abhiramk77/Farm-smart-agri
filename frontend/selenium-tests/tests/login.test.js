import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('Login Flow E2E Test', function () {
  this.timeout(90000);
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1280,800');
    options.addArguments('--remote-debugging-port=9222');

    // Use the chromedriver path provided by CI if available
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
    if (driver) {
      await driver.quit();
    }
  });

  it('should successfully log in as farmer and redirect to chat or dashboard', async function () {
    // Navigate to the login page (HashRouter base path)
    await driver.get('http://localhost:5173/Farm-smart-agri/#/login');

    // Wait for the form to be visible
    await driver.wait(until.elementLocated(By.css('form')), 15000);

    // Select the Farmer role tab
    const farmerButton = await driver.wait(
      until.elementLocated(By.xpath("//button[text()='Farmer']")),
      10000
    );
    await farmerButton.click();

    // Fill in Full Name
    const nameInput = await driver.findElement(By.css('input[name="name"]'));
    await nameInput.clear();
    await nameInput.sendKeys('Test Farmer');

    // Fill in Phone Number
    const mobileInput = await driver.findElement(By.css('input[name="mobile"]'));
    await mobileInput.clear();
    await mobileInput.sendKeys('9999999999');

    // Fill in Email
    const emailInput = await driver.findElement(By.id('email'));
    await emailInput.clear();
    await emailInput.sendKeys('farmer@farming.com');

    // Fill in State
    const stateInput = await driver.findElement(By.css('input[name="state"]'));
    await stateInput.clear();
    await stateInput.sendKeys('Tamil Nadu');

    // Fill in City
    const cityInput = await driver.findElement(By.css('input[name="city"]'));
    await cityInput.clear();
    await cityInput.sendKeys('Chennai');

    // Click the login button
    const loginButton = await driver.findElement(By.id('login-button'));
    await loginButton.click();

    // After login, the app should navigate away from /login
    // With HashRouter: URL will be http://localhost:5173/Farm-smart-agri/#/chat or #/farmer/dashboard
    await driver.wait(
      async () => {
        const url = await driver.getCurrentUrl();
        return (
          url.includes('/chat') ||
          url.includes('/dashboard') ||
          url.includes('/farmer') ||
          url.includes('/buyer')
        );
      },
      30000,
      'User was not redirected after login — still on login page'
    );

    // Verify the URL changed away from /login
    const currentUrl = await driver.getCurrentUrl();
    const redirected =
      currentUrl.includes('/chat') ||
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/farmer') ||
      currentUrl.includes('/buyer');

    assert.strictEqual(
      redirected,
      true,
      `Expected redirect to /chat, /dashboard, /farmer, or /buyer — got: ${currentUrl}`
    );
  });
});
