const { Builder, Browser } = require("selenium-webdriver");

class BasePage {
    constructor() {
        this.driver = new Builder().forBrowser(Browser.CHROME).build();
        this.driver.manage().setTimeouts({ implicit: 100000 });
    }

    async navigateTo(url) {
        await this.driver.get(url);
    }

    async enterText(locator, text) {
        await this.driver.findElement(locator).sendKeys(text);
    }

    async getText(locator) {
        return await this.driver.findElement(locator).getText();
    }

    async click(locator) {
        await this.driver.findElement(locator).click();
    }

    async captureScreenshot(fileName) {
        const img = await this.driver.takeScreenshot();
        require("fs").writeFileSync(fileName, img, "base64");
    }

    async closeBrowser(delay = 0) {
        if (delay) await this.driver.sleep(delay);
        await this.driver.quit();
    }
}


class BagMarketPage extends BasePage {
    constructor() {
        super();
    }

    async open() {
        await this.navigateTo("https://market.yandex.ru/");
        await this.driver.manage().addCookie({
            name: "spravka",
            value: "dD0xNzE0OTI1MDg0O2k9MjEyLjQ2LjEwLjg4O0Q9QkIxMjBCMjA1OUNBMjgxREFCNjRBN0EwNzRBQTRBMTY4RDczQTBCNjQ5QjE5Q0ZFQjgxNUU2RkREM0FBODkzODlFRjAyNUQ4NUZFMEU1RUU5Rjc4RkRDNDI4OTc0ODM5OTY4QUMwREFENzY5QTE5MTNEOURBMkE5RDdFOUU2QTQ2NERDMzREOTFFNTkwOEMwRjc2NTU4NTBEM0VFODA4RTdERThDRTlGNDI5ODQ1RjJBOTBGM0ZBM0I2O3U9MTcxNDkyNTA4NDQzNjA0MTY5MDtoPTg1NzQxN2M1ZjAxZDJkMTc5ZWU1ZDgzMzMyY2I5NGQ3",
        });
        await this.navigateTo("https://market.yandex.ru/");
        await this.driver.manage().window().maximize();
    }

    async verifyHeaderText(expectedHeader) {
        const header = await this.driver.findElement(By.xpath("//h1")).getText();
        return expectedHeader === header;
    }

    async clickCatalog() {
        await this.click(By.xpath("//button[@class='_30-fz button-focus-ring Hkr1q _1pHod _2rdh3 _3rbM-']"));
    }

    async clickBigCategory() {
        await this.click(By.xpath("//li//a[@href='/catalog--kompiuternaia-tekhnika/54425']"));
    }

    async clickMediumCategory() {
        await this.click(By.xpath('//div[@class="_16snc"]/child::div/child::a[@href="/catalog--noutbuki-i-planshety/58480?hid=10604359"]'));
    }

    async clickSmallCategory() {
        await this.click(By.xpath('//div[@class="_16snc"]/child::div/child::a[@href="/catalog--noutbuki/54544/list?hid=91013"]'));
    }

    async addProductToBag() {
        await this.click(By.xpath("//div[@data-auto='SerpList']/child::div[position()=1]//ul//li[position()=2]//button[@aria-label='В корзину']"));

        const plusBtn = await this.driver.findElements(By.xpath("//div[@data-auto='SerpList']/child::div[position()=1]//ul//li[position()=2]//span[contains(text(),'+')]"));
        const minusBtn = await this.driver.findElements(By.xpath("//div[@data-auto='SerpList']/child::div[position()=1]//ul//li[position()=2]//span[contains(text(),'−')]"));
        const record = await this.driver.findElements(By.xpath('//div[@data-auto="SerpList"]/child::div[position()=1]//ul//li[position()=2]//span[@class="_2cyeu"]'));

        return { plusBtn, minusBtn, record };
    }

    async findProductAmount() {
        return await this.driver.findElement(By.xpath('//input[@aria-label="Количество товара"]'));
    }

    async increaseProductAmount() {
        await this.click(By.xpath("//button[@aria-label='Увеличить']"));
        return await this.driver.findElement(By.xpath('//input[@aria-label="Количество товара"]'));
    }

    async closeProductPopup() {
        await this.click(By.xpath("//button[@class='_2AXg- _1HZDF']"));
        return await this.driver.findElement(By.xpath('//span[@class="_2GVF8 _2SUA6 _33utW IFARr"]'));
    }

    async logFirstFiveProducts() {
        await this.clickCatalog();
        await this.clickBigCategory();
        await this.clickMediumCategory();
        await this.clickSmallCategory();

        const productNames = await this.driver.findElements(By.xpath('//div[@data-auto="SerpList"]/child::div//div[@class="m4M-1"]//h3'));
        const productPrices = await this.driver.findElements(By.xpath('//div[@data-auto="SerpList"]/child::div//span[@class="_1ArMm"]'));

        for (let i = 0; i < 5; i++) {
            console.log(`Product: ${await productNames[i].getText()}, price: ${await productPrices[i].getText()} руб.`);
        }

        return { secondProductName: productNames[1], secondProductPrice: productPrices[1] };
    }
}

module.exports = BagMarketPage;

