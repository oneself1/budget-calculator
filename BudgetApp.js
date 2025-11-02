class BudgetApp {
    constructor() {
        this.storage = new IndexedDBService();
        this.incomes = new StructuredIncomesService(this.storage);
        this.debts = new DebtsService(this.storage);
        this.expenses = new ExpensesService(this.storage);
        this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
        this.reports = new ReportService(this.incomes, this.debts, this.expenses);
        
        // Новые сервисы
        this.budgets = new BudgetService(this.expenses, this.storage);
        this.recurring = new RecurringTransactionsService(this.storage, this.expenses, this.incomes);
        this.savingsGoals = new SavingsGoalsService(this.storage);
        this.cache = new CacheService(50, 2 * 60 * 1000);
        
        this.settings = { 
            currency: "₽",
            budgetAlerts: true,
            autoProcessRecurring: true
        };
        
        this.currentState = {
            editingCategoryId: null,
            editingSubcategory: null,
            selectedCategoryId: null,
            selectedIncomeCategoryId: null
        };
        
        this.uiUpdater = new DebouncedUpdater(150);
        this.initialized = false;
    }

    async init() {
        console.log("Budget App: Initializing...");
        try {
            await this.storage.init();
            await this.loadData();
            
            // Обрабатываем повторяющиеся операции при запуске
            if (this.settings.autoProcessRecurring) {
                try {
                    const processed = await this.recurring.processRecurringTransactions();
                    if (processed.length > 0) {
                        ToastService.success(`Создано ${processed.length} повторяющихся операций`);
                    }
                } catch (error) {
                    console.error("Error processing recurring transactions:", error);
                }
            }
            
            this.updateUI();
            this.startClock();
            
            this.initialized = true;
            console.log("Budget App: Initialized successfully");
        } catch (error) {
            console.error("Budget App: Initialization error:", error);
            ToastService.error("Ошибка инициализации приложения");
            await this.resetToDefaults();
        }
    }

    async loadData() {
        try {
            const data = await this.storage.getAllData();
            console.log("Loaded data from storage:", data);
            
            if (data && Object.keys(data).length > 0) {
                // Загружаем данные в правильном порядке
                await this.expenses.load(data);
                await this.incomes.load(data);
                await this.debts.load(data);
                
                // Загружаем дополнительные сервисы если есть данные
                if (data.budgets) await this.budgets.load(data);
                if (data.recurringTransactions) await this.recurring.load(data);
                if (data.savingsGoals) await this.savingsGoals.load(data);
                
                // Настройки
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                }
                
                console.log("Data loaded successfully");
            } else {
                console.log("No data found, initializing with defaults");
                await this.initializeWithDefaults();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            await this.initializeWithDefaults();
        }
    }

    async initializeWithDefaults() {
        try {
            // Инициализируем сервисы с пустыми данными
            await this.expenses.load({});
            await this.incomes.load({});
            await this.debts.load({});
            await this.budgets.load({});
            await this.recurring.load({});
            await this.savingsGoals.load({});
            
            console.log("Initialized with default data");
        } catch (error) {
            console.error('Error initializing defaults:', error);
        }
    }

    async saveData() {
        if (!this.initialized) return;
        
        try {
            await this.storage.saveSettings(this.settings);
            
            // Сохраняем данные каждого сервиса
            const savePromises = [
                this.saveExpensesData(),
                this.saveIncomesData(),
                this.saveDebtsData()
            ];
            
            await Promise.all(savePromises);
            this.cache.clear();
            
            console.log("Data saved successfully");
        } catch (error) {
            console.error('Error saving data:', error);
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

    async resetToDefaults() {
        try {
            await this.storage.clearAllData();
            
            // Пересоздаем сервисы
            this.incomes = new StructuredIncomesService(this.storage);
            this.debts = new DebtsService(this.storage);
            this.expenses = new ExpensesService(this.storage);
            this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
            this.reports = new ReportService(this.incomes, this.debts, this.expenses);
            this.budgets = new BudgetService(this.expenses, this.storage);
            this.recurring = new RecurringTransactionsService(this.storage, this.expenses, this.incomes);
            this.savingsGoals = new SavingsGoalsService(this.storage);
            
            this.settings = { 
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };
            
            await this.loadData();
            ToastService.success("Данные сброшены к начальным настройкам");
        } catch (error) {
            console.error('Error resetting to defaults:', error);
            ToastService.error("Ошибка сброса данных");
        }
    }

    // UI методы
    updateUI() {
        this.uiUpdater.scheduleUpdate(() => {
            this.updateCircles();
            this.updateBalance();
            this.updateReport();
            this.updateOperationsList();
            this.updateSavingsGoals();
            this.checkAndShowAlerts();
        });
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) {
            console.log("Operations container not found");
            return;
        }
        
        const operations = this.operations.getAllOperations();
        console.log("Found operations:", operations);
        
        if (operations.length === 0) {
            container.innerHTML = this.createEmptyOperationsState();
            return;
        }
        
        container.innerHTML = this.createOperationsHTML(operations);
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
        const incomeOperations = operations.filter(op => op.type === 'income');
        const expenseOperations = operations.filter(op => op.type === 'expense');
        const debtOperations = operations.filter(op => op.type === 'debt' || op.type === 'debt-payment');
        
        let operationsHTML = '';
        
        if (incomeOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">
                        📈 Доходы (${incomeOperations.length})
                    </div>
                    ${incomeOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        if (expenseOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">
                        📉 Расходы (${expenseOperations.length})
                    </div>
                    ${expenseOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        if (debtOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">
                        💳 Долги (${debtOperations.length})
                    </div>
                    ${debtOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        return operationsHTML;
    }

    createOperationHTML(operation) {
        let typeClass = operation.type;
        let typeIcon, typeColor;
        let amountSign = '';
        let displayAmount = Math.abs(operation.amount || operation.displayAmount || 0);
        
        switch(operation.type) {
            case 'income':
                typeIcon = operation.icon || '💰';
                typeColor = '#34C759';
                amountSign = '+';
                break;
            case 'expense':
                typeIcon = operation.icon || '🛒';
                typeColor = '#FF3B30';
                amountSign = '-';
                break;
            case 'debt':
                typeIcon = operation.icon || '💳';
                typeColor = '#FF9500';
                amountSign = '-';
                break;
            case 'debt-payment':
                typeIcon = operation.icon || '✅';
                typeColor = '#34C759';
                amountSign = '+';
                break;
            default:
                typeIcon = operation.icon || '🛒';
                typeColor = '#8E8E93';
                amountSign = '';
        }
        
        let actionButtons = '';
        if (operation.isEditable !== false) {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="event.stopPropagation(); ${this.getEditFunctionName(operation)}">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="event.stopPropagation(); ${this.getDeleteFunctionName(operation)}">×</button>
                </div>
            `;
        }
        
        return `
            <div class="operation-item">
                <div class="operation-main-content">
                    <div class="operation-info">
                        <div class="operation-icon" style="background: ${typeColor}">
                            ${typeIcon}
                        </div>
                        <div class="operation-details">
                            <div class="operation-title">${operation.description || 'Без названия'}</div>
                            <div class="operation-meta">
                                <span>${this.formatDate(operation.date)}</span>
                                <span class="operation-time">${this.formatTime(operation.date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="operation-amount ${typeClass}">
                        ${amountSign}${this.settings.currency}${displayAmount.toFixed(2)}
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;
    }

    getEditFunctionName(operation) {
        switch(operation.type) {
            case 'income': return `editIncomeOperation(${operation.id})`;
            case 'expense': return `editExpenseOperation(${operation.id})`;
            case 'debt': return `editDebtOperation(${operation.id})`;
            case 'debt-payment': return `editDebtPayment(${operation.debtId}, ${operation.paymentIndex})`;
            default: return `editExpenseOperation(${operation.id})`;
        }
    }

    getDeleteFunctionName(operation) {
        switch(operation.type) {
            case 'income': return `deleteIncomeOperation(${operation.id})`;
            case 'expense': return `deleteExpenseOperation(${operation.id})`;
            case 'debt': return `deleteDebtOperation(${operation.id})`;
            case 'debt-payment': return `deleteDebtPayment(${operation.debtId}, ${operation.paymentIndex})`;
            default: return `deleteExpenseOperation(${operation.id})`;
        }
    }

    // Обновленные кружки
    updateCircles() {
        this.updateExpenseCategories();
        this.updateIncomeCategories();
        this.updateDebtCategories();
    }

    updateExpenseCategories() {
        const container = document.getElementById('expense-circles');
        if (!container) return;
        
        const categories = this.expenses.getCategories();
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        container.innerHTML = categories.map(category => {
            const totalAmount = this.expenses.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '🛒';
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            
            // Бюджет
            const budgetStatus = this.budgets.getBudgetStatus(category.id);
            const remaining = this.budgets.getRemainingBudget(category.id);
            const usagePercent = this.budgets.getBudgetUsagePercent(category.id);
            const hasBudget = this.budgets.getCategoryBudget(category.id);
            
            const deleteButton = category.id > 12 ?
                `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>` :
                '';
            
            const budgetButton = hasBudget ? 
                `<button class="circle-action-btn circle-budget" onclick="event.stopPropagation(); editCategoryBudget(${category.id})">📊</button>` :
                `<button class="circle-action-btn circle-budget-add" onclick="event.stopPropagation(); setCategoryBudget(${category.id})">💸</button>`;
            
            return `
                <div class="circle-item circle-expense budget-${budgetStatus}" onclick="addExpenseToCategory(${category.id})">
                    <div class="circle-actions">
                        ${budgetButton}
                        ${deleteButton}
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
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        container.innerHTML = categories.map(category => {
            const totalAmount = this.incomes.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '💰';
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            
            const deleteButton = category.id > 2 ?
                `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${category.id})">×</button>` :
                '';
            
            return `
                <div class="circle-item circle-income" onclick="addIncomeToCategory(${category.id})">
                    <div class="circle-actions">
                        ${deleteButton}
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
        if (!debts || debts.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        container.innerHTML = debts.map(debt => {
            const remaining = debt.amount - (debt.paidAmount || 0);
            const isPaid = remaining <= 0;
            const icon = debt.icon || '💳';
            
            return `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" onclick="makeDebtPayment(${debt.id})">
                    <div class="circle-actions">
                        ${!isPaid ? `<button class="circle-action-btn circle-check" onclick="event.stopPropagation(); makeDebtPayment(${debt.id})">✓</button>` : ''}
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

    // Цели накоплений
    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        if (!container) return;
        
        const goals = this.savingsGoals.getGoals();
        if (!goals || goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
                    <div>Нет целей накоплений</div>
                    <div style="font-size: 12px; margin-top: 10px; color: #8E8E93;">
                        Добавьте цель чтобы отслеживать прогресс
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = goals.map(goal => {
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
                    
                    ${!goal.isCompleted ? `
                        <div class="goal-details">
                            <div class="goal-deadline">
                                ${daysRemaining > 0 ? 
                                    `⏱️ ${daysRemaining} дней` : 
                                    '⌛ Срок истек'}
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
                    ` : `
                        <div class="goal-completed">
                            🎉 Цель достинута! 
                            <span class="goal-completed-date">${this.formatDate(goal.completedAt)}</span>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    // Система уведомлений
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

    // Исправленные методы для добавления категорий
    async addNewIncomeCategory() {
        try {
            const categoryName = prompt('Введите название категории доходов:');
            if (!categoryName) return;
            
            const icon = prompt('Введите смайлик (иконку) для категории (например: 💰, 💵, 💳):', '💰') || '💰';
            
            await this.incomes.addCategory({
                name: categoryName,
                icon: icon
            });
            await this.saveData();
            this.updateUI();
            ToastService.success('Категория доходов добавлена!');
        } catch (error) {
            console.error("Error adding income category:", error);
            ToastService.error("Ошибка при добавлении категории доходов: " + error.message);
        }
    }

    async addNewExpenseCategory() {
        try {
            const categoryName = prompt('Введите название категории расходов:');
            if (!categoryName) return;
            
            const icon = prompt('Введите смайлик (иконку) для категории (например: 🍔, 🚗, 🎮):', '🛒') || '🛒';
            
            await this.expenses.addCategory({
                name: categoryName,
                icon: icon
            });
            await this.saveData();
            this.updateUI();
            ToastService.success('Категория расходов добавлена!');
        } catch (error) {
            console.error("Error adding expense category:", error);
            ToastService.error("Ошибка при добавлении категории: " + error.message);
        }
    }

    async addNewCircle(type) {
        try {
            const amountStr = prompt(`Введите сумму ${this.getTypeName(type)}:`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount < 0) {
                ToastService.error("Пожалуйста, введите корректную сумму (неотрицательное число)");
                return;
            }
            
            const description = prompt('Введите описание:') || this.getDefaultDescription(type);
            
            let defaultIcon = '💰';
            if (type === 'debt') defaultIcon = '💳';
            
            const icon = prompt('Введите смайлик (иконку):', defaultIcon) || defaultIcon;
            
            if (type === 'debt') {
                await this.debts.add({
                    amount: amount,
                    description: description,
                    icon: icon
                });
                await this.saveData();
                this.updateUI();
                ToastService.success('Долг добавлен!');
            }
        } catch (error) {
            console.error("Error adding circle:", error);
            ToastService.error("Ошибка при добавлении: " + error.message);
        }
    }

    // Исправленный метод для добавления операций доходов
    async addIncomeToCategory(categoryId, subcategoryId) {
        try {
            const category = this.incomes.getCategory(categoryId);
            if (!category) {
                ToastService.error("Категория не найдена");
                return;
            }
            
            let targetName = category.name;
            let targetIcon = category.icon;
            
            if (subcategoryId) {
                const subcategory = category.subcategories?.find(s => s.id === subcategoryId);
                if (subcategory) {
                    targetName = subcategory.name;
                    targetIcon = subcategory.icon;
                }
            }
            
            const amountStr = prompt(`Введите сумму дохода для "${targetName}":`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount < 0) {
                ToastService.error("Пожалуйста, введите корректную сумму (неотрицательное число)");
                return;
            }
            
            await this.incomes.addOperation({
                categoryId: category.id,
                subcategoryId: subcategoryId,
                categoryName: category.name,
                subcategoryName: subcategoryId ? targetName : null,
                amount: amount,
                description: `${category.name}${subcategoryId ? ` - ${targetName}` : ''}`,
                icon: targetIcon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен в "${targetName}"`);
        } catch (error) {
            console.error("Error adding income:", error);
            ToastService.error("Ошибка при добавлении дохода: " + error.message);
        }
    }

    // Исправленный метод для добавления операций расходов
    async addExpenseToCategory(categoryId, subcategoryId) {
        try {
            const category = this.expenses.getCategory(categoryId);
            if (!category) {
                ToastService.error("Категория не найдена");
                return;
            }
            
            let targetName = category.name;
            let targetIcon = category.icon;
            
            if (subcategoryId) {
                const subcategory = category.subcategories?.find(s => s.id === subcategoryId);
                if (subcategory) {
                    targetName = subcategory.name;
                    targetIcon = subcategory.icon;
                }
            }
            
            const amountStr = prompt(`Введите сумму расхода для "${targetName}":`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Пожалуйста, введите корректную сумму (больше 0)");
                return;
            }
            
            await this.expenses.addOperation({
                categoryId: category.id,
                subcategoryId: subcategoryId,
                categoryName: category.name,
                subcategoryName: subcategoryId ? targetName : null,
                amount: amount,
                description: `${category.name}${subcategoryId ? ` - ${targetName}` : ''}`,
                icon: targetIcon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен в "${targetName}"`);
        } catch (error) {
            console.error("Error adding expense:", error);
            ToastService.error("Ошибка при добавлении расхода: " + error.message);
        }
    }

    // Метод для добавления дохода через быструю кнопку
    async addIncomeOperation() {
        try {
            const amountStr = prompt("Введите сумму дохода:", "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const description = prompt("Введите описание дохода:", "Доход") || "Доход";
            const icon = prompt("Введите иконку:", "💰") || "💰";
            
            // Используем первую категорию доходов или создаем временную
            const categories = this.incomes.getCategories();
            let categoryId;
            
            if (categories.length > 0) {
                categoryId = categories[0].id;
            } else {
                categoryId = 'quick_income_' + Date.now();
            }
            
            await this.incomes.addOperation({
                categoryId: categoryId,
                amount: amount,
                description: description,
                icon: icon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
        } catch (error) {
            console.error("Error adding income operation:", error);
            ToastService.error("Ошибка при добавлении дохода: " + error.message);
        }
    }

    // Метод для добавления расхода через быструю кнопку
    async addExpenseOperation() {
        try {
            const amountStr = prompt("Введите сумму расхода:", "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const description = prompt("Введите описание расхода:", "Расход") || "Расход";
            const icon = prompt("Введите иконку:", "🛒") || "🛒";
            
            // Используем первую категорию расходов или создаем временную
            const categories = this.expenses.getCategories();
            let categoryId;
            
            if (categories.length > 0) {
                categoryId = categories[0].id;
            } else {
                categoryId = 'quick_expense_' + Date.now();
            }
            
            await this.expenses.addOperation({
                categoryId: categoryId,
                amount: amount,
                description: description,
                icon: icon
            });
            
            await this.saveData();
            this.updateUI();
            ToastService.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
        } catch (error) {
            console.error("Error adding expense operation:", error);
            ToastService.error("Ошибка при добавлении расхода: " + error.message);
        }
    }

    // Модальные окна для выбора категорий расходов
    showCategorySelection() {
        const categories = this.expenses.getCategories();
        const categoryList = document.getElementById('category-list');
        
        if (!categories || categories.length === 0) {
            categoryList.innerHTML = '<div class="empty-state">Нет категорий расходов</div>';
        } else {
            categoryList.innerHTML = categories.map(category => `
                <button class="category-option" onclick="selectExpenseCategory(${category.id})">
                    <span class="category-option-icon">${category.icon}</span>
                    <span class="category-option-name">${category.name}</span>
                    <span class="category-option-amount">${this.settings.currency}${this.expenses.calculateCategoryTotal(category)}</span>
                </button>
            `).join('');
        }
        
        document.getElementById('category-modal').classList.add('active');
    }

    selectExpenseCategory(categoryId) {
        const category = this.expenses.getCategory(categoryId);
        if (!category) return;
        
        // Если есть подкатегории, показываем их выбор
        if (category.subcategories && category.subcategories.length > 0) {
            this.showSubcategorySelection(category);
        } else {
            // Если нет подкатегорий, сразу добавляем операцию
            this.addExpenseToCategory(categoryId);
            this.hideCategorySelection();
        }
    }

    showSubcategorySelection(category) {
        const subcategoryList = document.getElementById('subcategory-list');
        const modalTitle = document.getElementById('subcategory-modal-title');
        
        modalTitle.textContent = `Выберите подкатегорию для "${category.name}"`;
        
        subcategoryList.innerHTML = category.subcategories.map(subcategory => `
            <button class="category-option" onclick="selectSubcategory(${category.id}, ${subcategory.id})">
                <span class="category-option-icon">${subcategory.icon}</span>
                <span class="category-option-name">${subcategory.name}</span>
                <span class="category-option-amount">${this.settings.currency}${subcategory.amount || 0}</span>
            </button>
        `).join('');
        
        this.hideCategorySelection();
        document.getElementById('subcategory-modal').classList.add('active');
    }

    selectSubcategory(categoryId, subcategoryId) {
        this.addExpenseToCategory(categoryId, subcategoryId);
        this.hideSubcategorySelection();
    }

    hideCategorySelection() {
        document.getElementById('category-modal').classList.remove('active');
    }

    hideSubcategorySelection() {
        document.getElementById('subcategory-modal').classList.remove('active');
    }

    // Методы для выбора категорий доходов
    showIncomeCategorySelection() {
        const categories = this.incomes.getCategories();
        const categoryList = document.getElementById('income-category-list');
        
        if (!categories || categories.length === 0) {
            categoryList.innerHTML = '<div class="empty-state">Нет категорий доходов</div>';
        } else {
            categoryList.innerHTML = categories.map(category => `
                <button class="category-option" onclick="selectIncomeCategory(${category.id})">
                    <span class="category-option-icon">${category.icon}</span>
                    <span class="category-option-name">${category.name}</span>
                    <span class="category-option-amount">${this.settings.currency}${this.incomes.calculateCategoryTotal(category)}</span>
                </button>
            `).join('');
        }
        
        document.getElementById('income-category-modal').classList.add('active');
    }

    selectIncomeCategory(categoryId) {
        const category = this.incomes.getCategory(categoryId);
        if (!category) return;
        
        if (category.subcategories && category.subcategories.length > 0) {
            this.showIncomeSubcategorySelection(category);
        } else {
            this.addIncomeToCategory(categoryId);
            this.hideIncomeCategorySelection();
        }
    }

    showIncomeSubcategorySelection(category) {
        const subcategoryList = document.getElementById('income-subcategory-list');
        const modalTitle = document.getElementById('income-subcategory-modal-title');
        
        modalTitle.textContent = `Выберите подкатегорию для "${category.name}"`;
        
        subcategoryList.innerHTML = category.subcategories.map(subcategory => `
            <button class="category-option" onclick="selectIncomeSubcategory(${category.id}, ${subcategory.id})">
                <span class="category-option-icon">${subcategory.icon}</span>
                <span class="category-option-name">${subcategory.name}</span>
                <span class="category-option-amount">${this.settings.currency}${subcategory.amount || 0}</span>
            </button>
        `).join('');
        
        this.hideIncomeCategorySelection();
        document.getElementById('income-subcategory-modal').classList.add('active');
    }

    selectIncomeSubcategory(categoryId, subcategoryId) {
        this.addIncomeToCategory(categoryId, subcategoryId);
        this.hideIncomeSubcategorySelection();
    }

    hideIncomeCategorySelection() {
        document.getElementById('income-category-modal').classList.remove('active');
    }

    hideIncomeSubcategorySelection() {
        document.getElementById('income-subcategory-modal').classList.remove('active');
    }

    // Бюджет методы
    async setCategoryBudget(categoryId) {
        const category = this.expenses.getCategory(categoryId);
        if (!category) return;
        
        const monthlyLimitStr = prompt(`Введите месячный бюджет для "${category.name}":`, "1000");
        if (monthlyLimitStr === null) return;
        
        const monthlyLimit = parseFloat(monthlyLimitStr) || 0;
        if (monthlyLimit <= 0) {
            ToastService.error("Бюджет должен быть больше 0");
            return;
        }
        
        try {
            await this.budgets.setCategoryBudget(categoryId, monthlyLimit);
            await this.saveData();
            this.updateUI();
            ToastService.success(`Бюджет для "${category.name}" установлен!`);
        } catch (error) {
            ToastService.error("Ошибка при установке бюджета: " + error.message);
        }
    }

    async editCategoryBudget(categoryId) {
        const budget = this.budgets.getCategoryBudget(categoryId);
        const category = this.expenses.getCategory(categoryId);
        if (!budget || !category) return;
        
        const newLimitStr = prompt(
            `Текущий бюджет для "${category.name}": ${this.settings.currency}${budget.monthlyLimit}\nВведите новый бюджет:`,
            budget.monthlyLimit.toString()
        );
        
        if (newLimitStr === null) return;
        
        const newLimit = parseFloat(newLimitStr) || 0;
        if (newLimit <= 0) {
            ToastService.error("Бюджет должен быть больше 0");
            return;
        }
        
        try {
            await this.budgets.setCategoryBudget(categoryId, newLimit);
            await this.saveData();
            this.updateUI();
            ToastService.success(`Бюджет для "${category.name}" обновлен!`);
        } catch (error) {
            ToastService.error("Ошибка при обновлении бюджета: " + error.message);
        }
    }

    // Цели методы
    async addToGoal(goalId) {
        const goal = this.savingsGoals.getGoals().find(g => g.id === goalId);
        if (!goal) return;
        
        const amountStr = prompt(
            `Введите сумму для добавления в цель "${goal.name}":\nТекущий прогресс: ${this.settings.currency}${goal.currentAmount} / ${this.settings.currency}${goal.targetAmount}`,
            "100"
        );
        
        if (amountStr === null) return;
        
        const amount = parseFloat(amountStr) || 0;
        if (amount <= 0) {
            ToastService.error("Сумма должна быть больше 0");
            return;
        }
        
        try {
            await this.savingsGoals.addToGoal(goalId, amount);
            await this.saveData();
            this.updateUI();
            ToastService.success(`Средства добавлены в цель "${goal.name}"!`);
        } catch (error) {
            ToastService.error("Ошибка при добавлении средств: " + error.message);
        }
    }

    showAddGoalModal() {
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-target').value = '';
        document.getElementById('goal-deadline').value = '';
        document.getElementById('goal-icon').value = '🎯';
        document.getElementById('goal-color').value = '#007AFF';
        
        document.getElementById('add-goal-modal').classList.add('active');
    }

    async createNewGoal() {
        const name = document.getElementById('goal-name').value.trim();
        const targetAmountStr = document.getElementById('goal-target').value;
        const deadline = document.getElementById('goal-deadline').value;
        const icon = document.getElementById('goal-icon').value.trim() || '🎯';
        const color = document.getElementById('goal-color').value;
        
        if (!name) {
            ToastService.error("Введите название цели");
            return;
        }
        
        const targetAmount = parseFloat(targetAmountStr) || 0;
        if (targetAmount <= 0) {
            ToastService.error("Введите корректную целевую сумму");
            return;
        }
        
        if (!deadline) {
            ToastService.error("Укажите срок цели");
            return;
        }
        
        try {
            await this.savingsGoals.createGoal({
                name,
                targetAmount,
                deadline,
                icon,
                color
            });
            await this.saveData();
            this.hideAddGoalModal();
            this.updateUI();
            ToastService.success('Цель создана!');
        } catch (error) {
            ToastService.error("Ошибка при создании цели: " + error.message);
        }
    }

    hideAddGoalModal() {
        document.getElementById('add-goal-modal').classList.remove('active');
    }

    // Повторяющиеся операции
    showRecurringTransactionsModal() {
        const modal = document.getElementById('recurring-transactions-modal');
        const list = document.getElementById('recurring-transactions-list');
        
        const transactions = this.recurring.getRecurringTransactions();
        
        if (transactions.length === 0) {
            list.innerHTML = '<div class="empty-state">Нет повторяющихся операций</div>';
        } else {
            list.innerHTML = transactions.map(transaction => `
                <div class="recurring-transaction-item ${!transaction.isActive ? 'inactive' : ''}">
                    <div class="transaction-info">
                        <div class="transaction-icon">${transaction.icon}</div>
                        <div class="transaction-details">
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-meta">
                                ${this.settings.currency}${transaction.amount} • 
                                ${this.recurring.getRecurrenceText(transaction.recurrence)} • 
                                След.: ${this.formatDate(transaction.nextDate)}
                            </div>
                        </div>
                    </div>
                    <div class="transaction-actions">
                        <button class="transaction-toggle" 
                                onclick="toggleRecurringTransaction(${transaction.id})">
                            ${transaction.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button class="transaction-delete" 
                                onclick="deleteRecurringTransaction(${transaction.id})">×</button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.add('active');
    }

    async toggleRecurringTransaction(id) {
        try {
            await this.recurring.toggleTransactionActive(id);
            await this.saveData();
            this.showRecurringTransactionsModal();
            ToastService.info('Статус операции изменен');
        } catch (error) {
            ToastService.error("Ошибка при изменении статуса: " + error.message);
        }
    }

    async deleteRecurringTransaction(id) {
        if (confirm('Удалить эту повторяющуюся операцию?')) {
            try {
                await this.recurring.deleteRecurringTransaction(id);
                await this.saveData();
                this.showRecurringTransactionsModal();
                ToastService.success('Повторяющаяся операция удалена');
            } catch (error) {
                ToastService.error("Ошибка при удалении: " + error.message);
            }
        }
    }

    // Вспомогательные методы
    getTypeName(type) {
        switch(type) {
            case 'income': return 'дохода';
            case 'expense': return 'расхода';
            case 'debt': return 'долга';
            default: return '';
        }
    }

    getDefaultDescription(type) {
        switch(type) {
            case 'income': return 'Доход';
            case 'expense': return 'Расход';
            case 'debt': return 'Долг';
            default: return 'Операция';
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

    startClock() {
        const updateTime = () => {
            try {
                const now = new Date();
                const timeElement = document.getElementById('current-time');
                const dateElement = document.getElementById('current-date');
                
                if (timeElement) {
                    timeElement.textContent = 
                        now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
                }
                
                if (dateElement) {
                    dateElement.textContent = 
                        now.getDate().toString().padStart(2, '0') + '.' + 
                        (now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                        now.getFullYear();
                }
            } catch (e) {
                console.error("Error updating time:", e);
            }
        };
        
        updateTime();
        setInterval(updateTime, 60000);
    }

    updateBalance() {
        const totalIncome = this.incomes.getTotal();
        const totalExpenses = this.expenses.getTotalExpenses();
        const totalPaidDebts = this.debts.getTotalPaid();
        const balance = totalIncome - totalExpenses - totalPaidDebts;
        
        console.log('Balance calculation:', {
            totalIncome,
            totalExpenses,
            totalPaidDebts,
            balance
        });
        
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
        
        const reportIncome = document.getElementById('report-income');
        const reportExpense = document.getElementById('report-expense');
        const reportDebt = document.getElementById('report-debt');
        const reportBalance = document.getElementById('report-balance');
        
        if (reportIncome) reportIncome.textContent = `${this.settings.currency}${report.totalIncome.toFixed(2)}`;
        if (reportExpense) reportExpense.textContent = `${this.settings.currency}${report.totalExpenses.toFixed(2)}`;
        if (reportDebt) reportDebt.textContent = `${this.settings.currency}${report.totalPaidDebts.toFixed(2)}`;
        if (reportBalance) reportBalance.textContent = `${this.settings.currency}${report.balance.toFixed(2)}`;
    }

    // Навигация
    switchScreen(screenName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItems = document.querySelectorAll('.nav-item');
        if (screenName === 'overview') {
            if (navItems[0]) navItems[0].classList.add('active');
        } else if (screenName === 'operations') {
            if (navItems[1]) navItems[1].classList.add('active');
        } else if (screenName === 'report') {
            if (navItems[2]) navItems[2].classList.add('active');
        } else if (screenName === 'goals') {
            if (navItems[3]) navItems[3].classList.add('active');
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        if (screenName === 'operations') {
            this.updateOperationsList();
        } else if (screenName === 'report') {
            this.updateReport();
        } else if (screenName === 'goals') {
            this.updateSavingsGoals();
        }
    }
}

// Вспомогательные классы
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