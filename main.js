// main.js - глобальные функции для HTML
let app;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("Budget App: Starting...");
    app = new BudgetApp();
    app.init();
    
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
    
    // Для экрана операций и отчета устанавливаем минимальную высоту
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        if (screen.id !== 'overview-screen') {
            screen.style.minHeight = `calc(100vh - ${navHeight}px - 60px)`;
        }
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
        } else if (screenName === 'report') {
            if (navItems[2]) navItems[2].classList.add('active');
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
            if (screenName === 'operations') {
                setTimeout(() => app.updateOperationsList(), 100);
            } else if (screenName === 'report') {
                setTimeout(() => app.updateReport(), 100);
            }
        }
    }, 150);
}

// Глобальные функции для вызовов из HTML

// Навигация
function switchScreen(screenName) {
    smoothSwitchScreen(screenName);
}

// Доходы
function addNewIncomeCategory() {
    if (app) app.addNewIncomeCategory();
}

function addIncomeOperation() {
    if (app) app.addIncomeOperation();
}

function editIncomeCategory(categoryId) {
    if (app) app.editIncomeCategory(categoryId);
}

function deleteIncomeCategory(categoryId) {
    if (app) app.deleteIncomeCategory(categoryId);
}

// Долги
function addNewCircle(type) {
    if (app) app.addNewCircle(type);
}

function editCircle(type, id) {
    if (app) app.editCircle(type, id);
}

function deleteCircle(type, id) {
    if (app) app.deleteCircle(type, id);
}

function makeDebtPayment(debtId) {
    if (app) app.makeDebtPayment(debtId);
}

// Расходы
function addNewExpenseCategory() {
    if (app) app.addNewExpenseCategory();
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

function deleteExpenseCategory(categoryId) {
    if (app) app.deleteExpenseCategory(categoryId);
}

// Модальные окна редактирования расходов
function hideEditCategoryModal() {
    if (app) app.hideEditCategoryModal();
}

function saveCategoryChanges() {
    if (app) app.saveCategoryChanges();
}

function addNewSubcategory() {
    if (app) app.addNewSubcategory();
}

function editSubcategory(subcategoryId) {
    if (app) app.editSubcategory(subcategoryId);
}

function hideEditSubcategoryModal() {
    if (app) app.hideEditSubcategoryModal();
}

function saveSubcategoryChanges() {
    if (app) app.saveSubcategoryChanges();
}

function deleteSubcategory(subcategoryId) {
    if (app) app.deleteSubcategory(subcategoryId);
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

function saveIncomeCategoryChanges() {
    if (app) app.saveIncomeCategoryChanges();
}

function addNewIncomeSubcategory() {
    if (app) app.addNewIncomeSubcategory();
}

function editIncomeSubcategory(subcategoryId) {
    if (app) app.editIncomeSubcategory(subcategoryId);
}

function hideEditIncomeSubcategoryModal() {
    if (app) app.hideEditIncomeSubcategoryModal();
}

function saveIncomeSubcategoryChanges() {
    if (app) app.saveIncomeSubcategoryChanges();
}

function deleteIncomeSubcategory(subcategoryId) {
    if (app) app.deleteIncomeSubcategory(subcategoryId);
}

// Операции
function editExpenseOperation(id) {
    if (app) app.editExpenseOperation(id);
}

function deleteExpenseOperation(id) {
    if (app) app.deleteExpenseOperation(id);
}

function editIncomeOperation(id) {
    if (app) app.editIncomeOperation(id);
}

function deleteIncomeOperation(id) {
    if (app) app.deleteIncomeOperation(id);
}

function editDebtOperation(id) {
    if (app) app.editDebtOperation(id);
}

function deleteDebtOperation(id) {
    if (app) app.deleteDebtOperation(id);
}

function editDebtPayment(debtId, paymentIndex) {
    if (app) app.editDebtPayment(debtId, paymentIndex);
}

function deleteDebtPayment(debtId, paymentIndex) {
    if (app) app.deleteDebtPayment(debtId, paymentIndex);
}

// Настройки
function showSettingsModal() {
    if (app) app.showSettingsModal();
}

// Резервная инициализация
window.addEventListener('load', function() {
    console.log("Budget App: Window loaded");
    if (!app) {
        console.log("Budget App: Emergency initialization");
        app = new BudgetApp();
        app.init();
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