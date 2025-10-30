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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
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
    
    if (type === 'income') {
        appData.incomes.push(newItem);
    } else if (type === 'debt') {
        appData.debts.push(newItem);
    } else {
        appData.expenses.push(newItem);
    }
    
    appData.transactions.unshift({
        ...newItem,
        type: type,
        amount: type === 'income' ? newItem.amount : -newItem.amount
    });
    
    saveData();
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

// Очистка всех данных
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
        
        // Очищаем результаты
        document.getElementById('results-content').innerHTML = '';
        document.getElementById('results-card').style.display = 'none';
        
        alert('Все данные очищены!');
    }
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
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="circle-item circle-${type}" onclick="editCircle('${type}', ${item.id})">
            <div class="circle-amount">${appData.settings.currency}${item.amount}</div>
            <div class="circle-label">${item.description}</div>
        </div>
    `).join('');
}

// Обновление баланса
function updateBalance() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = appData.debts.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalDebts - totalExpenses;
    
    document.getElementById('balance-amount').textContent = appData.settings.currency + balance;
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