// Устанавливаем начальное время (например, 4 часа)
let intervalTime = 4 * 60 * 60 * 1000; // 4 часа в миллисекундах
let timer;  // Таймер для отсчета времени

// Функция для форматирования времени
function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Функция для обновления времени до следующего сбора
function updateTimeRemaining() {
    const timeRemainingElement = document.getElementById('nextTime');
    if (intervalTime > 0) {
        timeRemainingElement.innerText = `Время до следующего скриншота: ${formatTime(intervalTime)}`;
        intervalTime -= 1000; // Уменьшаем на 1 секунду
    } else {
        clearInterval(timer); // Останавливаем таймер, если время закончилось
        timeRemainingElement.innerText = `Время для следующего скриншота!`;
    }
}

// Запуск автосбора
document.getElementById('screenshotForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const url = document.getElementById('url').value;
    const tableSelector = document.getElementById('tableSelector').value;
    const interval = parseInt(document.getElementById('interval').value);

    // Устанавливаем интервал в миллисекундах в зависимости от выбранного времени
    if (interval === 1) {
        intervalTime = 1 * 60 * 1000;  // 1 минута
    } else if (interval === 4) {
        intervalTime = 4 * 60 * 60 * 1000;  // 4 часа
    } else if (interval === 12) {
        intervalTime = 12 * 60 * 60 * 1000;  // 12 часов
    } else if (interval === 24) {
        intervalTime = 24 * 60 * 60 * 1000;  // 24 часа
    }

    // Обновление времени на странице
    updateTimeRemaining();
    timer = setInterval(updateTimeRemaining, 1000); // Обновляем каждую секунду

    // Отправка запроса на сервер для начала сбора скриншотов
    fetch('/screenshot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: url,
            tableSelector: tableSelector
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        alert(data.message); // Показать сообщение о результате
    })
    .catch(error => {
        console.error(error);
        alert('Ошибка при создании скриншота');
    });
});

// Остановка автосбора
document.getElementById('stopAuto').addEventListener('click', function () {
    clearInterval(timer);
    alert('Автосбор остановлен');
    document.getElementById('nextTime').innerText = 'Автосбор остановлен';
});
