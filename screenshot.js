const puppeteer = require('puppeteer');

(async () => {
    const url = 'https://onlymonster.ai/s/Yi5m11DhNwiQK'; // URL страницы
    const screenshotName = `table_screenshot_${Date.now()}.png`; // Имя файла скриншота
    const tableSelector = '.table-wrapper'; // Укажите селектор таблицы

    const browser = await puppeteer.launch({
        headless: true, // Режим без интерфейса
        defaultViewport: { width: 1920, height: 1080 } // Размер окна браузера
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' }); // Дожидаемся полной загрузки страницы

    try {
        // Ждём, пока таблица появится на странице
        await page.waitForSelector(tableSelector, { timeout: 5000 });

        // Находим элемент таблицы
        const tableElement = await page.$(tableSelector);

        // Делаем скриншот только таблицы
        await tableElement.screenshot({ path: screenshotName });

        console.log(`Скриншот таблицы сохранён: ${screenshotName}`);
    } catch (error) {
        console.error('Ошибка: Таблица не найдена или другой сбой', error);
    }

    await browser.close(); // Закрываем браузер
})();
