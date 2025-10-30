// Данные приложения
let appData = {
    incomes: [],
    debts: [], 
    expenseCategories: [
        { id: 1, name: "Еда", amount: 0 },
        { id: 2, name: "Транспорт", amount: 0 },
        { id: 3, name: "Развлечения", amount: 0 },
        { id: 4, name: "Коммуналка", amount: 0 },
        { id: 5, name: "Одежда", amount: 0 },
        { id: 6, name: "Здоровье", amount: 0 }
    ],
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
    
    // Находим правильный элемент навигации
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`switchScreen('${screenName}')`)) {
            item.classList.add('active');
        }
    });
    
    document.getElementById(`${screenName}-screen`).classList.add('active');
    
    if (screenName === 'operations') {
        updateOperationsList();
    }
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

// Добавление нового кружка для доходов и долгов
function addNewCircle(type) {
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
    }
    
    saveData();
}

// Добавление новой категории расходов
function addNewExpenseCategory() {
    const categoryName = prompt('Введите название категории расходов:');
    if (!categoryName) return;
    
    const amount = prompt(`Введите сумму для категории "${categoryName}":`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Пожалуйста, введите корректную сумму");
        return;
    }
    
    const newCategory = {
        id: Date.now(),
        name: categoryName,
        amount: parseFloat(amount)
    };
    
    appData.expenseCategories.push(newCategory);
    saveData();
}

// Редактирование кружка доходов/долгов
function editCircle(type, id) {
    let items;
    if (type === 'income') {
        items = appData.incomes;
    } else if (type === 'debt') {
        items = appData.debts;
    }
    
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

// Редактирование категории расходов
function editExpenseCategory(categoryId) {
    const category = appData.expenseCategories.find(c => c.id === categoryId);
    if (category) {
        const newName = prompt('Изменить название категории:', category.name);
        if (newName) {
            category.name = newName;
        }
        
        const newAmount = prompt('Изменить сумму:', category.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            category.amount = parseFloat(newAmount);
            saveData();
        }
    }
}

// Удаление кружка доходов/долгов
function deleteCircle(type, id) {
    if (confirm('Удалить эту запись?')) {
        let items;
        if (type === 'income') {
            items = appData.incomes;
        } else if (type === 'debt') {
            items = appData.debts;
        }
        
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            saveData();
        }
    }
}

// Удаление категории расходов
function deleteExpenseCategory(categoryId) {
    if (confirm('Удалить эту категорию?')) {
        const index = appData.expenseCategories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            appData.expenseCategories.splice(index, 1);
            saveData();
        }
    }
}

// Расчет бюджета
function calculateBudget() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = appData.debts.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.expenseCategories.reduce((sum, category) => sum + category.amount, 0);
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
            expenseCategories: [
                { id: 1, name: "Еда", amount: 0 },
                { id: 2, name: "Транспорт", amount: 0 },
                { id: 3, name: "Развлечения", amount: 0 },
                { id: 4, name: "Коммуналка", amount: 0 },
                { id: 5, name: "Одежда", amount: 0 },
                { id: 6, name: "Здоровье", amount: 0 }
            ],
            settings: { currency: "₽" }
        };
        saveData();
        
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
    updateExpenseCategories();
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
            <button class="circle-delete" onclick="event.stopPropagation(); deleteCircle('${type}', ${item.id})">×</button>
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
            <div class="circle-amount">${appData.settings.currency}${category.amount}</div>
            <div class="circle-label">${category.name}</div>
            <button class="circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>
        </div>
    `).join('');
}

// Обновление баланса
function updateBalance() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = appData.debts.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.expenseCategories.reduce((sum, category) => sum + category.amount, 0);
    const balance = totalIncome - totalDebts - totalExpenses;
    
    document.getElementById('balance-amount').textContent = appData.settings.currency + balance;
}

// Обновление списка операций - ВАЖНО: транзакции создаются на лету из текущих данных
function updateOperationsList() {
    const container = document.getElementById('operations-list');
    if (!container) return;
    
    // Создаем транзакции на основе текущих данных
    const transactions = [];
    
    // Добавляем доходы
    appData.incomes.forEach(income => {
        transactions.push({
            id: income.id,
            amount: income.amount,
            description: income.description,
            date: income.date,
            type: 'income'
        });
    });
    
    // Добавляем долги
    appData.debts.forEach(debt => {
        transactions.push({
            id: debt.id,
            amount: -debt.amount,
            description: debt.description,
            date: debt.date,
            type: 'debt'
        });
    });
    
    // Добавляем расходы
    appData.expenseCategories.forEach(category => {
        transactions.push({
            id: category.id,
            amount: -category.amount,
            description: category.name,
            date: new Date().toISOString().split('T')[0],
            type: 'expense'
        });
    });
    
    // Сортируем по дате (новые сверху)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет операций</div>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => {
        const typeClass = transaction.amount > 0 ? 'income' : 'expense';
        const typeIcon = transaction.amount > 0 ? '💰' : '🛒';
        const typeColor = transaction.amount > 0 ? '#34C759' : '#FF3B30';
        
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

// Функция для отладки - показывает все данные в консоли
function debugData() {
    console.log("=== DEBUG DATA ===");
    console.log("Incomes:", appData.incomes);
    console.log("Debts:", appData.debts);
    console.log("Expense Categories:", appData.expenseCategories);
    console.log("===================");
}