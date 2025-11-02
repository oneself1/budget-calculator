// Глобальные переменные
let app = null;

// Основная инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Starting Budget App...");
    
    try {
        // Создаем экземпляр приложения
        app = new BudgetApp();
        
        // Инициализируем приложение
        await app.init();
        
        // Настраиваем глобальные обработчики
        setupGlobalHandlers();
        
        // Фиксим layout
        fixNavigationLayout();
        
        console.log("🎉 Budget App started successfully!");
        
    } catch (error) {
        console.error("💥 Failed to start Budget App:", error);
        showErrorScreen(error);
    }
});

// Настройка глобальных обработчиков
function setupGlobalHandlers() {
    setupNavigationHandlers();
    setupBeforeUnloadHandler();
    
    // Реинициализация при изменении ориентации
    window.addEventListener('resize', fixNavigationLayout);
    window.addEventListener('orientationchange', function() {
        setTimeout(fixNavigationLayout, 300);
    });
}

// Настройка обработчиков навигации
function setupNavigationHandlers() {
    // Обработчики для нижней навигации
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigationClick);
    });
}

// Обработчик клика по навигации
function handleNavigationClick(event) {
    const navItem = event.currentTarget;
    const screenName = getScreenNameFromNavItem(navItem);
    
    if (screenName && app) {
        event.preventDefault();
        switchScreen(screenName);
    }
}

// Получить имя экрана из элемента навигации
function getScreenNameFromNavItem(navItem) {
    const onclick = navItem.getAttribute('onclick');
    const match = onclick?.match(/switchScreen\('(\w+)'\)/);
    return match ? match[1] : null;
}

// Фикс для навигации
function fixNavigationLayout() {
    const nav = document.querySelector('.bottom-nav');
    const appContainer = document.querySelector('.app-container');
    
    if (!nav || !appContainer) {
        console.log("Navigation elements not found");
        return;
    }
    
    const navHeight = nav.offsetHeight;
    document.body.style.paddingBottom = navHeight + 'px';
    appContainer.style.paddingBottom = '20px';
}

// Обработчик beforeunload
function setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (event) => {
        if (app) {
            app.saveData().catch(console.error);
        }
    });
}

// Показать экран ошибки
function showErrorScreen(error) {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    appContainer.innerHTML = `
        <div class="error-screen">
            <div class="error-icon">💥</div>
            <h1>Ошибка приложения</h1>
            <p>Не удалось загрузить приложение. Пожалуйста, обновите страницу.</p>
            <div class="error-actions">
                <button onclick="location.reload()" class="btn-primary">
                    Обновить страницу
                </button>
                <button onclick="clearAllDataAndReload()" class="btn-secondary">
                    Сбросить данные и обновить
                </button>
            </div>
        </div>
    `;
    
    addErrorScreenStyles();
}

// Добавить стили для экрана ошибки
function addErrorScreenStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .error-screen {
            text-align: center;
            padding: 40px 20px;
            max-width: 400px;
            margin: 50px auto;
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .error-screen h1 {
            color: #FF3B30;
            margin-bottom: 16px;
        }
        .error-screen p {
            color: #8E8E93;
            margin-bottom: 30px;
        }
        .error-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 25px 0;
        }
        .btn-primary, .btn-secondary {
            padding: 16px 24px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-primary {
            background: #007AFF;
            color: white;
        }
        .btn-secondary {
            background: #FF3B30;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// Глобальные функции для HTML

// Навигация
function switchScreen(screenName) {
    if (!app) {
        console.error("App not initialized");
        return;
    }
    app.switchScreen(screenName);
}

// Доходы
function addNewIncomeCategory() {
    if (!app) return;
    app.addNewIncomeCategory();
}

function addIncomeToCategory(categoryId) {
    if (!app) return;
    app.addIncomeToCategory(categoryId);
}

function addIncomeOperation() {
    if (!app) return;
    
    // Используем первую доступную категорию
    const categories = app.incomes.getCategories();
    if (categories.length > 0) {
        app.addIncomeToCategory(categories[0].id);
    } else {
        ToastService.error("Нет категорий доходов. Сначала добавьте категорию.");
    }
}

// Расходы
function addNewExpenseCategory() {
    if (!app) return;
    app.addNewExpenseCategory();
}

function addExpenseToCategory(categoryId) {
    if (!app) return;
    app.addExpenseToCategory(categoryId);
}

function showCategorySelection() {
    const modal = document.getElementById('category-modal');
    if (!modal) return;
    
    const categoryList = document.getElementById('category-list');
    if (!categoryList) return;
    
    const categories = app.expenses.getCategories();
    let html = '';
    
    categories.forEach(category => {
        const totalAmount = app.expenses.calculateCategoryTotal(category);
        html += `
            <button class="category-option" onclick="selectExpenseCategory(${category.id})">
                <span class="category-option-icon">${category.icon || '🛒'}</span>
                <span class="category-option-name">${category.name}</span>
                <span class="category-option-amount">${app.settings.currency}${totalAmount.toFixed(2)}</span>
            </button>
        `;
    });
    
    categoryList.innerHTML = html;
    modal.classList.add('active');
}

function hideCategorySelection() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function selectExpenseCategory(categoryId) {
    if (!app) return;
    app.addExpenseToCategory(categoryId);
    hideCategorySelection();
}

function addExpenseOperation() {
    showCategorySelection();
}

// Долги
function addNewCircle(type) {
    if (!app) return;
    if (type === 'debt') {
        app.addNewDebt();
    }
}

function makeDebtPayment(debtId) {
    if (!app) return;
    app.makeDebtPayment(debtId);
}

// Бюджет
function setCategoryBudget(categoryId) {
    if (!app) return;
    app.setCategoryBudget(categoryId);
}

function editCategoryBudget(categoryId) {
    if (!app) return;
    app.editCategoryBudget(categoryId);
}

// Цели
function showAddGoalModal() {
    if (!app) return;
    app.showAddGoalModal();
}

function hideAddGoalModal() {
    if (!app) return;
    app.hideAddGoalModal();
}

function createNewGoal() {
    if (!app) return;
    app.createNewGoal();
}

function addToGoal(goalId) {
    if (!app) return;
    app.addToGoal(goalId);
}

function editGoal(goalId) {
    if (!app) return;
    app.editGoal(goalId);
}

function deleteGoal(goalId) {
    if (!app) return;
    app.deleteGoal(goalId);
}

// Настройки
function showSettingsModal() {
    if (!app) return;
    app.showSettingsModal();
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function saveSettings() {
    if (!app) return;
    app.saveSettings();
    hideSettingsModal();
}

function exportData() {
    if (!app) return;
    app.exportData();
}

function clearAllData() {
    if (!app) return;
    app.clearAllData();
}

// Повторяющиеся операции
function showRecurringTransactionsModal() {
    ToastService.info("Повторяющиеся операции будут доступны в следующем обновлении");
}

function hideRecurringTransactionsModal() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Удаление операций
function deleteIncomeOperation(id) {
    if (!app) return;
    app.deleteIncomeOperation(id);
}

function deleteExpenseOperation(id) {
    if (!app) return;
    app.deleteExpenseOperation(id);
}

function deleteDebt(id) {
    if (!app) return;
    app.deleteDebt(id);
}

function deleteIncomeCategory(id) {
    if (!app) return;
    app.deleteIncomeCategory(id);
}

function deleteExpenseCategory(id) {
    if (!app) return;
    app.deleteExpenseCategory(id);
}

// Редактирование операций
function editIncomeOperation(id) {
    if (!app) return;
    app.editIncomeOperation(id);
}

function editExpenseOperation(id) {
    if (!app) return;
    app.editExpenseOperation(id);
}

function editDebt(id) {
    if (!app) return;
    app.editDebt(id);
}

// Фильтрация операций
function showOperationsFilter() {
    ToastService.info("Фильтрация операций будет доступна в следующем обновлении");
}

// Полный сброс данных и перезагрузка
async function clearAllDataAndReload() {
    if (!confirm('Это действие удалит ВСЕ данные и перезагрузит приложение. Продолжить?')) {
        return;
    }
    
    try {
        if (app) {
            await app.clearAllData();
        } else {
            const storage = new IndexedDBService();
            await storage.clearAllData();
        }
        
        ToastService.success('Данные сброшены');
        location.reload();
        
    } catch (error) {
        console.error('Clear data failed:', error);
        ToastService.error('Не удалось сбросить данные');
    }
}

// Резервная инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    console.log('🌐 Page fully loaded');
    
    // Фиксим layout после полной загрузки
    setTimeout(fixNavigationLayout, 100);
});