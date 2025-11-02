let app = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 DOM loaded, starting Budget App...");
    
    try {
        app = new BudgetApp();
        await app.init();
        console.log("🎉 Budget App started successfully!");
        
        // Сделаем app глобальной для вызовов из HTML
        window.app = app;
        
    } catch (error) {
        console.error("💥 Failed to start Budget App:", error);
        ToastService.error("Ошибка загрузки приложения");
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

function showAddGoalModal() {
    ToastService.info("Функция целей будет добавлена в следующем обновлении");
}

function hideAddGoalModal() {
    // Заглушка
}

function createNewGoal() {
    ToastService.info("Функция целей будет добавлена в следующем обновлении");
}

function addToGoal(goalId) {
    ToastService.info("Функция целей будет добавлена в следующем обновлении");
}

function showSettingsModal() {
    ToastService.info("Настройки будут добавлены в следующем обновлении");
}

function hideSettingsModal() {
    // Заглушка
}

function showRecurringTransactionsModal() {
    ToastService.info("Повторяющиеся операции будут добавлены в следующем обновлении");
}

function hideRecurringTransactionsModal() {
    // Заглушка
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

function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
        ToastService.info("Очистка данных будет добавлена в следующем обновлении");
    }
}

function exportData() {
    ToastService.info("Экспорт данных будет добавлен в следующем обновлении");
}
