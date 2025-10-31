// Простые данные приложения
let appData = {
    incomes: [],
    debts: [], 
    expenseCategories: [],
    expenseOperations: [],
    settings: { currency: "₽" }
};

// Основная функция инициализации
function initApp() {
    console.log("Budget App: Initializing...");
    try {
        loadData();
        updateUI();
        startClock();
        console.log("Budget App: Initialized successfully");
    } catch (error) {
        console.error("Budget App: Initialization error:", error);
    }
}

// Загрузка данных
function loadData() {
    try {
        const saved = localStorage.getItem('budgetAppData');
        if (saved) {
            appData = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

// Сохранение данных
function saveData() {
    try {
        localStorage.setItem('budgetAppData', JSON.stringify(appData));
    } catch (e) {
        console.error("Error saving data:", e);
    }
}

// Обновление интерфейса
function updateUI() {
    updateBalance();
    updateCircles();
}

// Обновление баланса
function updateBalance() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = appData.expenseCategories.reduce((sum, item) => sum + (item.amount || 0), 0);
    const balance = totalIncome - totalExpenses;
    
    const balanceElement = document.getElementById('balance-amount');
    if (balanceElement) {
        balanceElement.textContent = appData.settings.currency + balance;
    }
}

// Обновление кружков
function updateCircles() {
    updateIncomeCategories();
    updateExpenseCategories();
}

// Обновление категорий доходов
function updateIncomeCategories() {
    const container = document.getElementById('income-circles');
    if (!container) return;
    
    if (appData.incomes.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = appData.incomes.map(income => `
        <div class="circle-item circle-income" onclick="editIncomeCategory(${income.id})">
            <div class="circle-actions">
                <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${income.id})">×</button>
            </div>
            <div class="circle-icon">${income.icon || '💰'}</div>
            <div class="circle-amount">${appData.settings.currency}${income.amount}</div>
            <div class="circle-label">${income.name}</div>
        </div>
    `).join('');
}

// Обновление категорий расходов
function updateExpenseCategories() {
    const container = document.getElementById('expense-circles');
    if (!container) return;
    
    if (appData.expenseCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = appData.expenseCategories.map(category => `
        <div class="circle-item circle-expense" onclick="editExpenseCategory(${category.id})">
            <div class="circle-actions">
                <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>
            </div>
            <div class="circle-icon">${category.icon || '🛒'}</div>
            <div class="circle-amount">${appData.settings.currency}${category.amount}</div>
            <div class="circle-label">${category.name}</div>
        </div>
    `).join('');
}

// Переключение экранов
function switchScreen(screenName) {
    console.log("Switching to screen:", screenName);
    
    // Обновляем навигацию
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        if ((screenName === 'overview' && index === 0) ||
            (screenName === 'operations' && index === 1) ||
            (screenName === 'report' && index === 2)) {
            item.classList.add('active');
        }
    });
    
    // Переключаем экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// Добавление новой категории доходов
function addNewIncomeCategory() {
    const name = prompt('Название категории доходов:');
    if (!name) return;
    
    const amount = parseFloat(prompt('Сумма:', '0')) || 0;
    
    appData.incomes.push({
        id: Date.now(),
        name: name,
        amount: amount,
        icon: '💰'
    });
    
    saveData();
}

// Добавление новой категории расходов
function addNewExpenseCategory() {
    const name = prompt('Название категории расходов:');
    if (!name) return;
    
    appData.expenseCategories.push({
        id: Date.now(),
        name: name,
        amount: 0,
        icon: '🛒'
    });
    
    saveData();
}

// Показать выбор категории
function showCategorySelection() {
    alert('Выбор категории - в разработке');
}

// Часы и дата
function startClock() {
    function updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) {
            timeElement.textContent = 
                now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0');
        }
        
        if (dateElement) {
            dateElement.textContent = 
                now.getDate().toString().padStart(2, '0') + '.' + 
                (now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                now.getFullYear();
        }
    }
    
    updateTime();
    setInterval(updateTime, 60000);
}

// Заглушки для остальных функций
function addNewCircle(type) {
    alert('Добавление ' + type + ' - в разработке');
}

function editIncomeCategory(id) {
    alert('Редактирование дохода - в разработке');
}

function editExpenseCategory(id) {
    alert('Редактирование расхода - в разработке');
}

function deleteIncomeCategory(id) {
    if (confirm('Удалить категорию?')) {
        appData.incomes = appData.incomes.filter(income => income.id !== id);
        saveData();
    }
}

function deleteExpenseCategory(id) {
    if (confirm('Удалить категорию?')) {
        appData.expenseCategories = appData.expenseCategories.filter(cat => cat.id !== id);
        saveData();
    }
}

function showSettingsModal() {
    alert('Настройки - в разработке');
}

function hideCategorySelection() {
    console.log('Hide category selection');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - starting app");
    initApp();
});

// Резервный запуск
window.addEventListener('load', function() {
    console.log("Window loaded");
    setTimeout(initApp, 100);
});