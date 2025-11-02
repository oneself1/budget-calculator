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

// Заглушки для остальных функций
function showSettingsModal() {
    ToastService.info("Настройки будут добавлены в следующем обновлении");
}

function showRecurringTransactionsModal() {
    ToastService.info("Повторяющиеся операции будут добавлены в следующем обновлении");
}
