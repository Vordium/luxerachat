const { createDriver } = require("./driver.js");
const { By, until } = require("selenium-webdriver");

let expect;
before(async () => {
  ({ expect } = await import("chai"));
});

describe("Charts dashboard", function () {
  this.timeout(30000);
  let driver;
  const url = "https://estatewise.vercel.app/charts";

  before(async () => {
    driver = await createDriver();
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  after(async () => {
    await driver.quit();
  });

  it("displays spinner, then renders chart cards", async () => {
    await driver.get(url);

    const spinner = await driver.findElement(By.css(".animate-spin"));
    expect(spinner).to.exist;

    await driver.wait(until.stalenessOf(spinner), 15000);

    const cards = await driver.findElements(
      By.css('[data-cy="chart-card"], .Card'),
    );
    expect(cards.length).to.be.greaterThan(0);
  });

  it("toggles dark-mode and persists after reload", async () => {
    await driver.get(url);
    const toggle = await driver.findElement(
      By.css('button[aria-label="Toggle theme"]'),
    );

    await toggle.click();
    let html = await driver.findElement(By.css("html"));
    expect(await html.getAttribute("class")).to.include("dark");

    await driver.navigate().refresh();
    html = await driver.findElement(By.css("html"));
    expect(await html.getAttribute("class")).to.include("dark");
  });

  it("“Back to Chat” navigates to /chat", async () => {
    await driver.get(url);
    await driver
      .findElement(
        By.xpath("//a[contains(@href,'/chat')][contains(.,'Back to Chat')]"),
      )
      .click();
    await driver.wait(until.urlContains("/chat"));
  });
});
