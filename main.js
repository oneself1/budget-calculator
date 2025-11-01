// main.js - глобальные функции для HTML
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

const addIncomeOperation = safeCall(function() {
    app.showIncomeCategorySelection();
}, "Ошибка при добавлении операции дохода");

const editIncomeCategory = safeCall(function(categoryId) {
    app.editIncomeCategory(categoryId);
}, "Ошибка при редактировании категории доходов");

const deleteIncomeCategory = safeCall(async function(categoryId) {
    await app.deleteIncomeCategory(categoryId);
}, "Ошибка при удалении категории доходов");

// Долги
const addNewCircle = safeCall(async function(type) {
    await app.addNewCircle(type);
}, "Ошибка при добавлении");

const editCircle = safeCall(async function(type, id) {
    await app.editCircle(type, id);
}, "Ошибка при редактировании");

const deleteCircle = safeCall(async function(type, id) {
    await app.deleteCircle(type, id);
}, "Ошибка при удалении");

const makeDebtPayment = safeCall(async function(debtId) {
    await app.makeDebtPayment(debtId);
}, "Ошибка при оплате долга");

// Расходы
const addNewExpenseCategory = safeCall(async function() {
    await app.addNewExpenseCategory();
}, "Ошибка при добавлении категории расходов");

const showCategorySelection = safeCall(function() {
    app.showCategorySelection();
}, "Ошибка при выборе категории");

const hideCategorySelection = safeCall(function() {
    app.hideCategorySelection();
}, "Ошибка при скрытии выбора категории");

const selectExpenseCategory = safeCall(function(categoryId) {
    app.selectExpenseCategory(categoryId);
}, "Ошибка при выборе категории расходов");

const selectSubcategory = safeCall(function(subcategoryId) {
    app.selectSubcategory(subcategoryId);
}, "Ошибка при выборе подкатегории");

const hideSubcategorySelection = safeCall(function() {
    app.hideSubcategorySelection();
}, "Ошибка при скрытии выбора подкатегории");

const editExpenseCategory = safeCall(function(categoryId) {
    app.editExpenseCategory(categoryId);
}, "Ошибка при редактировании категории расходов");

const deleteExpenseCategory = safeCall(async function(categoryId) {
    await app.deleteExpenseCategory(categoryId);
}, "Ошибка при удалении категории расходов");

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

// Модальные окна редактирования расходов
const hideEditCategoryModal = safeCall(function() {
    app.hideEditCategoryModal();
}, "Ошибка при закрытии редактирования категории");

const saveCategoryChanges = safeCall(async function() {
    await app.saveCategoryChanges();
}, "Ошибка при сохранении категории");

const addNewSubcategory = safeCall(async function() {
    await app.addNewSubcategory();
}, "Ошибка при добавлении подкатегории");

const editSubcategory = safeCall(function(subcategoryId) {
    app.editSubcategory(subcategoryId);
}, "Ошибка при редактировании подкатегории");

const hideEditSubcategoryModal = safeCall(function() {
    app.hideEditSubcategoryModal();
}, "Ошибка при закрытии редактирования подкатегории");

const saveSubcategoryChanges = safeCall(async function() {
    await app.saveSubcategoryChanges();
}, "Ошибка при сохранении подкатегории");

const deleteSubcategory = safeCall(async function(subcategoryId) {
    await app.deleteSubcategory(subcategoryId);
}, "Ошибка при удалении подкатегории");

// Модальные окна для доходов
const showIncomeCategorySelection = safeCall(function() {
    app.showIncomeCategorySelection();
}, "Ошибка при выборе категории доходов");

const hideIncomeCategorySelection = safeCall(function() {
    app.hideIncomeCategorySelection();
}, "Ошибка при скрытии выбора категории доходов");

const selectIncomeCategory = safeCall(function(categoryId) {
    app.selectIncomeCategory(categoryId);
}, "Ошибка при выборе категории доходов");

const selectIncomeSubcategory = safeCall(function(subcategoryId) {
    app.selectIncomeSubcategory(subcategoryId);
}, "Ошибка при выборе подкатегории доходов");

const hideIncomeSubcategorySelection = safeCall(function() {
    app.hideIncomeSubcategorySelection();
}, "Ошибка при скрытии выбора подкатегории доходов");

const hideEditIncomeCategoryModal = safeCall(function() {
    app.hideEditIncomeCategoryModal();
}, "Ошибка при закрытии редактирования категории доходов");

const saveIncomeCategoryChanges = safeCall(async function() {
    await app.saveIncomeCategoryChanges();
}, "Ошибка при сохранении категории доходов");

const addNewIncomeSubcategory = safeCall(async function() {
    await app.addNewIncomeSubcategory();
}, "Ошибка при добавлении подкатегории доходов");

const editIncomeSubcategory = safeCall(function(subcategoryId) {
    app.editIncomeSubcategory(subcategoryId);
}, "Ошибка при редактировании подкатегории доходов");

const hideEditIncomeSubcategoryModal = safeCall(function() {
    app.hideEditIncomeSubcategoryModal();
}, "Ошибка при закрытии редактирования подкатегории доходов");

const saveIncomeSubcategoryChanges = safeCall(async function() {
    await app.saveIncomeSubcategoryChanges();
}, "Ошибка при сохранении подкатегории доходов");

const deleteIncomeSubcategory = safeCall(async function(subcategoryId) {
    await app.deleteIncomeSubcategory(subcategoryId);
}, "Ошибка при удалении подкатегории доходов");

// Операции
const editExpenseOperation = safeCall(async function(id) {
    await app.editExpenseOperation(id);
}, "Ошибка при редактировании операции расхода");

const deleteExpenseOperation = safeCall(async function(id) {
    await app.deleteExpenseOperation(id);
}, "Ошибка при удалении операции расхода");

const editIncomeOperation = safeCall(async function(id) {
    await app.editIncomeOperation(id);
}, "Ошибка при редактировании операции дохода");

const deleteIncomeOperation = safeCall(async function(id) {
    await app.deleteIncomeOperation(id);
}, "Ошибка при удалении операции дохода");

const editDebtOperation = safeCall(async function(id) {
    await app.editDebtOperation(id);
}, "Ошибка при редактировании операции долга");

const deleteDebtOperation = safeCall(async function(id) {
    await app.deleteDebtOperation(id);
}, "Ошибка при удалении операции долга");

const editDebtPayment = safeCall(async function(debtId, paymentIndex) {
    await app.editDebtPayment(debtId, paymentIndex);
}, "Ошибка при редактировании платежа по долгу");

const deleteDebtPayment = safeCall(async function(debtId, paymentIndex) {
    await app.deleteDebtPayment(debtId, paymentIndex);
}, "Ошибка при удалении платежа по долгу");

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
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Обработчики для кнопок закрытия
    const closeButtons = document.querySelectorAll('.modal-close, .close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
});

// Улучшенная обработка клавиатуры
document.addEventListener('keydown', function(e) {
    // ESC закрывает модальные окна
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
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