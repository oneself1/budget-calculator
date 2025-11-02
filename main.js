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
            margin: 25px 0;
        }
        .btn-primary {
            padding: 16px 24px;
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
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
    
    const amountStr = prompt("Введите сумму дохода:", "0");
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    const description = prompt("Введите описание дохода:", "Доход") || "Доход";
    
    // Используем первую доступную категорию
    const categories = app.incomes.getCategories();
    if (categories.length > 0) {
        app.addIncomeToCategory(categories[0].id);
    } else {
        ToastService.error("Нет категорий доходов");
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

function addExpenseOperation() {
    if (!app) return;
    
    const amountStr = prompt("Введите сумму расхода:", "0");
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    const description = prompt("Введите описание расхода:", "Расход") || "Расход";
    
    // Используем первую доступную категорию
    const categories = app.expenses.getCategories();
    if (categories.length > 0) {
        app.addExpenseToCategory(categories[0].id);
    } else {
        ToastService.error("Нет категорий расходов");
    }
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

// Цели
function showAddGoalModal() {
    // Простая реализация без модального окна
    const name = prompt('Введите название цели:');
    if (!name) return;
    
    const targetStr = prompt('Введите целевую сумму:');
    if (!targetStr) return;
    
    const target = parseFloat(targetStr) || 0;
    if (target <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    ToastService.info("Функция целей будет реализована в следующем обновлении");
}

function addToGoal(goalId) {
    ToastService.info("Функция целей будет реализована в следующем обновлении");
}

// Модальные окна (упрощенные версии)
function showCategorySelection() {
    ToastService.info("Выберите категорию из списка выше");
}

function hideCategorySelection() {
    // Просто скрываем любые активные модальные окна
    document.querySelectorAll('.category-modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function selectExpenseCategory(categoryId) {
    if (!app) return;
    app.addExpenseToCategory(categoryId);
    hideCategorySelection();
}

function showIncomeCategorySelection() {
    ToastService.info("Выберите категорию доходов из списка выше");
}

function hideIncomeCategorySelection() {
    document.querySelectorAll('.category-modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function selectIncomeCategory(categoryId) {
    if (!app) return;
    app.addIncomeToCategory(categoryId);
    hideIncomeCategorySelection();
}

// Настройки
function showSettingsModal() {
    ToastService.info("Настройки будут доступны в следующем обновлении");
}

function showRecurringTransactionsModal() {
    ToastService.info("Повторяющиеся операции будут доступны в следующем обновлении");
}

// Удаление операций (заглушки)
function deleteIncomeOperation(id) {
    if (confirm('Удалить эту операцию дохода?')) {
        ToastService.info("Удаление будет реализовано в следующем обновлении");
    }
}

function deleteExpenseOperation(id) {
    if (confirm('Удалить эту операцию расхода?')) {
        ToastService.info("Удаление будет реализовано в следующем обновлении");
    }
}

function deleteDebtOperation(id) {
    if (confirm('Удалить этот долг?')) {
        ToastService.info("Удаление будет реализовано в следующем обновлении");
    }
}

function deleteIncomeCategory(id) {
    if (confirm('Удалить эту категорию доходов?')) {
        ToastService.info("Удаление категорий будет реализовано в следующем обновлении");
    }
}

function deleteExpenseCategory(id) {
    if (confirm('Удалить эту категорию расходов?')) {
        ToastService.info("Удаление категорий будет реализовано в следующем обновлении");
    }
}

// Редактирование операций (заглушки)
function editIncomeOperation(id) {
    ToastService.info("Редактирование будет реализовано в следующем обновлении");
}

function editExpenseOperation(id) {
    ToastService.info("Редактирование будет реализовано в следующем обновлении");
}

function editDebtOperation(id) {
    ToastService.info("Редактирование будет реализовано в следующем обновлении");
}

// Бюджет (заглушки)
function setCategoryBudget(categoryId) {
    ToastService.info("Бюджеты будут реализованы в следующем обновлении");
}

function editCategoryBudget(categoryId) {
    ToastService.info("Бюджеты будут реализованы в следующем обновлении");
}

// Управление данными
function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
        ToastService.info("Очистка данных будет реализована в следующем обновлении");
    }
}

function exportData() {
    ToastService.info("Экспорт данных будет реализован в следующем обновлении");
}

// Резервная инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    console.log('🌐 Page fully loaded');
    
    // Фиксим layout после полной загрузки
    setTimeout(fixNavigationLayout, 100);
});