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
    console.log("DOM loaded!");
    loadData();
    initNavigation();
    initCircleButtons();
    initCalculateButton();
    updateUI();
    updateTime();
});

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('budgetAppData');
    if (saved) {
        appData = JSON.parse(saved);
    }
    console.log("Data loaded:", appData);
}

// Сохранение данных
function saveData() {
    localStorage.setItem('budgetAppData', JSON.stringify(appData));
    updateUI();
}

// Навигация
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetScreen = this.getAttribute('data-screen');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            screens.forEach(screen => screen.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${targetScreen}-screen`).classList.add('active');
        });
    });
}

// Инициализация кнопок добавления кружков
function initCircleButtons() {
    console.log("Initializing circle buttons...");
    
    // Добавление дохода
    const incomeBtn = document.getElementById('add-income-circle');
    if (incomeBtn) {
        incomeBtn.addEventListener('click', function() {
            console.log("Income + clicked");
            addNewCircle('income');
        });
    }
    
    // Добавление долга
    const debtBtn = document.getElementById('add-debt-circle');
    if (debtBtn) {
        debtBtn.addEventListener('click', function() {
            console.log("Debt + clicked");
            addNewCircle('debt');
        });
    }
    
    // Добавление расхода
    const expenseBtn = document.getElementById('add-expense-circle');
    if (expenseBtn) {
        expenseBtn.addEventListener('click', function() {
            console.log("Expense + clicked");
            addNewCircle('expense');
        });
    }
}

// Добавление нового кружка
function addNewCircle(type) {
    const amount = prompt(`Введите сумму ${type === 'income' ? 'дохода' : type === 'debt' ? 'долга' : 'расхода'}:`);
    
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
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
        alert(`${type === 'income' ? 'Доход' : type === 'debt' ? 'Долг' : 'Расход'} добавлен!`);
    }
}

// Описание по умолчанию
function getDefaultDescription(type) {
    const defaults = {
        income: 'Доход',
        debt: 'Долг', 
        expense: 'Расход'
    };
    return defaults[type];
}

// Кнопка расчета
function initCalculateButton() {
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            calculateBudget();
        });
    }
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
            <span class="${balance >= 0 ? 'income' : 'expense'}">${appData.settings.currency}${balance}</span>
        </div>
    `;
    
    document.getElementById('results-content').innerHTML = resultsHTML;
    document.getElementById('results-card').style.display = 'block';
    document.querySelector('.balance-amount').textContent = appData.settings.currency + balance;
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
        container.innerHTML = '<div style="color: #8E8E93; font-size: 14px;">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="circle-item circle-${type}">
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
    
    document.querySelector('.balance-amount').textContent = appData.settings.currency + balance;
}

// Обновление времени
function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = 
            now.getHours().toString().padStart(2, '0') + ':' + 
            now.getMinutes().toString().padStart(2, '0');
    }
}