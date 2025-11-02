let app = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 DOM loaded, starting Budget App...");
    
    try {
        app = new BudgetApp();
        await app.init();
        console.log("🎉 Budget App started successfully!");
        
        window.app = app;
        
    } catch (error) {
        console.error("💥 Failed to start Budget App:", error);
        ToastService.error("Ошибка загрузки приложения. Пожалуйста, обновите страницу.");
    }
});

// Глобальные функции для HTML
function switchScreen(screenName) {
    if (app) app.switchScreen(screenName);
}

function addNewIncomeCategory() {
    if (app) app.addNewIncomeCategory();
}

function addIncomeToCategory(categoryId) {
    if (app) app.addIncomeToCategory(categoryId);
}

function addIncomeOperation() {
    if (app) {
        const categories = app.incomeCategories;
        if (categories.length > 0) {
            app.addIncomeToCategory(categories[0].id);
        } else {
            ToastService.error("Сначала добавьте категорию доходов");
        }
    }
}

function addNewExpenseCategory() {
    if (app) app.addNewExpenseCategory();
}

function addExpenseToCategory(categoryId) {
    if (app) app.addExpenseToCategory(categoryId);
}

function showCategorySelection() {
    ToastService.info("Выберите категорию из списка выше");
}

function addExpenseOperation() {
    if (app) {
        const categories = app.expenseCategories;
        if (categories.length > 0) {
            app.addExpenseToCategory(categories[0].id);
        } else {
            ToastService.error("Сначала добавьте категорию расходов");
        }
    }
}

function addNewCircle(type) {
    if (app && type === 'debt') {
        app.addNewDebt();
    }
}

function makeDebtPayment(debtId) {
    if (app) app.makeDebtPayment(debtId);
}

// Работающие функции для целей
function showAddGoalModal() {
    if (app) app.showAddGoalModal();
}

function addToGoal(goalId) {
    if (app) app.addToGoal(goalId);
}

// Работающая функция очистки данных
function clearAllData() {
    if (app) app.clearAllData();
}

// Функции для модальных окон
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        // Загружаем текущие настройки
        if (app) {
            document.getElementById('setting-budget-alerts').checked = app.settings.budgetAlerts;
            document.getElementById('setting-auto-recurring').checked = app.settings.autoProcessRecurring;
            document.getElementById('currency-select').value = app.settings.currency;
        }
        modal.classList.add('active');
    }
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function saveSettings() {
    if (app) {
        app.settings.budgetAlerts = document.getElementById('setting-budget-alerts').checked;
        app.settings.autoProcessRecurring = document.getElementById('setting-auto-recurring').checked;
        app.settings.currency = document.getElementById('currency-select').value;
        
        app.saveData();
        app.updateAllUI();
        hideSettingsModal();
        ToastService.success('Настройки сохранены');
    }
}

function showRecurringTransactionsModal() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideRecurringTransactionsModal() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showAddRecurringTransactionModal() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideAddRecurringModal() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function createRecurringTransaction() {
    ToastService.info("Функция повторяющихся операций будет добавлена в следующем обновлении");
    hideAddRecurringModal();
}

function hideAddGoalModal() {
    const modal = document.getElementById('add-goal-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function createNewGoal() {
    if (app) {
        const name = document.getElementById('goal-name').value;
        const target = document.getElementById('goal-target').value;
        const icon = document.getElementById('goal-icon').value;

        if (!name || !target) {
            ToastService.error("Заполните все поля");
            return;
        }

        const targetAmount = parseFloat(target);
        if (isNaN(targetAmount) || targetAmount <= 0) {
            ToastService.error("Введите корректную сумму");
            return;
        }

        const newGoal = {
            id: Date.now(),
            name: name,
            targetAmount: targetAmount,
            currentAmount: 0,
            icon: icon || '🎯',
            isCompleted: false,
            date: new Date().toISOString()
        };

        app.savingsGoals.push(newGoal);
        app.storage.add('savingsGoals', newGoal);
        app.saveData();
        app.updateAllUI();
        hideAddGoalModal();
        ToastService.success('Цель добавлена!');
    }
}

// Заглушки для функций, которые будут добавлены позже
function deleteIncomeOperation(id) {
    ToastService.info("Удаление будет добавлено в следующем обновлении");
}

function deleteExpenseOperation(id) {
    ToastService.info("Удаление будет добавлено в следующем обновлении");
}

function deleteDebt(id) {
    ToastService.info("Удаление будет добавлено в следующем обновлении");
}

function deleteIncomeCategory(id) {
    ToastService.info("Удаление будет добавлено в следующем обновлении");
}

function deleteExpenseCategory(id) {
    ToastService.info("Удаление будет добавлено в следующем обновлении");
}

function editIncomeOperation(id) {
    ToastService.info("Редактирование будет добавлено в следующем обновлении");
}

function editExpenseOperation(id) {
    ToastService.info("Редактирование будет добавлено в следующем обновлении");
}

function editDebt(id) {
    ToastService.info("Редактирование будет добавлено в следующем обновлении");
}

function setCategoryBudget(categoryId) {
    ToastService.info("Бюджеты будут добавлены в следующем обновлении");
}

function editCategoryBudget(categoryId) {
    ToastService.info("Бюджеты будут добавлены в следующем обновлении");
}

function showOperationsFilter() {
    ToastService.info("Фильтрация будет добавлена в следующем обновлении");
}

function exportData() {
    ToastService.info("Экспорт данных будет добавлен в следующем обновлении");
}
