const { describe, it, beforeEach, afterEach } = require('mocha');
const { Builder, Browser, By, until, Key } = require('selenium-webdriver');
const fs = require('fs');
const { assert } = require('chai');

class MarketPage {
    constructor(driver) {
        this.driver = driver;
        this.title = By.xpath('//span[text()="Каталог"]');
        this.search = By.xpath('//input[@id="1"]');
        this.card = By.className('product-card__title-line-container');
        this.score = By.className('value');
        this.delivery = By.xpath('//a[text()="Доставка"]');
        this.deliveryTitle = By.xpath('//h1');
    }

    async open() {
        try {
            console.log("Opening MVideo website");
            await this.driver.get('https://www.mvideo.ru/');
            console.log("Maximizing browser window");
            await this.driver.manage().window().maximize();
            console.log("Waiting for the title to appear");
            await this.driver.wait(until.elementLocated(this.title), 5000, 'Title did not appear');
        } catch (error) {
            console.error("Failed to open the page:", error);
            throw error;
        }
    }

    async checkScore() {
        try {
            await this.driver.wait(until.elementLocated(this.search), 5000);
            const search = await this.driver.findElement(this.search);
            await search.sendKeys('iphone 15', Key.RETURN);

            await this.driver.wait(until.elementLocated(this.card), 5000);

            const card = await this.driver.findElement(this.card);
            const score = await card.findElement(this.score);
            const scoreText = await score.getText();

            const scoreNumber = parseInt(scoreText, 10);
            return scoreNumber;
        } catch (error) {
            console.error("Failed to check the score:", error);
            throw error;
        }
    }

    async checkDelivery() {
        try {
            await this.driver.wait(until.elementLocated(this.delivery), 5000);
            const delivery = await this.driver.findElement(this.delivery);
            await delivery.click();

            await this.driver.wait(until.elementLocated(this.deliveryTitle), 5000);

            const deliveryTitle = await this.driver.findElement(this.deliveryTitle);
            const deliveryTitleText = await deliveryTitle.getText();
            return deliveryTitleText;
        } catch (error) {
            console.error("Failed to check delivery:", error);
            throw error;
        }
    }
}

describe('Market test', function() {
    this.timeout(10000); // Set the timeout for all tests in this suite to 10 seconds
    let driver;
    let marketPage;

    beforeEach(async function() {
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        marketPage = new MarketPage(driver);
        await marketPage.open();
    });

    afterEach(async function() {
        if (this.currentTest.state === 'failed') {
            const timestamp = new Date();
            const screenshotFilename = `error_${timestamp.toISOString()}.png`;
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync(screenshotFilename, screenshot, 'base64');
            console.error(`Test failed: ${this.currentTest.title}. Screenshot saved: ${screenshotFilename}`);
        }
        await driver.quit();
    });

    it('check iphone score', async function() {
        const scoreNumber = await marketPage.checkScore();
        assert.isBelow(scoreNumber, 6, 'Rating is less than 6');
    });

    it('check delivery', async function() {
        const deliveryTitleText = await marketPage.checkDelivery();
        assert.equal(deliveryTitleText, 'Доставка курьером, самовывоз — основные условия', 'Delivery text does not match');
    });
});
