// Данные приложения
let appData = {
    incomes: [],
    debts: [], 
    expenses: [],
    transactions: [],
    settings: { currency: "₽" }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("App started!");
    loadData();
    updateUI();
    startClock();
});

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('budgetAppData');
    if (saved) {
        try {
            appData = JSON.parse(saved);
            console.log("Data loaded:", appData);
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('budgetAppData', JSON.stringify(appData));
    updateUI();
}

// Переключение экранов
function switchScreen(screenName) {
    // Убираем активный класс у всех
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Добавляем активный класс выбранному
    document.querySelector(`.nav-item[onclick="switchScreen('${screenName}')"]`).classList.add('active');
    document.getElementById(`${screenName}-screen`).classList.add('active');
    
    if (screenName === 'operations') {
        updateOperationsList();
    }
}

// Добавление нового кружка
function addNewCircle(type) {
    console.log("Adding circle:", type);
    
    const amount = prompt(`Введите сумму ${getTypeName(type)}:`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Пожалуйста, введите корректную сумму");
        return;
    }
    
    const description = prompt('Введите описание:') || getDefaultDescription(type);
    
    const newItem = {
        id: Date.now(),
        amount: parseFloat(amount),
        description: description,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Добавляем в соответствующий массив
    if (type === 'income') {
        appData.incomes.push(newItem);
    } else if (type === 'debt') {
        appData.debts.push(newItem);
    } else {
        appData.expenses.push(newItem);
    }
    
    // Добавляем в историю
    appData.transactions.unshift({
        ...newItem,
        type: type,
        amount: type === 'income' ? newItem.amount : -newItem.amount
    });
    
    saveData();
    alert(`${getTypeName(type)} добавлен!`);
}

// Получение названия типа
function getTypeName(type) {
    const names = {
        income: 'дохода',
        debt: 'долга', 
        expense: 'расхода'
    };
    return names[type] || 'операции';
}

// Описание по умолчанию
function getDefaultDescription(type) {
    const defaults = {
        income: 'Доход',
        debt: 'Долг', 
        expense: 'Расход'
    };
    return defaults[type] || 'Операция';
}

// Расчет бюджета
function calculateBudget() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = appData.debts.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalDebts - totalExpenses;
    
    const resultsHTML = `
        <div class="result-item">
            <span>Общий доход:</span>
            <span class="income">${appData.settings.currency}${totalIncome}</span>
        </div>
        <div class="result-item">
            <span>Общие долги:</span>
            <span class="debt">${appData.settings.currency}${totalDebts}</span>
        </div>
        <div class="result-item">
            <span>Общие расходы:</span>
            <span class="expense">${appData.settings.currency}${totalExpenses}</span>
        </div>
        <div class="result-item total">
            <span>Итоговый баланс:</span>
            <span class="${balance >= 0 ? 'income' : 'expense'}">${appData.settings.currency}${Math.abs(balance)}</span>
        </div>
    `;
    
    document.getElementById('results-content').innerHTML = resultsHTML;
    document.getElementById('results-card').style.display = 'block';
}

// Обновление интерфейса
function updateUI() {
    updateCircles();
    updateBalance();
}

// Обновление кружков
function updateCircles() {
    updateCircleSection('income', appData.incomes);
    updateCircleSection('debt', appData.debts);
    updateCircleSection('expense', appData.expenses);
}

// Обновление секции с кружками
function updateCircleSection(type, items) {
    const container = document.getElementById(`${type}-circles`);
    if (!container) {
        console.error("Container not found:", `${type}-circles`);
        return;
    }
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="circle-item circle-${type}" onclick="editCircle('${type}', ${item.id})">
            <div class="circle-amount">${appData.settings.currency}${item.amount}</div>
            <div class="circle-label">${item.description}</div>
            <button class="circle-delete" onclick="event.stopPropagation(); deleteCircle('${type}', ${item.id})">×</button>
        </div>
    `).join('');
}

// Редактирование кружка
function editCircle(type, id) {
    const items = getItemsByType(type);
    const item = items.find(i => i.id === id);
    if (item) {
        const newAmount = prompt('Изменить сумму:', item.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            item.amount = parseFloat(newAmount);
            const newDescription = prompt('Изменить описание:', item.description) || item.description;
            item.description = newDescription;
            saveData();
        }
    }
}

// Удаление кружка
function deleteCircle(type, id) {
    if (confirm('Удалить эту запись?')) {
        const items = getItemsByType(type);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            saveData();
        }
    }
}

// Получение массива по типу
function getItemsByType(type) {
    switch(type) {
        case 'income': return appData.incomes;
        case 'debt': return appData.debts;
        case 'expense': return appData.expenses;
        default: return [];
    }
}

// Обновление баланса
function updateBalance() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = appData.debts.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalDebts - totalExpenses;
    
    const balanceElement = document.getElementById('balance-amount');
    if (balanceElement) {
        balanceElement.textContent = appData.settings.currency + balance;
    }
}

// Обновление списка операций
function updateOperationsList() {
    const container = document.getElementById('operations-list');
    if (!container) return;
    
    const transactions = appData.transactions;
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет операций</div>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => {
        const typeClass = transaction.amount > 0 ? 'income' : 'expense';
        const typeIcon = transaction.amount > 0 ? '💰' : transaction.type === 'debt' ? '🏦' : '🛒';
        const typeColor = transaction.amount > 0 ? '#34C759' : transaction.type === 'debt' ? '#FF9500' : '#FF3B30';
        
        return `
            <div class="operation-item">
                <div class="operation-info">
                    <div class="operation-icon" style="background: ${typeColor}">
                        ${typeIcon}
                    </div>
                    <div class="operation-details">
                        <div class="operation-title">${transaction.description}</div>
                        <div class="operation-meta">${formatDate(transaction.date)}</div>
                    </div>
                </div>
                <div class="operation-amount ${typeClass}">
                    ${transaction.amount > 0 ? '+' : ''}${appData.settings.currency}${Math.abs(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Часы
function startClock() {
    function updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = 
                now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0');
        }
    }
    
    updateTime();
    setInterval(updateTime, 60000);
}

// Настройки
function showSettingsModal() {
    const action = confirm("Настройки:\n\nОК - Очистить все данные\nОтмена - Отмена");
    if (action) {
        clearAllData();
    }
}

function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
        appData = {
            incomes: [],
            debts: [], 
            expenses: [],
            transactions: [],
            settings: { currency: "₽" }
        };
        saveData();
        alert('Все данные очищены!');
    }
}