
//    const express = require('express');
//    const puppeteer = require('puppeteer');
//    const fs = require('fs');
//    const path = require('path');
   
//    const app = express();
//    const port = 3000;


// async function getScreen(res, url, tableSelector) {
//     const screenshotsDir = path.join(__dirname, 'screenshots');
//     const now = new Date();
//     const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
//     const screenshotName = `table_${formattedDate}.png`;
//     const screenshotPath = path.join(screenshotsDir, screenshotName);

//     if (!fs.existsSync(screenshotsDir)) {
//         fs.mkdirSync(screenshotsDir, { recursive: true });
//     }

//     const browser = await puppeteer.launch({
//         headless: true,
//         defaultViewport: { width: 1920, height: 1080 }
//     });

//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: 'networkidle2' }); // Ждём полной загрузки страницы

//     try {
//         // Ожидание появления таблицы
//         await page.waitForSelector(tableSelector, { timeout: 10000 });

//         // Прокручиваем страницу до таблицы
//         await page.evaluate((selector) => {
//             const element = document.querySelector(selector);
//             if (element) {
//                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
//             }
//         }, tableSelector);

//         // Дожидаемся полного рендера таблицы (например, когда появится достаточное количество строк)
//         await page.waitForFunction(
//             (selector) => {
//                 const table = document.querySelector(selector);
//                 return table && table.querySelectorAll('tr').length > 1; // Проверяем, что в таблице больше 10 строк
//             },
//             { timeout: 10000 },
//             tableSelector
//         );

//         // Делаем скриншот таблицы
//         const tableElement = await page.$(tableSelector);
//         await tableElement.screenshot({ path: screenshotPath });

//         console.log(`Скриншот таблицы сохранён: ${screenshotName}`);
//         res.send({ message: 'Скриншот сохранён', fileName: screenshotPath });
//     } catch (error) {
//         console.error('Ошибка при создании скриншота:', error);
//         res.status(500).send({ message: error.message });
//     } finally {
//         await browser.close();
//     }
// }


    
    
    
 
    
//     app.use(express.static('public'));  // Для обслуживания статических файлов (HTML, CSS, JS)
//     app.use(express.json()); // Для обработки JSON
    
//     // Роут для сбора скриншота
//     app.post('/screenshot', async (req, res) => {
//         const { url, tableSelector } = req.body;
    
//         if (!url || !tableSelector) {
//             return res.status(400).send({ message: 'Не указаны URL или селектор таблицы' });
//         }
    
//         try {
//             await getScreen(res, url, tableSelector);
//         } catch (error) {
//             console.error('Ошибка при создании скриншота:', error);
//             res.status(500).send({ message: 'Ошибка при создании скриншота' });
//         }
//     });
    
    
//     app.listen(port, () => {
//         console.log(`Сервер запущен на порту ${port} http://localhost:3000/`);
//     });

//----------------------------------------------------------------



const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

let autoScreenshotInterval = null; // Для хранения ID таймера автозапуска
let nextScreenshotTime = null; // Для хранения времени следующего скриншота

async function getScreen(url, tableSelector) {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const screenshotName = `table_${formattedDate}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.png`;
    const screenshotPath = path.join(screenshotsDir, screenshotName);

    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

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
        await tableElement.screenshot({ path: screenshotPath });

        console.log(`Скриншот таблицы сохранён: ${screenshotName}`);
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
