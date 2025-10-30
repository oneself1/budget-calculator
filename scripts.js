// Данные приложения
let appData = {
    accounts: [
        { id: 1, name: "Основной счет", balance: 0, icon: "💳", color: "#007AFF" }
    ],
    categories: [
        { id: 1, name: "Еда", type: "expense", icon: "🍕", color: "#FF9500", budget: 0 },
        { id: 2, name: "Транспорт", type: "expense", icon: "🚗", color: "#007AFF", budget: 0 },
        { id: 3, name: "Развлечения", type: "expense", icon: "🎬", color: "#FF2D55", budget: 0 },
        { id: 4, name: "Зарплата", type: "income", icon: "💰", color: "#34C759", budget: 0 },
        { id: 5, name: "Подработка", type: "income", icon: "👨‍💻", color: "#34C759", budget: 0 }
    ],
    transactions: [],
    settings: {
        currency: "₽"
    }
};

// Инициализация приложения - ОДИН DOMContentLoaded!
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initNavigation();
    initQuickActions();
    initFAB();
    updateUI();
    updateTime();
    
    // Дополнительные обработчики
    document.querySelector('.settings-btn').addEventListener('click', function() {
        showSettingsModal();
    });
});

// Загрузка данных из LocalStorage
function loadData() {
    const saved = localStorage.getItem('budgetAppData');
    if (saved) {
        appData = JSON.parse(saved);
    }
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
            
            // Обновляем конкретный экран
            updateScreen(targetScreen);
        });
    });
}

// Быстрые действия
function initQuickActions() {
    document.querySelectorAll('.action-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            showAddTransactionModal(type);
        });
    });
}

// FAB кнопка
function initFAB() {
    const fab = document.getElementById('add-transaction-fab');
    if (fab) {
        fab.addEventListener('click', function() {
            showAddTransactionModal('expense');
        });
    }
}

// Показ модального окна
function showAddTransactionModal(type = 'expense') {
    // Закрываем предыдущее модальное окно если есть
    closeModal();
    
    // Создаем модальное окно
    const modalHTML = `
        <div class="modal" id="transaction-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${type === 'income' ? '💸 Добавить доход' : type === 'expense' ? '🛒 Добавить расход' : '↔️ Перевод'}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Сумма (${appData.settings.currency})</label>
                        <input type="number" id="transaction-amount" placeholder="0" class="amount-input" autofocus>
                    </div>
                    <div class="form-group">
                        <label>Категория</label>
                        <select id="transaction-category" class="category-select">
                            ${appData.categories
                                .filter(cat => cat.type === type)
                                .map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`)
                                .join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Счет</label>
                        <select id="transaction-account" class="account-select">
                            ${appData.accounts.map(acc => 
                                `<option value="${acc.id}">${acc.icon} ${acc.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Дата</label>
                        <input type="date" id="transaction-date" class="date-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Описание (необязательно)</label>
                        <input type="text" id="transaction-description" placeholder="Например: Продукты" class="description-input">
                    </div>
                    <button class="save-btn" id="save-transaction">💾 Сохранить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Обработчики модального окна
    document.getElementById('save-transaction').addEventListener('click', saveTransaction);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('transaction-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Фокус на поле суммы
    document.getElementById('transaction-amount').focus();
}
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Обработчики модального окна
    document.getElementById('save-transaction').addEventListener('click', saveTransaction);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('transaction-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// Сохранение транзакции
function saveTransaction() {
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const categoryId = parseInt(document.getElementById('transaction-category').value);
    const accountId = parseInt(document.getElementById('transaction-account').value);
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value;
    const category = appData.categories.find(c => c.id === categoryId);
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        amount: category.type === 'income' ? amount : -amount,
        categoryId: categoryId,
        accountId: accountId,
        date: date,
        description: description || category.name,
        type: category.type
    };
    
    appData.transactions.unshift(transaction);
    
    // Обновляем баланс счета
    const account = appData.accounts.find(a => a.id === accountId);
    account.balance += transaction.amount;
    
    saveData();
    closeModal();
    showNotification('Операция добавлена!');
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('transaction-modal') || document.getElementById('settings-modal');
    if (modal) modal.remove();
}

// Уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Обновление интерфейса
function updateUI() {
    updateBalance();
    updateRecentTransactions();
    updateOperationsList();
    updateAccountsList();
    updateCharts();
}

// Обновление баланса
function updateBalance() {
    const totalBalance = appData.accounts.reduce((sum, account) => sum + account.balance, 0);
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        balanceElement.textContent = appData.settings.currency + totalBalance.toLocaleString();
    }
}

// Обновление последних транзакций
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    const recentTransactions = appData.transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет операций</div>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => {
        const category = appData.categories.find(c => c.id === transaction.categoryId);
        const account = appData.accounts.find(a => a.id === transaction.accountId);
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon" style="background: ${category.color}">
                        ${category.icon}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-meta">${account.name} • ${formatDate(transaction.date)}</div>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.amount > 0 ? 'income' : 'expense'}">
                    ${transaction.amount > 0 ? '+' : ''}${appData.settings.currency}${Math.abs(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
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
        const category = appData.categories.find(c => c.id === transaction.categoryId);
        const account = appData.accounts.find(a => a.id === transaction.accountId);
        
        return `
            <div class="operation-item">
                <div class="operation-info">
                    <div class="operation-icon" style="background: ${category.color}">
                        ${category.icon}
                    </div>
                    <div class="operation-details">
                        <div class="operation-title">${transaction.description}</div>
                        <div class="operation-meta">${account.name}</div>
                    </div>
                </div>
                <div class="operation-amount ${transaction.amount > 0 ? 'income' : 'expense'}">
                    ${transaction.amount > 0 ? '+' : ''}${appData.settings.currency}${Math.abs(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Обновление списка счетов
function updateAccountsList() {
    const container = document.getElementById('accounts-list');
    if (!container) return;
    
    container.innerHTML = appData.accounts.map(account => {
        return `
            <div class="account-card">
                <div class="account-icon">${account.icon}</div>
                <div class="account-info">
                    <div class="account-name">${account.name}</div>
                    <div class="account-balance">${appData.settings.currency}${account.balance.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Обновление графиков
function updateCharts() {
    updateIncomeExpenseChart();
    updateCategoriesChart();
}

// График доходы/расходы
function updateIncomeExpenseChart() {
    const container = document.getElementById('income-expense-chart');
    if (!container) return;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthTransactions = appData.transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const income = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const incomeHeight = income > 0 ? Math.min(income / 1000 * 10, 100) : 5;
    const expenseHeight = expense > 0 ? Math.min(expense / 1000 * 10, 100) : 5;
    
    container.innerHTML = `
        <div class="chart-bars">
            <div class="bar income-bar" style="height: ${incomeHeight}%">
                <span>${appData.settings.currency}${income}</span>
            </div>
            <div class="bar expense-bar" style="height: ${expenseHeight}%">
                <span>${appData.settings.currency}${expense}</span>
            </div>
        </div>
        <div class="chart-labels">
            <div class="label">Доходы</div>
            <div class="label">Расходы</div>
        </div>
    `;
}

// Круговая диаграмма категорий
function updateCategoriesChart() {
    const container = document.getElementById('categories-chart');
    if (!container) return;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthExpenses = appData.transactions.filter(t => 
        t.amount < 0 && 
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
    );
    
    const categoriesData = {};
    monthExpenses.forEach(t => {
        const category = appData.categories.find(c => c.id === t.categoryId);
        if (category) {
            categoriesData[category.name] = (categoriesData[category.name] || 0) + Math.abs(t.amount);
        }
    });
    
    if (Object.keys(categoriesData).length === 0) {
        container.innerHTML = '<div class="empty-state">Нет данных за этот месяц</div>';
        return;
    }
    
    const total = Object.values(categoriesData).reduce((a, b) => a + b, 0);
    
    container.innerHTML = `
        <div class="pie-chart">
            ${Object.entries(categoriesData).map(([name, amount], index, array) => {
                const percent = (amount / total) * 100;
                const startPercent = array.slice(0, index).reduce((sum, [_, amt]) => sum + (amt / total) * 100, 0);
                return `<div class="pie-segment" style="--segment-color: ${appData.categories.find(c => c.name === name)?.color || '#007AFF'}; --start: ${startPercent}%; --percent: ${percent}%"></div>`;
            }).join('')}
        </div>
        <div class="chart-legend">
            ${Object.entries(categoriesData).map(([name, amount]) => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${appData.categories.find(c => c.name === name)?.color || '#007AFF'}"></span>
                    <span class="legend-label">${name}</span>
                    <span class="legend-value">${appData.settings.currency}${amount}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = 
            now.getHours().toString().padStart(2, '0') + ':' + 
            now.getMinutes().toString().padStart(2, '0');
    }
}

function updateScreen(screen) {
    switch(screen) {
        case 'overview':
            updateRecentTransactions();
            break;
        case 'operations':
            updateOperationsList();
            break;
        case 'reports':
            updateCharts();
            break;
        case 'accounts':
            updateAccountsList();
            break;
    }
}

// Фильтры операций
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        // Здесь можно добавить фильтрацию операций
    }
});

// Добавление нового счета
function addNewAccount() {
    const accountName = prompt('Введите название счета:');
    if (accountName) {
        const newAccount = {
            id: Date.now(),
            name: accountName,
            balance: 0,
            icon: "💳",
            color: "#" + Math.floor(Math.random()*16777215).toString(16)
        };
        appData.accounts.push(newAccount);
        saveData();
        showNotification('Счет добавлен!');
    }
}

// Добавление новой категории
function addNewCategory() {
    const categoryName = prompt('Введите название категории:');
    const type = confirm('Это доход? (OK - доход, Отмена - расход)') ? 'income' : 'expense';
    
    if (categoryName) {
        const newCategory = {
            id: Date.now(),
            name: categoryName,
            type: type,
            icon: type === 'income' ? '💰' : '📦',
            color: "#" + Math.floor(Math.random()*16777215).toString(16),
            budget: 0
        };
        appData.categories.push(newCategory);
        saveData();
        showNotification('Категория добавлена!');
    }
}

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'budget-backup.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Импорт данных
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                appData = importedData;
                saveData();
                showNotification('Данные импортированы!');
            } catch (error) {
                alert('Ошибка при импорте данных');
            }
        };
        reader.readAsText(file);
    }
}

function showSettingsModal() {
    const modalHTML = `
        <div class="modal" id="settings-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Настройки</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <button class="settings-option" onclick="addNewAccount()">➕ Добавить счет</button>
                    <button class="settings-option" onclick="addNewCategory()">📁 Добавить категорию</button>
                    <button class="settings-option" onclick="exportData()">📤 Экспорт данных</button>
                    <label class="settings-option">
                        📥 Импорт данных
                        <input type="file" accept=".json" onchange="importData(event)" style="display: none;">
                    </label>
                    <button class="settings-option danger" onclick="clearAllData()">🗑️ Очистить все данные</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.querySelector('#settings-modal .close-modal').addEventListener('click', closeModal);
    document.getElementById('settings-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
        localStorage.removeItem('budgetAppData');
        location.reload();
    }
}