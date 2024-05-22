const { expect } = require('chai');
const { Builder, By } = require('selenium-webdriver');
const fs = require('fs').promises;

class TodoApplication {
    constructor(driver) {
        this.driver = driver;
    }

    async load() {
        await this.driver.get('https://lambdatest.github.io/sample-todo-app/');
    }

    async fetchHeaderText() {
        return await this.driver.findElement(By.xpath('//h2')).getText();
    }

    async fetchRemainingTodosText() {
        return await this.driver.findElement(By.xpath('//span[contains(text(), "remaining")]')).getText();
    }

    async markTodoCompleted(index) {
        const todoItem = await this.driver.findElement(By.xpath(`//li[${index}]//span`));
        const classNameBefore = await todoItem.getAttribute('class');
        expect(classNameBefore).to.include('done-false');

        await this.driver.findElement(By.name(`li${index}`)).click();

        const classNameAfter = await todoItem.getAttribute('class');
        expect(classNameAfter).to.include('done-true');
    }

    async addNewTodoItem(description) {
        await this.driver.findElement(By.id('sampletodotext')).sendKeys(description);
        await this.driver.findElement(By.id('addbutton')).click();
    }
}

describe('Todo Application Tests', () => {
    let browser;
    let todoApp;

    before(async () => {
        browser = await new Builder().forBrowser('chrome').build();
        todoApp = new TodoApplication(browser);
    });

    after(async () => {
        await browser.quit();
    });

    afterEach(async function() {
        if (this.currentTest.state === 'failed') {
            const screenshot = await browser.takeScreenshot();
            const testName = this.currentTest.title.replace(/\s+/g, '-').toLowerCase();
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            const screenshotName = `${testName}-${timestamp}.png`;
            await fs.writeFile(screenshotName, screenshot, 'base64');
        }
    });

    it('should display the correct header text', async () => {
        await todoApp.load();
        const headerText = await todoApp.fetchHeaderText();
        expect(headerText).to.equal('LambdaTest Sample App');
    });

    it('should correctly update the remaining todos', async () => {
        await todoApp.load();
        let remainingTodosText = await todoApp.fetchRemainingTodosText();
        expect(remainingTodosText).to.equal('5 of 5 remaining');

        for (let i = 1; i <= 5; i++) {
            await todoApp.markTodoCompleted(i);
            remainingTodosText = await todoApp.fetchRemainingTodosText();
            expect(remainingTodosText).to.equal(`${5 - i} of 5 remaining`);
        }

        await todoApp.addNewTodoItem('Hello, world! Have a good day!');
        remainingTodosText = await todoApp.fetchRemainingTodosText();
        expect(remainingTodosText).to.equal('1 of 6 remaining');

        await todoApp.markTodoCompleted(6);
        remainingTodosText = await todoApp.fetchRemainingTodosText();
        expect(remainingTodosText).to.equal('0 of 6 remaining');
    });
});
