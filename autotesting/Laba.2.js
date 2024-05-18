const { assert, expect } = require('chai');
const { Builder, Browser, By, until } = require('selenium-webdriver');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

class BasePage {
    constructor(driver) {
        this.driver = driver;
    }
    async open() {
        console.log("Opening main page...");
        await this.driver.get('https://mospolytech.ru/');
    }
    async clickSchedule() {
        console.log("Clicking on Schedule link...");
        await this.driver.wait(until.elementLocated(By.xpath("//a[@href='/obuchauschimsya/raspisaniya/']")), 10000);
        await this.driver.findElement(By.xpath("//a[@href='/obuchauschimsya/raspisaniya/']")).click();
    }
    async clickSeeOnWebsite() {
        console.log("Clicking on See On Website link...");
        await this.driver.wait(until.elementLocated(By.xpath("//a[@href='https://rasp.dmami.ru/']")), 10000);
        await this.driver.findElement(By.xpath("//a[@href='https://rasp.dmami.ru/']")).click();
    }
    async checkTabs(){
        console.log("Checking browser tabs...");
        const initialWindowHandle = await this.driver.getWindowHandle();
        const newWindowHandle = await this.driver.wait(async () => {
            const handlesAfterAction = await this.driver.getAllWindowHandles();
            return handlesAfterAction.find(handle => handle !== initialWindowHandle);
        }, 10000);
        if (newWindowHandle) {
            await this.driver.switchTo().window(newWindowHandle);
        }
    }
    async getTitle(){
        console.log("Getting title of the page...");
        await this.driver.wait(until.elementLocated(By.xpath('//h1')), 10000);
        return await this.driver.findElement(By.xpath('//h1')).getText();
    }
}

class SchedulePage {
    constructor(driver) {
        this.driver = driver;
    }
    async checkGroups() {
        console.log("Checking groups...");
        const groupNumber = '221-323';
        const searchField = await this.driver.wait(until.elementLocated(By.className('groups')), 10000);
        await searchField.sendKeys(groupNumber);
        const resultElements = await this.driver.wait(until.elementsLocated(By.className('group')), 10000);
        const groupTexts = await Promise.all(resultElements.map(async (element) => {
            return await element.getText();
        }));
        if (groupTexts.length === 1 && groupTexts[0] === groupNumber) {
            await this.driver.findElement(By.id(groupNumber)).click();
        }
        await this.driver.sleep(1000);
    }
    async clickGroup(){
        console.log("Clicking on the group...");
        const groupNumber = '221-323';
        await this.driver.wait(until.elementLocated(By.id(groupNumber)), 10000);
        await this.driver.findElement(By.id(groupNumber)).click();
        await this.driver.sleep(1000);
    }
    async checkColor() {
        console.log("Checking today's schedule color...");
        await this.driver.wait(until.elementLocated(By.className('goToToday')), 10000);
        await this.driver.findElement(By.className('goToToday')).click();
        const parentElements = [await this.driver.wait(until.elementLocated(By.className("schedule-day_today")), 10000)];
        const data = await Promise.all(parentElements.map(async (element) => {
            const title = await element.findElement(By.className("schedule-day__title")).getText();
            return title;
        }));
        return data;
    }
}

describe('Schedule Page Test', function() {
    let driver;
    let basePage;
    let schedulePage;

    // Увеличение тайм-аута для всех тестов в этом наборе
    this.timeout(20000);

    before(async () => {
        driver = await new Builder().forBrowser(Browser.CHROME).build();
        basePage = new BasePage(driver);
        schedulePage = new SchedulePage(driver);
    });

    after(async () => {
        await driver.quit();
    });

    afterEach(async function() {
        if (this.currentTest.state === 'failed') {
            const screenshot = await driver.takeScreenshot();
            const testCaseName = this.currentTest.title.replace(/\s+/g, '-').toLowerCase();
            const dateTime = new Date().toISOString().replace(/[-:.]/g, '');
            const fileName = `${testCaseName}-${dateTime}.png`;
            await writeFileAsync(fileName, screenshot, 'base64');
        }
    });

    it('should search for a group schedule', async () => {
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
