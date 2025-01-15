


const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

let autoScreenshotInterval = null; // Для хранения ID таймера автозапуска
let nextScreenshotTime = null; // Для хранения времени следующего скриншота


async function sendScreenshotToMake(base64Screenshot) {
   
    try {
        const response = await fetch('https://hook.eu2.make.com/j9i9v86ngvp3mkeogtj2bvef20c2brxd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                screenshot: base64Screenshot
            }),
        });

        const data = await response.json();
        console.log('Ответ от Make.com:', data);
    } catch (error) {
        console.error('Ошибка при отправке скриншота:', error);
    }
}


async function getScreen(url, tableSelector) {
   
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        await page.waitForSelector(tableSelector, { timeout: 10000 });

        await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, tableSelector);

        const tableElement = await page.$(tableSelector);

        // Делаем скриншот таблицы в формате base64
        const screenshotBuffer = await tableElement.screenshot();
        const base64Screenshot = Buffer.from(screenshotBuffer).toString('base64');
        const base64String = `data:image/png;base64,${base64Screenshot}`;
   
        // Отправляем скриншот через вебхук
        await sendScreenshotToMake(base64String);

        console.log('Скриншот отправлен в Make.com');
    } catch (error) {
        console.error('Ошибка при создании скриншота:', error.message);
    } finally {
        await browser.close();
    }
}


app.use(express.static('public')); // Для обслуживания статических файлов (HTML, CSS, JS)
app.use(express.json()); // Для обработки JSON

app.post('/screenshot', async (req, res) => {
    const { url, tableSelector } = req.body;

    if (!url || !tableSelector) {
        return res.status(400).send({ message: 'Не указаны URL или селектор таблицы' });
    }

    try {
        await getScreen(url, tableSelector);
        res.send({ message: 'Скриншот успешно создан' });
    } catch (error) {
        console.error('Ошибка при создании скриншота:', error);
        res.status(500).send({ message: 'Ошибка при создании скриншота' });
    }
});

app.post('/auto-screenshot', async (req, res) => {
  
    const { url, tableSelector, interval } = req.body;

    if (!url || !tableSelector || !interval) {
        return res.status(400).send({ message: 'Не указаны URL, селектор таблицы или интервал' });
    }

    // Очистка существующего таймера, если он есть
    if (autoScreenshotInterval) {
        clearInterval(autoScreenshotInterval);
    }

    // Немедленный первый сбор
    await getScreen(url, tableSelector);

    // Устанавливаем новый таймер
    autoScreenshotInterval = setInterval(async () => {
        nextScreenshotTime = Date.now() + interval;
        await getScreen(url, tableSelector);
    }, interval);

    // Вычисляем время следующего скриншота
    nextScreenshotTime = Date.now() + interval;

    console.log(`Автосбор скриншотов запущен с интервалом ${interval / (1000 * 60)} минут.`);
    res.send({ message: 'Автосбор скриншотов запущен' });
});

app.post('/stop-auto-screenshot', (req, res) => {
    if (autoScreenshotInterval) {
        clearInterval(autoScreenshotInterval);
        autoScreenshotInterval = null;
        nextScreenshotTime = null;
        console.log('Автосбор скриншотов остановлен.');
        res.send({ message: 'Автосбор скриншотов остановлен' });
    } else {
        res.status(400).send({ message: 'Автосбор не был запущен' });
    }
});

app.get('/next-screenshot-time', (req, res) => {
    if (!nextScreenshotTime) {
        return res.status(400).send({ message: 'Автосбор не запущен' });
    }
    res.send({ nextScreenshotTime });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port} http://localhost:3000/`);
});
