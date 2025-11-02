// Глобальные переменные
let app = null;
let initializationInProgress = false;
let appState = {
    isInitialized: false,
    lastError: null,
    retryCount: 0
};

// Основная инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Starting Budget App...");
    
    if (initializationInProgress) {
        console.log("⏳ Initialization already in progress, skipping...");
        return;
    }
    
    initializationInProgress = true;
    
    try {
        await initializeApplication();
        console.log("🎉 Budget App started successfully!");
    } catch (error) {
        console.error("💥 Failed to start Budget App:", error);
        handleFatalError(error);
    } finally {
        initializationInProgress = false;
    }
});

// Инициализация приложения
async function initializeApplication() {
    showLoadingState();
    
    try {
        // Создаем экземпляр приложения
        app = new BudgetApp();
        
        // Инициализируем приложение
        await app.init();
        
        // Настраиваем глобальные обработчики
        setupGlobalHandlers();
        
        // Обновляем состояние
        appState.isInitialized = true;
        appState.lastError = null;
        appState.retryCount = 0;
        
        hideLoadingState();
        
    } catch (error) {
        appState.lastError = error;
        throw error;
    }
}

// Показать состояние загрузки
function showLoadingState() {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    appContainer.innerHTML = `
        <div class="loading-screen">
            <div class="loading-spinner"></div>
            <div class="loading-text">Загрузка Budget Pro...</div>
            <div class="loading-subtext">Инициализация приложения</div>
        </div>
    `;
    
    // Добавляем стили для экрана загрузки
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-screen {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 60vh;
                text-align: center;
            }
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007AFF;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            .loading-text {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
                color: #000;
            }
            .loading-subtext {
                font-size: 14px;
                color: #8E8E93;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Скрыть состояние загрузки
function hideLoadingState() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.remove();
    }
}

// Настройка глобальных обработчиков
function setupGlobalHandlers() {
    setupErrorHandling();
    setupNavigationHandlers();
    setupModalHandlers();
    setupBeforeUnloadHandler();
    setupOrientationHandlers();
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
}

// Обработчик глобальных ошибок
function handleGlobalError(event) {
    console.error('💥 Global error:', event.error);
    
    if (!appState.isInitialized) {
        handleFatalError(event.error);
    } else {
        ToastService.error('Произошла непредвиденная ошибка');
    }
}

// Обработчик rejected promises
function handlePromiseRejection(event) {
    console.error('💥 Unhandled promise rejection:', event.reason);
    event.preventDefault();
    
    if (!appState.isInitialized) {
        handleFatalError(event.reason);
    }
}

// Обработчик фатальных ошибок
function handleFatalError(error) {
    console.error('💀 Fatal error:', error);
    
    hideLoadingState();
    showErrorScreen(error);
}

// Показать экран ошибки
function showErrorScreen(error) {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    const errorDetails = getErrorDetails(error);
    
    appContainer.innerHTML = `
        <div class="error-screen">
            <div class="error-icon">💥</div>
            <h1>${errorDetails.title}</h1>
            <p>${errorDetails.message}</p>
            <div class="error-details" style="display: none;">
                <small>Техническая информация: ${error?.message || 'Неизвестная ошибка'}</small>
            </div>
            <div class="error-actions">
                <button onclick="handleRetryInitialization()" class="btn-primary">
                    🔄 Попробовать снова
                </button>
                <button onclick="handleEmergencyReset()" class="btn-secondary">
                    🗑️ Сбросить данные
                </button>
                <button onclick="location.reload()" class="btn-tertiary">
                    🔃 Обновить страницу
                </button>
            </div>
            <button onclick="toggleErrorDetails()" class="btn-link">
                📋 Показать технические детали
            </button>
        </div>
    `;
    
    addErrorScreenStyles();
}

// Получить детали ошибки
function getErrorDetails(error) {
    if (error?.message?.includes('IndexedDB')) {
        return {
            title: 'Ошибка базы данных',
            message: 'Не удалось загрузить данные приложения. Это может быть вызвано проблемами с хранилищем браузера.'
        };
    }
    
    if (error?.message?.includes('сеть') || error?.message?.includes('network')) {
        return {
            title: 'Проблемы с подключением',
            message: 'Проверьте подключение к интернету и попробуйте снова.'
        };
    }
    
    return {
        title: 'Ошибка приложения',
        message: 'Произошла непредвиденная ошибка при загрузке приложения.'
    };
}

// Добавить стили для экрана ошибки
function addErrorScreenStyles() {
    if (!document.querySelector('#error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-screen {
                text-align: center;
                padding: 40px 20px;
                max-width: 400px;
                margin: 0 auto;
            }
            .error-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            .error-screen h1 {
                color: #FF3B30;
                margin-bottom: 16px;
                font-size: 24px;
            }
            .error-screen p {
                color: #8E8E93;
                margin-bottom: 30px;
                line-height: 1.4;
            }
            .error-details {
                background: #f5f5f5;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: left;
            }
            .error-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }
            .btn-primary, .btn-secondary, .btn-tertiary {
                padding: 16px 24px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-primary {
                background: #007AFF;
                color: white;
            }
            .btn-secondary {
                background: #FF3B30;
                color: white;
            }
            .btn-tertiary {
                background: #8E8E93;
                color: white;
            }
            .btn-link {
                background: none;
                border: none;
                color: #007AFF;
                font-size: 14px;
                cursor: pointer;
                text-decoration: underline;
            }
            .btn-primary:active, .btn-secondary:active, .btn-tertiary:active {
                transform: scale(0.98);
            }
        `;
        document.head.appendChild(style);
    }
}

// Настройка обработчиков навигации
function setupNavigationHandlers() {
    // Обработчики для нижней навигации
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigationClick);
        item.addEventListener('touchstart', handleNavigationTouch);
    });
    
    // Обработчик для кнопки "Назад" в браузере
    window.addEventListener('popstate', handleBrowserBack);
}

// Обработчик клика по навигации
function handleNavigationClick(event) {
    if (!appState.isInitialized) return;
    
    const navItem = event.currentTarget;
    const screenName = getScreenNameFromNavItem(navItem);
    
    if (screenName) {
        event.preventDefault();
        switchScreen(screenName);
    }
}

// Обработчик касания по навигации (для мобильных устройств)
function handleNavigationTouch(event) {
    const navItem = event.currentTarget;
    navItem.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        navItem.style.transform = 'scale(1)';
    }, 150);
}

// Обработчик кнопки "Назад" в браузере
function handleBrowserBack(event) {
    if (!appState.isInitialized) return;
    
    // Определяем текущий экран и переключаем на предыдущий
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen && currentScreen.id !== 'overview-screen') {
        switchScreen('overview');
        history.pushState(null, '', window.location.pathname);
    }
}

// Получить имя экрана из элемента навигации
function getScreenNameFromNavItem(navItem) {
    const onclick = navItem.getAttribute('onclick');
    const match = onclick?.match(/switchScreen\('(\w+)'\)/);
    return match ? match[1] : null;
}

// Настройка обработчиков модальных окон
function setupModalHandlers() {
    // Закрытие модальных окон по клику на фон
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Предотвращение закрытия при клике на контент
    document.addEventListener('click', (e) => {
        if (e.target.closest('.category-modal-content')) {
            e.stopPropagation();
        }
    });
}

// Обработчик beforeunload
function setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (event) => {
        if (appState.isInitialized && app) {
            // Сохраняем данные перед закрытием
            app.saveData().catch(console.error);
        }
    });
}

// Обработчики изменения ориентации
function setupOrientationHandlers() {
    window.addEventListener('resize', debounce(fixNavigationLayout, 250));
    window.addEventListener('orientationchange', () => {
        setTimeout(fixNavigationLayout, 300);
    });
}

// Фикс для навигации
function fixNavigationLayout() {
    const nav = document.querySelector('.bottom-nav');
    const appContainer = document.querySelector('.app-container');
    
    if (!nav || !appContainer) return;
    
    const navHeight = nav.offsetHeight;
    document.body.style.paddingBottom = navHeight + 'px';
    appContainer.style.paddingBottom = '20px';
    
    // Обновляем высоту экранов
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.minHeight = `calc(100vh - ${navHeight}px - 60px)`;
    });
}

// Дебаунс функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Глобальные функции приложения

// Навигация
function switchScreen(screenName) {
    if (!appState.isInitialized || !app) {
        showAppNotReadyWarning();
        return;
    }
    
    try {
        app.switchScreen(screenName);
    } catch (error) {
        console.error('Error switching screen:', error);
        ToastService.error('Ошибка переключения экрана');
    }
}

// Безопасные обертки для функций приложения
function createSafeAppFunction(operation, errorMessage) {
    return async function(...args) {
        if (!appState.isInitialized || !app) {
            showAppNotReadyWarning();
            return;
        }
        
        try {
            return await operation.call(app, ...args);
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            ToastService.error(errorMessage);
        }
    };
}

// Показать предупреждение о том, что приложение не готово
function showAppNotReadyWarning() {
    ToastService.warning('Приложение еще не загружено. Пожалуйста, подождите.');
}

// Глобальные функции для HTML

// Доходы
const addNewIncomeCategory = createSafeAppFunction(
    BudgetApp.prototype.addNewIncomeCategory,
    'Ошибка при добавлении категории доходов'
);

const addIncomeToCategory = createSafeAppFunction(
    BudgetApp.prototype.addIncomeToCategory,
    'Ошибка при добавлении дохода'
);

const addIncomeOperation = createSafeAppFunction(
    BudgetApp.prototype.addIncomeOperation,
    'Ошибка при добавлении операции дохода'
);

// Расходы
const addNewExpenseCategory = createSafeAppFunction(
    BudgetApp.prototype.addNewExpenseCategory,
    'Ошибка при добавлении категории расходов'
);

const addExpenseToCategory = createSafeAppFunction(
    BudgetApp.prototype.addExpenseToCategory,
    'Ошибка при добавлении расхода'
);

const addExpenseOperation = createSafeAppFunction(
    BudgetApp.prototype.addExpenseOperation,
    'Ошибка при добавлении операции расхода'
);

// Долги
const addNewCircle = createSafeAppFunction(
    BudgetApp.prototype.addNewCircle,
    'Ошибка при добавлении'
);

const makeDebtPayment = createSafeAppFunction(
    BudgetApp.prototype.makeDebtPayment,
    'Ошибка при оплате долга'
);

// Бюджет
const setCategoryBudget = createSafeAppFunction(
    BudgetApp.prototype.setCategoryBudget,
    'Ошибка при установке бюджета'
);

const editCategoryBudget = createSafeAppFunction(
    BudgetApp.prototype.editCategoryBudget,
    'Ошибка при редактировании бюджета'
);

// Цели
const showAddGoalModal = createSafeAppFunction(
    BudgetApp.prototype.showAddGoalModal,
    'Ошибка при открытии модалки целей'
);

const createNewGoal = createSafeAppFunction(
    BudgetApp.prototype.createNewGoal,
    'Ошибка при создании цели'
);

const addToGoal = createSafeAppFunction(
    BudgetApp.prototype.addToGoal,
    'Ошибка при добавлении средств в цель'
);

// Модальные окна
function hideAddGoalModal() {
    const modal = document.getElementById('add-goal-modal');
    if (modal) modal.classList.remove('active');
}

function showRecurringTransactionsModal() {
    if (app && appState.isInitialized) {
        app.showRecurringTransactionsModal();
    } else {
        showAppNotReadyWarning();
    }
}

function hideRecurringTransactionsModal() {
    const modal = document.getElementById('recurring-transactions-modal');
    if (modal) modal.classList.remove('active');
}

function showSettingsModal() {
    if (app && appState.isInitialized) {
        app.showSettingsModal();
    } else {
        showAppNotReadyWarning();
    }
}

function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
}

// Закрыть все модальные окна
function closeAllModals() {
    document.querySelectorAll('.category-modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Функции управления приложением

// Повторная инициализация
async function handleRetryInitialization() {
    if (initializationInProgress) return;
    
    appState.retryCount++;
    
    if (appState.retryCount > 3) {
        ToastService.error('Слишком много неудачных попыток. Попробуйте сбросить данные.');
        return;
    }
    
    ToastService.info(`Попытка инициализации ${appState.retryCount}...`);
    await initializeApplication();
}

// Экстренный сброс
async function handleEmergencyReset() {
    if (!confirm('ВНИМАНИЕ: Это удалит ВСЕ ваши данные без возможности восстановления. Продолжить?')) {
        return;
    }
    
    try {
        ToastService.info('Выполняется сброс данных...');
        
        if (!app) {
            app = new BudgetApp();
        }
        
        await app.resetToDefaults();
        ToastService.success('Данные сброшены успешно!');
        
        // Перезагружаем страницу
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Emergency reset failed:', error);
        ToastService.error('Сброс данных не удался');
    }
}

// Переключение технических деталей ошибки
function toggleErrorDetails() {
    const details = document.querySelector('.error-details');
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

// Полный сброс данных и перезагрузка
async function clearAllDataAndReload() {
    if (!confirm('Это действие удалит ВСЕ данные и перезагрузит приложение. Продолжить?')) {
        return;
    }
    
    try {
        // Пробуем использовать app если он есть
        if (app) {
            await app.resetToDefaults();
        } else {
            // Иначе создаем временный экземпляр хранилища
            const storage = new IndexedDBService();
            await storage.resetDatabase();
        }
        
        ToastService.success('Данные сброшены');
        location.reload();
        
    } catch (error) {
        console.error('Clear data failed:', error);
        ToastService.error('Не удалось сбросить данные');
    }
}

// Функции для отладки (только для разработки)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = function() {
        return {
            app: app,
            state: appState,
            storage: app?.storage
        };
    };
    
    window.forceError = function() {
        throw new Error('Тестовая ошибка');
    };
}

// Резервная инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    console.log('🌐 Page fully loaded');
    
    // Если приложение еще не инициализировано, пробуем снова
    if (!appState.isInitialized && !initializationInProgress) {
        console.log('🔄 Attempting backup initialization...');
        setTimeout(() => {
            initializeApplication().catch(console.error);
        }, 1000);
    }
    
    // Фиксим layout после полной загрузки
    setTimeout(fixNavigationLayout, 100);
});

// Service Worker регистрация (если нужно)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}