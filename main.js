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

// Настройки
async function showSettingsModal() {
    if (app) await app.showSettingsModal();
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