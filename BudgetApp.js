class BudgetApp {
    constructor() {
        this.storage = new IndexedDBService();
        this.incomes = new StructuredIncomesService(this.storage);
        this.debts = new DebtsService(this.storage);
        this.expenses = new ExpensesService(this.storage);
        this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
        this.reports = new ReportService(this.incomes, this.debts, this.expenses);
        
        // Дополнительные сервисы
        this.budgets = new BudgetService(this.expenses, this.storage);
        this.recurring = new RecurringTransactionsService(this.storage, this.expenses, this.incomes);
        this.savingsGoals = new SavingsGoalsService(this.storage);
        this.cache = new CacheService(50, 2 * 60 * 1000);
        
        // Настройки по умолчанию
        this.settings = { 
            currency: "₽",
            budgetAlerts: true,
            autoProcessRecurring: true
        };
        
        // Состояние приложения
        this.currentState = {
            editingCategoryId: null,
            editingSubcategory: null,
            selectedCategoryId: null,
            selectedIncomeCategoryId: null
        };
        
        this.uiUpdater = new DebouncedUpdater(150);
        this.initialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }

    async init() {
        console.log("💰 Budget App: Starting initialization...");
        this.initializationAttempts++;
        
        try {
            // Инициализация хранилища
            await this.initializeStorage();
            
            // Загрузка данных
            await this.loadApplicationData();
            
            // Обработка повторяющихся операций
            await this.processRecurringTransactions();
            
            // Инициализация UI
            this.initializeUI();
            
            this.initialized = true;
            this.initializationAttempts = 0;
            console.log("✅ Budget App: Initialized successfully");
            
        } catch (error) {
            await this.handleInitializationError(error);
        }
    }

    async initializeStorage() {
        console.log("📦 Initializing storage...");
        try {
            await this.storage.init();
            console.log("✅ Storage initialized successfully");
        } catch (error) {
            console.error("❌ Storage initialization failed:", error);
            throw new Error(`Ошибка инициализации хранилища: ${error.message}`);
        }
    }

    async loadApplicationData() {
        console.log("📊 Loading application data...");
        
        try {
            const data = await this.storage.getAllData();
            
            if (this.isValidData(data)) {
                await this.loadAllServices(data);
                this.applySettings(data.settings);
                console.log("✅ Application data loaded successfully");
            } else {
                console.log("⚠️ No valid data found, initializing with defaults");
                await this.initializeWithDefaults();
            }
            
        } catch (error) {
            console.error("❌ Error loading application data:", error);
            await this.initializeWithDefaults();
        }
    }

    isValidData(data) {
        return data && 
               typeof data === 'object' && 
               Object.keys(data).length > 0 &&
               data.settings;
    }

    async loadAllServices(data) {
        const loadPromises = [
            this.expenses.load(data),
            this.incomes.load(data),
            this.debts.load(data),
            this.budgets.load(data),
            this.recurring.load(data),
            this.savingsGoals.load(data)
        ];
        
        await Promise.all(loadPromises);
    }

    applySettings(settings) {
        if (settings) {
            this.settings = { ...this.settings, ...settings };
        }
    }

    async initializeWithDefaults() {
        console.log("🔄 Initializing with default data...");
        
        const defaultData = {
            expenses: { categories: [], operations: [] },
            incomes: { categories: [], operations: [] },
            debts: [],
            settings: this.settings
        };
        
        await this.loadAllServices(defaultData);
        console.log("✅ Default data initialized");
    }

    async processRecurringTransactions() {
        if (!this.settings.autoProcessRecurring) return;
        
        try {
            const processed = await this.recurring.processRecurringTransactions();
            if (processed.length > 0) {
                console.log(`🔄 Created ${processed.length} recurring transactions`);
                ToastService.success(`Создано ${processed.length} повторяющихся операций`);
            }
        } catch (error) {
            console.error("❌ Error processing recurring transactions:", error);
        }
    }

    initializeUI() {
        this.updateUI();
        this.startClock();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчики для модальных окон
        this.setupModalEventListeners();
        // Обработчики для навигации
        this.setupNavigationEventListeners();
    }

    setupModalEventListeners() {
        // Закрытие модальных окон по клику на фон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-modal')) {
                e.target.classList.remove('active');
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupNavigationEventListeners() {
        // Обработчики для навигационных кнопок
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const screenName = e.currentTarget.getAttribute('onclick')?.match(/switchScreen\('(\w+)'\)/)?.[1];
                if (screenName) {
                    this.switchScreen(screenName);
                }
            });
        });
    }

    closeAllModals() {
        document.querySelectorAll('.category-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async handleInitializationError(error) {
        console.error("❌ Budget App: Initialization error:", error);
        
        if (this.initializationAttempts < this.maxInitializationAttempts) {
            console.log(`🔄 Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxInitializationAttempts})...`);
            await this.delay(1000 * this.initializationAttempts);
            return await this.init();
        }
        
        console.error("💥 Max initialization attempts reached");
        ToastService.error("Ошибка инициализации приложения");
        
        try {
            await this.performEmergencyRecovery();
        } catch (recoveryError) {
            console.error("💥 Emergency recovery failed:", recoveryError);
            this.showFatalErrorScreen();
        }
    }

    async performEmergencyRecovery() {
        console.log("🚨 Performing emergency recovery...");
        ToastService.info("Выполняется восстановление...");
        
        try {
            // Пробуем сбросить базу данных
            await this.storage.resetDatabase();
            
            // Пересоздаем сервисы
            this.recreateServices();
            
            // Повторная инициализация
            await this.storage.init();
            await this.initializeWithDefaults();
            
            this.initialized = true;
            this.initializationAttempts = 0;
            
            this.updateUI();
            ToastService.success("Восстановление выполнено успешно!");
            
        } catch (error) {
            throw new Error(`Emergency recovery failed: ${error.message}`);
        }
    }

    recreateServices() {
        this.incomes = new StructuredIncomesService(this.storage);
        this.debts = new DebtsService(this.storage);
        this.expenses = new ExpensesService(this.storage);
        this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
        this.reports = new ReportService(this.incomes, this.debts, this.expenses);
        this.budgets = new BudgetService(this.expenses, this.storage);
        this.recurring = new RecurringTransactionsService(this.storage, this.expenses, this.incomes);
        this.savingsGoals = new SavingsGoalsService(this.storage);
    }

    showFatalErrorScreen() {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;
        
        appContainer.innerHTML = `
            <div class="error-screen">
                <div class="error-icon">💥</div>
                <h1>Критическая ошибка</h1>
                <p>Приложение не может быть загружено.</p>
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn-primary">Обновить страницу</button>
                    <button onclick="clearAllDataAndReload()" class="btn-secondary">Сбросить все данные</button>
                </div>
            </div>
        `;
        
        // Добавляем стили
        const style = document.createElement('style');
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
            }
            .error-screen p {
                color: #8E8E93;
                margin-bottom: 30px;
            }
            .error-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .btn-primary, .btn-secondary {
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
            .btn-primary:active, .btn-secondary:active {
                transform: scale(0.98);
            }
        `;
        document.head.appendChild(style);
    }

    // Основные методы работы с данными
    async saveData() {
        if (!this.initialized) {
            console.warn("⚠️ Cannot save data: app not initialized");
            return;
        }
        
        try {
            await this.storage.saveSettings(this.settings);
            
            const savePromises = [
                this.saveExpensesData(),
                this.saveIncomesData(),
                this.saveDebtsData(),
                this.saveBudgetsData(),
                this.saveRecurringData(),
                this.saveSavingsGoalsData()
            ];
            
            await Promise.allSettled(savePromises);
            this.cache.clear();
            
            console.log("💾 Data saved successfully");
        } catch (error) {
            console.error("❌ Error saving data:", error);
            ToastService.error("Ошибка сохранения данных");
        }
    }

    async saveExpensesData() {
        const categories = this.expenses.getCategories();
        const operations = this.expenses.getOperations();
        
        for (const category of categories) {
            await this.storage.put('expenseCategories', category);
        }
        for (const operation of operations) {
            await this.storage.put('expenseOperations', operation);
        }
    }

    async saveIncomesData() {
        const categories = this.incomes.getCategories();
        const operations = this.incomes.getOperations();
        
        for (const category of categories) {
            await this.storage.put('incomeCategories', category);
        }
        for (const operation of operations) {
            await this.storage.put('incomes', operation);
        }
    }

    async saveDebtsData() {
        const debts = this.debts.getAll();
        for (const debt of debts) {
            await this.storage.put('debts', debt);
        }
    }

    async saveBudgetsData() {
        const budgets = this.budgets.getAllBudgets();
        for (const budget of budgets) {
            await this.storage.put('budgets', budget);
        }
    }

    async saveRecurringData() {
        const recurring = this.recurring.getRecurringTransactions();
        for (const transaction of recurring) {
            await this.storage.put('recurringTransactions', transaction);
        }
    }

    async saveSavingsGoalsData() {
        const goals = this.savingsGoals.getGoals();
        for (const goal of goals) {
            await this.storage.put('savingsGoals', goal);
        }
    }

    async resetToDefaults() {
        console.log("🔄 Resetting to defaults...");
        
        try {
            ToastService.info("Сброс данных...");
            
            const success = await this.storage.clearAllData();
            if (!success) {
                throw new Error('Storage clear operation failed');
            }
            
            this.recreateServices();
            this.settings = { 
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };
            
            await this.loadApplicationData();
            this.initializationAttempts = 0;
            
            ToastService.success("Данные сброшены к начальным настройкам");
            console.log("✅ Reset to defaults completed");
            
        } catch (error) {
            console.error("❌ Error resetting to defaults:", error);
            ToastService.error("Ошибка сброса данных");
            
            try {
                await this.performEmergencyRecovery();
            } catch (recoveryError) {
                console.error("💥 Emergency recovery during reset failed:", recoveryError);
            }
        }
    }

    // UI методы
    updateUI() {
        this.uiUpdater.scheduleUpdate(() => {
            this.updateFinancialOverview();
            this.updateCategories();
            this.updateOperationsList();
            this.updateSavingsGoals();
            this.checkAndShowAlerts();
        });
    }

    updateFinancialOverview() {
        this.updateBalance();
        this.updateReport();
    }

    updateBalance() {
        const totalIncome = this.incomes.getTotal();
        const totalExpenses = this.expenses.getTotalExpenses();
        const totalPaidDebts = this.debts.getTotalPaid();
        const balance = totalIncome - totalExpenses - totalPaidDebts;
        
        const balanceElement = document.getElementById('balance-amount');
        if (balanceElement) {
            balanceElement.textContent = `${this.settings.currency}${balance.toFixed(2)}`;
        }
        
        const incomeStat = document.querySelector('.stat-income');
        const expenseStat = document.querySelector('.stat-expense');
        if (incomeStat) incomeStat.textContent = `Доходы: ${this.settings.currency}${totalIncome.toFixed(2)}`;
        if (expenseStat) expenseStat.textContent = `Расходы: ${this.settings.currency}${totalExpenses.toFixed(2)}`;
    }

    updateReport() {
        const report = this.reports.generateReport();
        
        const elements = {
            'report-income': report.totalIncome,
            'report-expense': report.totalExpenses,
            'report-debt': report.totalPaidDebts,
            'report-balance': report.balance
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `${this.settings.currency}${value.toFixed(2)}`;
            }
        }
    }

    updateCategories() {
        this.updateExpenseCategories();
        this.updateIncomeCategories();
        this.updateDebtCategories();
    }

    updateExpenseCategories() {
        const container = document.getElementById('expense-circles');
        if (!container) return;
        
        const categories = this.expenses.getCategories();
        container.innerHTML = categories.length > 0 
            ? this.renderExpenseCategories(categories)
            : '<div class="empty-state">Нажми + чтобы добавить</div>';
    }

    renderExpenseCategories(categories) {
        return categories.map(category => {
            const totalAmount = this.expenses.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '🛒';
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            
            const budgetStatus = this.budgets.getBudgetStatus(category.id);
            const remaining = this.budgets.getRemainingBudget(category.id);
            const usagePercent = this.budgets.getBudgetUsagePercent(category.id);
            const hasBudget = this.budgets.getCategoryBudget(category.id);
            
            return `
                <div class="circle-item circle-expense budget-${budgetStatus}" onclick="addExpenseToCategory(${category.id})">
                    <div class="circle-actions">
                        ${hasBudget ? 
                            `<button class="circle-action-btn circle-budget" onclick="event.stopPropagation(); editCategoryBudget(${category.id})">📊</button>` :
                            `<button class="circle-action-btn circle-budget-add" onclick="event.stopPropagation(); setCategoryBudget(${category.id})">💸</button>`
                        }
                        ${category.id > 12 ? 
                            `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>` :
                            ''
                        }
                    </div>
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${totalAmount}</div>` : ''}
                    <div class="circle-label">${category.name} ${hasSubcategories ? '📁' : ''}</div>
                    
                    ${hasBudget ? `
                        <div class="budget-progress">
                            <div class="budget-progress-bar" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        </div>
                        <div class="budget-remaining">
                            ${this.settings.currency}${remaining}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateIncomeCategories() {
        const container = document.getElementById('income-circles');
        if (!container) return;
        
        const categories = this.incomes.getCategories();
        container.innerHTML = categories.length > 0 
            ? this.renderIncomeCategories(categories)
            : '<div class="empty-state">Нажми + чтобы добавить</div>';
    }

    renderIncomeCategories(categories) {
        return categories.map(category => {
            const totalAmount = this.incomes.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '💰';
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            
            return `
                <div class="circle-item circle-income" onclick="addIncomeToCategory(${category.id})">
                    <div class="circle-actions">
                        ${category.id > 2 ? 
                            `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${category.id})">×</button>` :
                            ''
                        }
                    </div>
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${totalAmount}</div>` : ''}
                    <div class="circle-label">${category.name} ${hasSubcategories ? '📁' : ''}</div>
                </div>
            `;
        }).join('');
    }

    updateDebtCategories() {
        const container = document.getElementById('debt-circles');
        if (!container) return;
        
        const debts = this.debts.getAll();
        container.innerHTML = debts.length > 0 
            ? this.renderDebtCategories(debts)
            : '<div class="empty-state">Нажми + чтобы добавить</div>';
    }

    renderDebtCategories(debts) {
        return debts.map(debt => {
            const remaining = debt.amount - (debt.paidAmount || 0);
            const isPaid = remaining <= 0;
            const icon = debt.icon || '💳';
            
            return `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" onclick="makeDebtPayment(${debt.id})">
                    <div class="circle-actions">
                        ${!isPaid ? 
                            `<button class="circle-action-btn circle-check" onclick="event.stopPropagation(); makeDebtPayment(${debt.id})">✓</button>` :
                            ''
                        }
                        <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteDebtOperation(${debt.id})">×</button>
                    </div>
                    <div class="circle-icon">${icon}</div>
                    <div class="circle-amount">${this.settings.currency}${remaining}</div>
                    <div class="circle-label">${debt.description}</div>
                    ${!isPaid ? `
                        <div class="debt-progress">
                            <div class="debt-progress-bar" style="width: ${((debt.paidAmount || 0) / debt.amount) * 100}%"></div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) return;
        
        const operations = this.operations.getAllOperations();
        container.innerHTML = operations.length > 0 
            ? this.createOperationsHTML(operations)
            : this.createEmptyOperationsState();
    }

    createEmptyOperationsState() {
        return `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                <div>Нет операций</div>
                <div style="font-size: 12px; margin-top: 10px; color: #8E8E93;">
                    Добавьте доходы, расходы или долги чтобы увидеть их здесь
                </div>
            </div>
        `;
    }

    createOperationsHTML(operations) {
        const groupedOperations = this.groupOperationsByType(operations);
        let html = '';
        
        for (const [type, items] of Object.entries(groupedOperations)) {
            if (items.length > 0) {
                html += this.createOperationGroup(type, items);
            }
        }
        
        return html;
    }

    groupOperationsByType(operations) {
        return {
            income: operations.filter(op => op.type === 'income'),
            expense: operations.filter(op => op.type === 'expense'),
            debt: operations.filter(op => op.type === 'debt' || op.type === 'debt-payment')
        };
    }

    createOperationGroup(type, operations) {
        const typeConfig = {
            income: { title: '📈 Доходы', icon: '💰', color: '#34C759' },
            expense: { title: '📉 Расходы', icon: '🛒', color: '#FF3B30' },
            debt: { title: '💳 Долги', icon: '💳', color: '#FF9500' }
        };
        
        const config = typeConfig[type] || typeConfig.expense;
        
        return `
            <div class="operations-group">
                <div class="operations-group-title">
                    ${config.title} (${operations.length})
                </div>
                ${operations.map(operation => this.createOperationHTML(operation)).join('')}
            </div>
        `;
    }

    createOperationHTML(operation) {
        const config = this.getOperationConfig(operation.type);
        const displayAmount = Math.abs(operation.amount || operation.displayAmount || 0);
        
        return `
            <div class="operation-item">
                <div class="operation-main-content">
                    <div class="operation-info">
                        <div class="operation-icon" style="background: ${config.color}">
                            ${operation.icon || config.icon}
                        </div>
                        <div class="operation-details">
                            <div class="operation-title">${operation.description || 'Без названия'}</div>
                            <div class="operation-meta">
                                <span>${this.formatDate(operation.date)}</span>
                                <span class="operation-time">${this.formatTime(operation.date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="operation-amount ${operation.type}">
                        ${config.sign}${this.settings.currency}${displayAmount.toFixed(2)}
                    </div>
                </div>
                ${operation.isEditable !== false ? this.createOperationActions(operation) : ''}
            </div>
        `;
    }

    getOperationConfig(type) {
        const configs = {
            income: { icon: '💰', color: '#34C759', sign: '+' },
            expense: { icon: '🛒', color: '#FF3B30', sign: '-' },
            debt: { icon: '💳', color: '#FF9500', sign: '-' },
            'debt-payment': { icon: '✅', color: '#34C759', sign: '+' }
        };
        return configs[type] || configs.expense;
    }

    createOperationActions(operation) {
        return `
            <div class="operation-actions">
                <button class="operation-action-btn operation-edit" 
                        onclick="event.stopPropagation(); ${this.getEditFunctionName(operation)}">
                    ✏️
                </button>
                <button class="operation-action-btn operation-delete" 
                        onclick="event.stopPropagation(); ${this.getDeleteFunctionName(operation)}">
                    ×
                </button>
            </div>
        `;
    }

    getEditFunctionName(operation) {
        const functions = {
            'income': `editIncomeOperation(${operation.id})`,
            'expense': `editExpenseOperation(${operation.id})`,
            'debt': `editDebtOperation(${operation.id})`,
            'debt-payment': `editDebtPayment(${operation.debtId}, ${operation.paymentIndex})`
        };
        return functions[operation.type] || functions.expense;
    }

    getDeleteFunctionName(operation) {
        const functions = {
            'income': `deleteIncomeOperation(${operation.id})`,
            'expense': `deleteExpenseOperation(${operation.id})`,
            'debt': `deleteDebtOperation(${operation.id})`,
            'debt-payment': `deleteDebtPayment(${operation.debtId}, ${operation.paymentIndex})`
        };
        return functions[operation.type] || functions.expense;
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        if (!container) return;
        
        const goals = this.savingsGoals.getGoals();
        container.innerHTML = goals.length > 0 
            ? this.renderSavingsGoals(goals)
            : this.createEmptySavingsGoalsState();
    }

    createEmptySavingsGoalsState() {
        return `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
                <div>Нет целей накоплений</div>
                <div style="font-size: 12px; margin-top: 10px; color: #8E8E93;">
                    Добавьте цель чтобы отслеживать прогресс
                </div>
            </div>
        `;
    }

    renderSavingsGoals(goals) {
        return goals.map(goal => {
            const progress = this.savingsGoals.getGoalProgress(goal.id);
            const daysRemaining = this.savingsGoals.getDaysRemaining(goal.id);
            const monthlySave = this.savingsGoals.getRecommendedMonthlySave(goal.id);
            const timeToGoal = this.savingsGoals.getTimeToGoal(goal.id);
            
            return `
                <div class="savings-goal-card ${goal.isCompleted ? 'completed' : ''}">
                    <div class="goal-header">
                        <div class="goal-icon">${goal.icon}</div>
                        <div class="goal-info">
                            <div class="goal-name">${goal.name}</div>
                            <div class="goal-amount">
                                ${this.settings.currency}${goal.currentAmount.toFixed(2)} / 
                                ${this.settings.currency}${goal.targetAmount.toFixed(2)}
                            </div>
                        </div>
                        <div class="goal-progress">${Math.round(progress)}%</div>
                    </div>
                    
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progress}%; background: ${goal.color}"></div>
                    </div>
                    
                    ${!goal.isCompleted ? this.renderActiveGoalDetails(goal, daysRemaining, monthlySave, timeToGoal) : this.renderCompletedGoal(goal)}
                </div>
            `;
        }).join('');
    }

    renderActiveGoalDetails(goal, daysRemaining, monthlySave, timeToGoal) {
        return `
            <div class="goal-details">
                <div class="goal-deadline">
                    ${daysRemaining > 0 ? `⏱️ ${daysRemaining} дней` : '⌛ Срок истек'}
                </div>
                ${monthlySave ? `
                    <div class="goal-monthly">
                        💰 ${this.settings.currency}${monthlySave.toFixed(2)}/мес
                    </div>
                ` : ''}
            </div>
            
            <div class="goal-actions">
                <button class="add-to-goal-btn" 
                        onclick="addToGoal(${goal.id})"
                        style="background: ${goal.color}">
                    + Добавить
                </button>
                ${timeToGoal ? `
                    <div class="goal-time">
                        ~${timeToGoal} мес
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderCompletedGoal(goal) {
        return `
            <div class="goal-completed">
                🎉 Цель достигнута! 
                <span class="goal-completed-date">${this.formatDate(goal.completedAt)}</span>
            </div>
        `;
    }

    // Методы для работы с операциями
    async addIncomeToCategory(categoryId, subcategoryId = null) {
        try {
            const category = this.incomes.getCategory(categoryId);
            if (!category) {
                throw new Error("Категория не найдена");
            }
            
            const { amount, description } = await this.promptForOperationDetails(category.name, 'дохода');
            if (!amount) return;
            
            await this.incomes.addOperation({
                categoryId: category.id,
                subcategoryId: subcategoryId,
                amount: amount,
                description: description || `${category.name}${subcategoryId ? ` - ${this.getSubcategoryName(category, subcategoryId)}` : ''}`,
                icon: category.icon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            this.handleOperationError(error, "добавлении дохода");
        }
    }

    async addExpenseToCategory(categoryId, subcategoryId = null) {
        try {
            const category = this.expenses.getCategory(categoryId);
            if (!category) {
                throw new Error("Категория не найдена");
            }
            
            const { amount, description } = await this.promptForOperationDetails(category.name, 'расхода');
            if (!amount) return;
            
            await this.expenses.addOperation({
                categoryId: category.id,
                subcategoryId: subcategoryId,
                amount: amount,
                description: description || `${category.name}${subcategoryId ? ` - ${this.getSubcategoryName(category, subcategoryId)}` : ''}`,
                icon: category.icon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            this.handleOperationError(error, "добавлении расхода");
        }
    }

    async promptForOperationDetails(categoryName, type) {
        const amountStr = prompt(`Введите сумму ${type} для "${categoryName}":`, "0");
        if (amountStr === null) return { amount: null };
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            throw new Error("Введите корректную сумму (больше 0)");
        }
        
        const description = prompt('Введите описание:', `${type === 'дохода' ? 'Доход' : 'Расход'}: ${categoryName}`) || 
                           `${type === 'дохода' ? 'Доход' : 'Расход'}: ${categoryName}`;
        
        return { amount, description };
    }

    getSubcategoryName(category, subcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === subcategoryId);
        return subcategory?.name || '';
    }

    handleOperationError(error, operation) {
        console.error(`Error in ${operation}:`, error);
        const message = error.message.includes('не найдена') ? error.message : `Ошибка при ${operation}`;
        ToastService.error(message);
    }

    // Вспомогательные методы
    checkAndShowAlerts() {
        if (!this.settings.budgetAlerts) return;
        
        const budgetAlerts = this.budgets.checkBudgetAlerts();
        budgetAlerts.forEach(alert => {
            if (alert.type === 'budget_warning') {
                ToastService.warning(alert.message, 5000);
            } else if (alert.type === 'budget_exceeded') {
                ToastService.error(alert.message, 6000);
            }
        });
    }

    startClock() {
        const updateTime = () => {
            try {
                const now = new Date();
                this.updateTimeElement('current-time', 
                    now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0'));
                
                this.updateTimeElement('current-date',
                    now.getDate().toString().padStart(2, '0') + '.' + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                    now.getFullYear());
            } catch (e) {
                console.error("Error updating time:", e);
            }
        };
        
        updateTime();
        setInterval(updateTime, 60000);
    }

    updateTimeElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return '--.--.----';
        }
    }

    formatTime(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Навигация
    switchScreen(screenName) {
        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('onclick')?.includes(screenName)) {
                item.classList.add('active');
            }
        });
        
        // Показываем нужный экран
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Обновляем контент экрана
        this.updateScreenContent(screenName);
    }

    updateScreenContent(screenName) {
        switch (screenName) {
            case 'operations':
                this.updateOperationsList();
                break;
            case 'report':
                this.updateReport();
                break;
            case 'goals':
                this.updateSavingsGoals();
                break;
        }
    }
}

// Вспомогательный класс для debounce
class DebouncedUpdater {
    constructor(delay = 100) {
        this.delay = delay;
        this.timeoutId = null;
    }
    
    scheduleUpdate(updateFunction) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        this.timeoutId = setTimeout(() => {
            updateFunction();
            this.timeoutId = null;
        }, this.delay);
    }
}