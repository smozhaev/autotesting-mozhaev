const { assert, expect } = require('chai');
const { Builder, Browser, By } = require('selenium-webdriver');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

class BasePage {
    constructor(driver) {
        this.driver = driver;
    }
    async open() {
        await this.driver.get('https://mospolytech.ru/');
    }
    async clickSchedule() {
        await this.driver.findElement(By.xpath("//a[@href='/obuchauschimsya/raspisaniya/']")).click();
    }
    async clickSeeOnWebsite() {
        await this.driver.findElement(By.xpath("//a[@href='https://rasp.dmami.ru/']")).click();
    }
    async checkTabs() {
        const initialWindowHandle = await this.driver.getWindowHandle();
        const newWindowHandle = await this.driver.wait(async () => {
            const handlesAfterAction = await this.driver.getAllWindowHandles();
            return handlesAfterAction.find(handle => handle !== initialWindowHandle);
        }, 3000);
        if (newWindowHandle) {
            await this.driver.switchTo().window(newWindowHandle);
        }
    }
    async getTitle() {
        return await this.driver.findElement(By.xpath('//h1')).getText();
    }
}

class SchedulePage {
    constructor(driver) {
        this.driver = driver;
    }
    async checkGroups() {
        const groupNumber = '221-323';
        const searchField = await this.driver.findElement(By.className('groups'));
        await searchField.sendKeys(groupNumber);
        const resultElements = await this.driver.findElements(By.className('group'));
        const groupTexts = await Promise.all(resultElements.map(async (element) => {
            return await element.getText();
        }));
        if (groupTexts.length === 1 && groupTexts[0] === groupNumber) {
            await this.driver.findElement(By.id(groupNumber)).click();
        }
        await this.driver.sleep(1000);
    }
    async clickGroup() {
        const groupNumber = '221-323';
        await this.driver.findElement(By.id(groupNumber)).click();
        await this.driver.sleep(1000);
    }
    async checkColor() {
        await this.driver.findElement(By.className('goToToday')).click();
        const parentElements = [await this.driver.findElement(By.className("schedule-day_today"))];
        const data = await Promise.all(parentElements.map(async (element) => {
            const title = await element.findElement(By.className("schedule-day__title")).getText();
            return title;
        }));
        return data;
    }
}

describe('Schedule Page Test', () => {
    let driver;
    let basePage;
    let schedulePage;
    before(async function () {
        this.timeout(10000);
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        basePage = new BasePage(driver);
        schedulePage = new SchedulePage(driver);
    });

    after(async () => {
        await driver.quit();
    });

    afterEach(async function () {
        if (this.currentTest.state === 'failed') {
            const screenshot = await driver.takeScreenshot();
            const testCaseName = this.currentTest.title.replace(/\s+/g, '-').toLowerCase();
            const dateTime = new Date().toISOString().replace(/[-:.]/g, '');
            const fileName = `${testCaseName}-${dateTime}.png`;
            await writeFileAsync(fileName, screenshot, 'base64');
        }
    });

    it('should search for a group schedule', async function () {
        this.timeout(10000);
        await basePage.open();
        await basePage.clickSchedule();
        const header = await basePage.getTitle();
        expect(header).to.equal('Расписания');
        await basePage.clickSeeOnWebsite();
        await basePage.checkTabs();
        await schedulePage.checkGroups();
        await schedulePage.clickGroup();
        const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        const now = new Date();
        const weekdayIndex = now.getDay() - 1;
        const result = await schedulePage.checkColor();
        assert.strictEqual(result[0], weekdays[weekdayIndex]);
    });
});
