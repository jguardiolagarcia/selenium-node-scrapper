const { Builder, Key, until, By } = require("selenium-webdriver");

async function start() {
  const states = require("./states");
  const chrome = require("selenium-webdriver/chrome");
  const fs = require("fs");
  const options = new chrome.Options();

  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--no-sandbox");

  const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver.get("https://www.doosanlift.com/dealer-locator/");
  await driver.wait(until.elementLocated(By.id("storelocator-search_address")));
  let inputField = await driver.findElement({
    id: "storelocator-search_address",
  });
  let storesArray = ["Store,Address,phone,website"];
  for (state in states) {
    console.log("searching state", states[state]);

    inputField.clear();

    await inputField.sendKeys(states[state] + ", USA"); // this submits on desktop browsers

    await driver.findElement(By.css('option[value="State"]')).click();
    await driver.sleep(1000);
    await inputField.sendKeys(Key.RETURN); // this submits on desktop browsers
    await driver.sleep(1500);

    // const text = await driver.executeScript('return document.documentElement.innerText')
    await driver.wait(until.elementLocated(By.id("storelocator-list")));

    let listElement = await driver.findElement({ id: "storelocator-list" });
    let stores = await listElement.findElements(By.css(".storelocator-store"));
    for (let store of stores) {
      let storeObject = [];
      await storeValue(store, "storename", storeObject);
      await storeValue(store, "address", storeObject);
      await storeValue(store, "phone", storeObject);
      await storeValue(store, "url", storeObject);
      storesArray.push(storeObject.join(","));
    }
    console.log(storesArray.length);
  }
  fs.writeFileSync("./outputs/output.csv", storesArray.join("\r\n"), "utf-8");

  driver.quit();
}

start();

async function storeValue(store, property, storeObject) {
  try {
    let value;
    let attribute = await store.findElement(
      By.css(".storelocator-" + property)
    );
    if (property != "url") {
      value = await attribute.getText();
      value = '"' + value.replace(/[\n\r]/g, " ") + '"';
      // value = value.replaceAll(',','');
      // value = value.replace(/[\n\r]/g,' ');
    } else {
      let aTag = await attribute.findElement(By.css("a"));
      value = await aTag.getAttribute("href");
    }
    storeObject.push(value);
  } catch (e) {
    console.log(e);
    storeObject.push('""');
  }
}
