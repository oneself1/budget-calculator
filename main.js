// main.js - глобальные функции для HTML
let app;

// Асинхронная инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Budget App: Starting...");
    app = new BudgetApp();
    await app.init();
    
    // Инициализация фиксированной навигации
    fixNavigationLayout();
    
    // Реинициализация после полной загрузки
    window.addEventListener('load', fixNavigationLayout);
    
    // Реинициализация при изменении ориентации
    window.addEventListener('resize', fixNavigationLayout);
    window.addEventListener('orientationchange', function() {
        setTimeout(fixNavigationLayout, 300);
    });
});

// Фикс для фиксированной навигации
function fixNavigationLayout() {
    const nav = document.querySelector('.bottom-nav');
    const appContainer = document.querySelector('.app-container');
    
    if (!nav || !appContainer) return;
    
    // Рассчитываем высоту навигации
    const navHeight = nav.offsetHeight;
    
    // Устанавливаем отступы
    document.body.style.paddingBottom = navHeight + 'px';
    appContainer.style.paddingBottom = '20px';
    
    // Для экранов устанавливаем минимальную высоту
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.minHeight = `calc(100vh - ${navHeight}px - 60px)`;
    });
}

// Улучшенная навигация между экранами
function smoothSwitchScreen(screenName) {
    const currentScreen = document.querySelector('.screen.active');
    const targetScreen = document.getElementById(screenName + '-screen');
    
    if (!currentScreen || !targetScreen) return;
    
    // Анимация перехода
    currentScreen.style.opacity = '0';
    currentScreen.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем соответствующую кнопку навигации
        const navItems = document.querySelectorAll('.nav-item');
        if (screenName === 'overview') {
            if (navItems[0]) navItems[0].classList.add('active');
        } else if (screenName === 'operations') {
            if (navItems[1]) navItems[1].classList.add('active');
        } else if (screenName === 'goals') {
            if (navItems[2]) navItems[2].classList.add('active');
        } else if (screenName === 'report') {
            if (navItems[3]) navItems[3].classList.add('active');
        }
        
        targetScreen.classList.add('active');
        targetScreen.style.opacity = '0';
        targetScreen.style.transform = 'translateY(10px)';
        
        // Запускаем анимацию появления
        requestAnimationFrame(() => {
            targetScreen.style.transition = 'all 0.3s ease-out';
            targetScreen.style.opacity = '1';
            targetScreen.style.transform = 'translateY(0)';
        });
        
        // Обновляем UI приложения
        if (window.app) {
            setTimeout(() => {
                if (screenName === 'operations') {
                    app.updateOperationsList();
                } else if (screenName === 'report') {
                    app.updateReport();
                } else if (screenName === 'goals') {
                    app.updateSavingsGoals();
                }
            }, 100);
        }
    }, 150);
}

// Глобальные функции для вызовов из HTML

// Навигация
function switchScreen(screenName) {
    smoothSwitchScreen(screenName);
}

// Доходы
async function addNewIncomeCategory() {
    if (app) await app.addNewIncomeCategory();
}

function addIncomeOperation() {
    if (app) app.addIncomeOperation();
}

function editIncomeCategory(categoryId) {
    if (app) app.editIncomeCategory(categoryId);
}

async function deleteIncomeCategory(categoryId) {
    if (app) await app.deleteIncomeCategory(categoryId);
}

// Долги
async function addNewCircle(type) {
    if (app) await app.addNewCircle(type);
}

async function editCircle(type, id) {
    if (app) await app.editCircle(type, id);
}

async function deleteCircle(type, id) {
    if (app) await app.deleteCircle(type, id);
}

async function makeDebtPayment(debtId) {
    if (app) await app.makeDebtPayment(debtId);
}

// Расходы
async function addNewExpenseCategory() {
    if (app) await app.addNewExpenseCategory();
}

function showCategorySelection() {
    if (app) app.showCategorySelection();
}

function hideCategorySelection() {
    if (app) app.hideCategorySelection();
}

function selectExpenseCategory(categoryId) {
    if (app) app.selectExpenseCategory(categoryId);
}

function selectSubcategory(subcategoryId) {
    if (app) app.selectSubcategory(subcategoryId);
}

function hideSubcategorySelection() {
    if (app) app.hideSubcategorySelection();
}

function editExpenseCategory(categoryId) {
    if (app) app.editExpenseCategory(categoryId);
}

async function deleteExpenseCategory(categoryId) {
    if (app) await app.deleteExpenseCategory(categoryId);
}

// Бюджет
async function setCategoryBudget(categoryId) {
    if (app) await app.setCategoryBudget(categoryId);
}

async function editCategoryBudget(categoryId) {
    if (app) await app.editCategoryBudget(categoryId);
}

// Цели
function showAddGoalModal() {
    if (app) app.showAddGoalModal();
}

function hideAddGoalModal() {
    if (app) app.hideAddGoalModal();
}

async function createNewGoal() {
    if (app) await app.createNewGoal();
}

async function addToGoal(goalId) {
    if (app) await app.addToGoal(goalId);
}

// Повторяющиеся операции
function showRecurringTransactionsModal() {
    if (app) app.showRecurringTransactionsModal();
}

function hideRecurringTransactionsModal() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) modal.classList.remove('active');
}

function showAddRecurringTransactionModal() {
    document.getElementById('add-recurring-modal').classList.add('active');
}

function hideAddRecurringModal() {
    document.getElementById('add-recurring-modal').classList.remove('active');
}

async function createRecurringTransaction() {
    if (!app) return;
    
    const type = document.getElementById('recurring-type').value;
    const amountStr = document.getElementById('recurring-amount').value;
    const description = document.getElementById('recurring-description').value.trim();
    const recurrence = document.getElementById('recurring-recurrence').value;
    const icon = document.getElementById('recurring-icon').value.trim() || '🔄';
    
    if (!description) {
        ToastService.error("Введите описание операции");
        return;
    }
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
        ToastService.error("Введите корректную сумму");
        return;
    }
    
    try {
        await app.recurring.addRecurringTransaction({
            type,
            amount,
            description,
            recurrence,
            icon
        });
        await app.saveData();
        hideAddRecurringModal();
        showRecurringTransactionsModal();
        ToastService.success("Повторяющаяся операция создана");
    } catch (error) {
        ToastService.error("Ошибка при создании операции: " + error.message);
    }
}

async function toggleRecurringTransaction(id) {
    if (app) await app.toggleRecurringTransaction(id);
}

async function deleteRecurringTransaction(id) {
    if (app) await app.deleteRecurringTransaction(id);
}

// Настройки
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const budgetAlerts = document.getElementById('setting-budget-alerts');
    const autoRecurring = document.getElementById('setting-auto-recurring');
    
    if (app) {
        budgetAlerts.checked = app.settings.budgetAlerts;
        autoRecurring.checked = app.settings.autoProcessRecurring;
    }
    
    modal.classList.add('active');
}

function hideSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
}

function updateSettings() {
    if (!app) return;
    
    const budgetAlerts = document.getElementById('setting-budget-alerts').checked;
    const autoRecurring = document.getElementById('setting-auto-recurring').checked;
    
    app.settings.budgetAlerts = budgetAlerts;
    app.settings.autoProcessRecurring = autoRecurring;
    
    app.saveData();
    ToastService.success("Настройки сохранены");
}

async function clearAllData() {
    if (app && confirm('Вы уверены? Все данные будут удалены, включая цели и настройки бюджета.')) {
        await app.resetToDefaults();
    }
}

async function exportData() {
    if (!app) return;
    
    try {
        const data = await app.storage.getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ToastService.success("Данные экспортированы");
    } catch (error) {
        ToastService.error("Ошибка при экспорте данных");
    }
}

// Модальные окна редактирования расходов
function hideEditCategoryModal() {
    if (app) app.hideEditCategoryModal();
}

async function saveCategoryChanges() {
    if (app) await app.saveCategoryChanges();
}

async function addNewSubcategory() {
    if (app) await app.addNewSubcategory();
}

function editSubcategory(subcategoryId) {
    if (app) app.editSubcategory(subcategoryId);
}

function hideEditSubcategoryModal() {
    if (app) app.hideEditSubcategoryModal();
}

async function saveSubcategoryChanges() {
    if (app) await app.saveSubcategoryChanges();
}

async function deleteSubcategory(subcategoryId) {
    if (app) await app.deleteSubcategory(subcategoryId);
}

// Модальные окна для доходов
function showIncomeCategorySelection() {
    if (app) app.showIncomeCategorySelection();
}

function hideIncomeCategorySelection() {
    if (app) app.hideIncomeCategorySelection();
}

function selectIncomeCategory(categoryId) {
    if (app) app.selectIncomeCategory(categoryId);
}

function selectIncomeSubcategory(subcategoryId) {
    if (app) app.selectIncomeSubcategory(subcategoryId);
}

function hideIncomeSubcategorySelection() {
    if (app) app.hideIncomeSubcategorySelection();
}

function hideEditIncomeCategoryModal() {
    if (app) app.hideEditIncomeCategoryModal();
}

async function saveIncomeCategoryChanges() {
    if (app) await app.saveIncomeCategoryChanges();
}

async function addNewIncomeSubcategory() {
    if (app) await app.addNewIncomeSubcategory();
}

function editIncomeSubcategory(subcategoryId) {
    if (app) app.editIncomeSubcategory(subcategoryId);
}

function hideEditIncomeSubcategoryModal() {
    if (app) app.hideEditIncomeSubcategoryModal();
}

async function saveIncomeSubcategoryChanges() {
    if (app) await app.saveIncomeSubcategoryChanges();
}

async function deleteIncomeSubcategory(subcategoryId) {
    if (app) await app.deleteIncomeSubcategory(subcategoryId);
}

// Операции
async function editExpenseOperation(id) {
    if (app) await app.editExpenseOperation(id);
}

async function deleteExpenseOperation(id) {
    if (app) await app.deleteExpenseOperation(id);
}

async function editIncomeOperation(id) {
    if (app) await app.editIncomeOperation(id);
}

async function deleteIncomeOperation(id) {
    if (app) await app.deleteIncomeOperation(id);
}

async function editDebtOperation(id) {
    if (app) await app.editDebtOperation(id);
}

async function deleteDebtOperation(id) {
    if (app) await app.deleteDebtOperation(id);
}

async function editDebtPayment(debtId, paymentIndex) {
    if (app) await app.editDebtPayment(debtId, paymentIndex);
}

async function deleteDebtPayment(debtId, paymentIndex) {
    if (app) await app.deleteDebtPayment(debtId, paymentIndex);
}

// Резервная инициализация
window.addEventListener('load', async function() {
    console.log("Budget App: Window loaded");
    if (!app) {
        console.log("Budget App: Emergency initialization");
        app = new BudgetApp();
        await app.init();
    }
});

// Фикс для касаний в навигации
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        item.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
        
        item.addEventListener('touchcancel', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Запрет масштабирования на iOS
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Запрет двойного тапа для масштабирования
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Глобальные обработчики для настроек
document.addEventListener('DOMContentLoaded', function() {
    const budgetAlerts = document.getElementById('setting-budget-alerts');
    const autoRecurring = document.getElementById('setting-auto-recurring');
    
    if (budgetAlerts) {
        budgetAlerts.addEventListener('change', updateSettings);
    }
    
    if (autoRecurring) {
        autoRecurring.addEventListener('change', updateSettings);
    }
});

// Функция для фильтрации операций (заглушка)
function showOperationsFilter() {
    ToastService.info("Фильтрация операций будет доступна в следующем обновлении");
}