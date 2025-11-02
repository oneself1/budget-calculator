let app = null;

// Асинхронная инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Budget App: Starting initialization...");
    try {
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

        console.log("Budget App: Initialization complete");
    } catch (error) {
        console.error("Budget App: Critical initialization error:", error);
        alert("Критическая ошибка при загрузке приложения. Пожалуйста, обновите страницу.");
    }
});

// Фикс для фиксированной навигации
function fixNavigationLayout() {
    const nav = document.querySelector('.bottom-nav');
    const appContainer = document.querySelector('.app-container');
    
    if (!nav || !appContainer) {
        console.log("Navigation elements not found");
        return;
    }
    
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
    try {
        const currentScreen = document.querySelector('.screen.active');
        const targetScreen = document.getElementById(screenName + '-screen');
        
        if (!currentScreen || !targetScreen) {
            console.log("Screen not found:", screenName);
            return;
        }
        
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
    } catch (error) {
        console.error("Error switching screen:", error);
    }
}

// Глобальные функции для вызовов из HTML с проверкой app

// Навигация
function switchScreen(screenName) {
    if (!app) {
        console.error("App not initialized");
        return;
    }
    smoothSwitchScreen(screenName);
}

// Безопасные обертки для всех функций
function safeCall(callback, errorMessage = "Ошибка выполнения") {
    return function(...args) {
        try {
            if (!app) {
                console.error("App not initialized");
                ToastService.error("Приложение не загружено");
                return;
            }
            return callback(...args);
        } catch (error) {
            console.error(errorMessage, error);
            ToastService.error(errorMessage);
        }
    };
}

// Доходы
const addNewIncomeCategory = safeCall(async function() {
    await app.addNewIncomeCategory();
}, "Ошибка при добавлении категории доходов");

const addIncomeOperation = safeCall(async function() {
    await app.addIncomeOperation();
}, "Ошибка при добавлении операции дохода");

const addIncomeToCategory = safeCall(async function(categoryId, subcategoryId = null) {
    await app.addIncomeToCategory(categoryId, subcategoryId);
}, "Ошибка при добавлении дохода в категорию");

const showIncomeCategorySelection = safeCall(function() {
    app.showIncomeCategorySelection();
}, "Ошибка при выборе категории доходов");

const hideIncomeCategorySelection = safeCall(function() {
    app.hideIncomeCategorySelection();
}, "Ошибка при скрытии выбора категории доходов");

const selectIncomeCategory = safeCall(function(categoryId) {
    app.selectIncomeCategory(categoryId);
}, "Ошибка при выборе категории доходов");

const selectIncomeSubcategory = safeCall(function(categoryId, subcategoryId) {
    app.selectIncomeSubcategory(categoryId, subcategoryId);
}, "Ошибка при выборе подкатегории доходов");

const hideIncomeSubcategorySelection = safeCall(function() {
    app.hideIncomeSubcategorySelection();
}, "Ошибка при скрытии выбора подкатегории доходов");

// Долги
const addNewCircle = safeCall(async function(type) {
    await app.addNewCircle(type);
}, "Ошибка при добавлении");

const makeDebtPayment = safeCall(async function(debtId) {
    const debt = app.debts.get(debtId);
    if (!debt) return;
    
    const remaining = debt.amount - (debt.paidAmount || 0);
    if (remaining <= 0) {
        ToastService.info("Долг уже полностью погашен");
        return;
    }
    
    const amountStr = prompt(`Введите сумму платежа по долгу "${debt.description}" (осталось: ${app.settings.currency}${remaining}):`, remaining.toString());
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0 || amount > remaining) {
        ToastService.error("Введите корректную сумму платежа");
        return;
    }
    
    await app.debts.makePayment(debtId, amount);
    await app.saveData();
    app.updateUI();
    ToastService.success(`Платеж ${app.settings.currency}${amount.toFixed(2)} внесен`);
}, "Ошибка при оплате долга");

// Расходы
const addNewExpenseCategory = safeCall(async function() {
    await app.addNewExpenseCategory();
}, "Ошибка при добавлении категории расходов");

const addExpenseOperation = safeCall(async function() {
    await app.addExpenseOperation();
}, "Ошибка при добавлении операции расхода");

const showCategorySelection = safeCall(function() {
    app.showCategorySelection();
}, "Ошибка при выборе категории");

const hideCategorySelection = safeCall(function() {
    app.hideCategorySelection();
}, "Ошибка при скрытии выбора категории");

const selectExpenseCategory = safeCall(function(categoryId) {
    app.selectExpenseCategory(categoryId);
}, "Ошибка при выборе категории расходов");

const selectSubcategory = safeCall(function(categoryId, subcategoryId) {
    app.selectSubcategory(categoryId, subcategoryId);
}, "Ошибка при выборе подкатегории");

const hideSubcategorySelection = safeCall(function() {
    app.hideSubcategorySelection();
}, "Ошибка при скрытии выбора подкатегории");

const addExpenseToCategory = safeCall(async function(categoryId, subcategoryId = null) {
    await app.addExpenseToCategory(categoryId, subcategoryId);
}, "Ошибка при добавлении расхода в категорию");

// Бюджет
const setCategoryBudget = safeCall(async function(categoryId) {
    await app.setCategoryBudget(categoryId);
}, "Ошибка при установке бюджета");

const editCategoryBudget = safeCall(async function(categoryId) {
    await app.editCategoryBudget(categoryId);
}, "Ошибка при редактировании бюджета");

// Цели
const showAddGoalModal = safeCall(function() {
    app.showAddGoalModal();
}, "Ошибка при открытии модалки целей");

const hideAddGoalModal = safeCall(function() {
    app.hideAddGoalModal();
}, "Ошибка при закрытии модалки целей");

const createNewGoal = safeCall(async function() {
    await app.createNewGoal();
}, "Ошибка при создании цели");

const addToGoal = safeCall(async function(goalId) {
    await app.addToGoal(goalId);
}, "Ошибка при добавлении средств в цель");

// Повторяющиеся операции
const showRecurringTransactionsModal = safeCall(function() {
    app.showRecurringTransactionsModal();
}, "Ошибка при открытии повторяющихся операций");

const hideRecurringTransactionsModal = function() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) modal.classList.remove('active');
};

const showAddRecurringTransactionModal = function() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) modal.classList.add('active');
};

const hideAddRecurringModal = function() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) modal.classList.remove('active');
};

const createRecurringTransaction = safeCall(async function() {
    const type = document.getElementById('recurring-type')?.value;
    const amountStr = document.getElementById('recurring-amount')?.value;
    const description = document.getElementById('recurring-description')?.value.trim();
    const recurrence = document.getElementById('recurring-recurrence')?.value;
    const icon = document.getElementById('recurring-icon')?.value.trim() || '🔄';
    
    if (!description) {
        ToastService.error("Введите описание операции");
        return;
    }
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
        ToastService.error("Введите корректную сумму");
        return;
    }
    
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
}, "Ошибка при создании повторяющейся операции");

const toggleRecurringTransaction = safeCall(async function(id) {
    await app.toggleRecurringTransaction(id);
}, "Ошибка при переключении операции");

const deleteRecurringTransaction = safeCall(async function(id) {
    await app.deleteRecurringTransaction(id);
}, "Ошибка при удалении операции");

// Настройки
const showSettingsModal = safeCall(function() {
    const modal = document.getElementById('settings-modal');
    const budgetAlerts = document.getElementById('setting-budget-alerts');
    const autoRecurring = document.getElementById('setting-auto-recurring');
    
    if (app) {
        budgetAlerts.checked = app.settings.budgetAlerts;
        autoRecurring.checked = app.settings.autoProcessRecurring;
    }
    
    modal.classList.add('active');
}, "Ошибка при открытии настроек");

const hideSettingsModal = function() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
};

const updateSettings = safeCall(function() {
    const budgetAlerts = document.getElementById('setting-budget-alerts')?.checked;
    const autoRecurring = document.getElementById('setting-auto-recurring')?.checked;
    
    app.settings.budgetAlerts = budgetAlerts;
    app.settings.autoProcessRecurring = autoRecurring;
    
    app.saveData();
    ToastService.success("Настройки сохранены");
}, "Ошибка при сохранении настроек");

const clearAllData = safeCall(async function() {
    if (confirm('Вы уверены? Все данные будут удалены, включая цели и настройки бюджета.')) {
        await app.resetToDefaults();
    }
}, "Ошибка при очистке данных");

const exportData = safeCall(async function() {
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
}, "Ошибка при экспорте данных");

// Удаление операций
const deleteIncomeOperation = safeCall(async function(id) {
    if (confirm('Удалить эту операцию дохода?')) {
        await app.incomes.deleteOperation(id);
        await app.saveData();
        app.updateUI();
        ToastService.success("Операция дохода удалена");
    }
}, "Ошибка при удалении операции дохода");

const deleteExpenseOperation = safeCall(async function(id) {
    if (confirm('Удалить эту операцию расхода?')) {
        await app.expenses.deleteOperation(id);
        await app.saveData();
        app.updateUI();
        ToastService.success("Операция расхода удалена");
    }
}, "Ошибка при удалении операции расхода");

const deleteDebtOperation = safeCall(async function(id) {
    if (confirm('Удалить этот долг?')) {
        await app.debts.delete(id);
        await app.saveData();
        app.updateUI();
        ToastService.success("Долг удален");
    }
}, "Ошибка при удалении долга");

const deleteIncomeCategory = safeCall(async function(id) {
    if (confirm('Удалить эту категорию доходов? Все связанные операции также будут удалены.')) {
        await app.incomes.deleteCategory(id);
        await app.saveData();
        app.updateUI();
        ToastService.success("Категория доходов удалена");
    }
}, "Ошибка при удалении категории доходов");

const deleteExpenseCategory = safeCall(async function(id) {
    if (confirm('Удалить эту категорию расходов? Все связанные операции также будут удалены.')) {
        await app.expenses.deleteCategory(id);
        await app.saveData();
        app.updateUI();
        ToastService.success("Категория расходов удалена");
    }
}, "Ошибка при удалении категории расходов");

// Редактирование операций
const editIncomeOperation = safeCall(async function(id) {
    const operation = app.incomes.getOperation(id);
    if (!operation) return;
    
    const newAmountStr = prompt("Введите новую сумму:", operation.amount.toString());
    if (newAmountStr === null) return;
    
    const newAmount = parseFloat(newAmountStr) || 0;
    if (newAmount <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    const newDescription = prompt("Введите новое описание:", operation.description) || operation.description;
    
    await app.incomes.updateOperation(id, {
        amount: newAmount,
        description: newDescription
    });
    
    await app.saveData();
    app.updateUI();
    ToastService.success("Операция дохода обновлена");
}, "Ошибка при редактировании операции дохода");

const editExpenseOperation = safeCall(async function(id) {
    const operation = app.expenses.getOperation(id);
    if (!operation) return;
    
    const newAmountStr = prompt("Введите новую сумму:", operation.amount.toString());
    if (newAmountStr === null) return;
    
    const newAmount = parseFloat(newAmountStr) || 0;
    if (newAmount <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    const newDescription = prompt("Введите новое описание:", operation.description) || operation.description;
    
    await app.expenses.updateOperation(id, {
        amount: newAmount,
        description: newDescription
    });
    
    await app.saveData();
    app.updateUI();
    ToastService.success("Операция расхода обновлена");
}, "Ошибка при редактировании операции расхода");

const editDebtOperation = safeCall(async function(id) {
    const debt = app.debts.get(id);
    if (!debt) return;
    
    const newAmountStr = prompt("Введите новую сумму долга:", debt.amount.toString());
    if (newAmountStr === null) return;
    
    const newAmount = parseFloat(newAmountStr) || 0;
    if (newAmount <= 0) {
        ToastService.error("Сумма должна быть больше 0");
        return;
    }
    
    const newDescription = prompt("Введите новое описание:", debt.description) || debt.description;
    
    await app.debts.update(id, {
        amount: newAmount,
        description: newDescription
    });
    
    await app.saveData();
    app.updateUI();
    ToastService.success("Долг обновлен");
}, "Ошибка при редактировании операции долга");

// Резервная инициализация
window.addEventListener('load', async function() {
    console.log("Budget App: Window loaded");
    if (!app) {
        console.log("Budget App: Emergency initialization");
        try {
            app = new BudgetApp();
            await app.init();
        } catch (error) {
            console.error("Emergency initialization failed:", error);
        }
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
        budgetAlerts.addEventListener('change', function() {
            if (app) {
                app.settings.budgetAlerts = this.checked;
                app.saveData();
                ToastService.info("Настройки сохранены");
            }
        });
    }
    
    if (autoRecurring) {
        autoRecurring.addEventListener('change', function() {
            if (app) {
                app.settings.autoProcessRecurring = this.checked;
                app.saveData();
                ToastService.info("Настройки сохранены");
            }
        });
    }
});

// Функция для фильтрации операций
function showOperationsFilter() {
    ToastService.info("Фильтрация операций будет доступна в следующем обновлении");
}

// Глобальный объект для отладки
window.debugApp = function() {
    return app;
};

// Добавляем обработчики для модальных окон
document.addEventListener('DOMContentLoaded', function() {
    // Закрытие модальных окон по клику на фон
    const modals = document.querySelectorAll('.category-modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});

// Улучшенная обработка клавиатуры
document.addEventListener('keydown', function(e) {
    // ESC закрывает модальные окна
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.category-modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
});

// Предотвращение потери данных при перезагрузке
window.addEventListener('beforeunload', function(e) {
    if (app && app.initialized) {
        // Сохраняем данные перед закрытием
        app.saveData().catch(console.error);
    }
});
