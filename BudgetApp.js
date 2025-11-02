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
        
        // Настройки по умолчанию
        this.settings = { 
            currency: "₽",
            budgetAlerts: true,
            autoProcessRecurring: true
        };
        
        this.initialized = false;
        this.currentEditingGoal = null;
    }

    async init() {
        console.log("💰 Budget App: Starting initialization...");
        
        try {
            // Инициализация хранилища
            await this.storage.init();
            
            // Загрузка данных
            await this.loadData();
            
            // Инициализация UI
            this.initializeUI();
            
            this.initialized = true;
            console.log("✅ Budget App: Initialized successfully");
            
        } catch (error) {
            console.error("❌ Budget App: Initialization error:", error);
            ToastService.error("Ошибка инициализации приложения");
        }
    }

    async loadData() {
        try {
            const data = await this.storage.getAllData();
            console.log("📊 Loaded data structure:", {
                expenseCategories: data.expenseCategories?.length || 0,
                incomeCategories: data.incomeCategories?.length || 0,
                debts: data.debts?.length || 0,
                expenseOperations: data.expenseOperations?.length || 0,
                incomes: data.incomes?.length || 0
            });
            
            // Загружаем данные в сервисы
            await this.expenses.load(data);
            await this.incomes.load(data);
            await this.debts.load(data);
            await this.budgets.load(data);
            await this.recurring.load(data);
            await this.savingsGoals.load(data);
            
            // Настройки
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }

            console.log("✅ Data loaded successfully");
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Инициализируем с пустыми данными
            await this.expenses.load({});
            await this.incomes.load({});
            await this.debts.load({});
            await this.budgets.load({});
            await this.recurring.load({});
            await this.savingsGoals.load({});
        }
    }

    initializeUI() {
        this.updateAllUI();
        this.startClock();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчики для модальных окон
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

    closeAllModals() {
        document.querySelectorAll('.category-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    updateAllUI() {
        this.updateBalance();
        this.updateCategories();
        this.updateOperationsList();
        this.updateSavingsGoals();
        this.updateReport();
    }

    updateBalance() {
        try {
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
            
        } catch (error) {
            console.error("❌ Error updating balance:", error);
        }
    }

    updateCategories() {
        this.updateExpenseCategories();
        this.updateIncomeCategories();
        this.updateDebtCategories();
    }

    updateExpenseCategories() {
        const container = document.getElementById('expense-circles');
        if (!container) {
            console.log("❌ Expense circles container not found");
            return;
        }
        
        const categories = this.expenses.getCategories();
        console.log("📦 Rendering expense categories:", categories);
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            const totalAmount = this.expenses.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '🛒';
            const budgetStatus = this.budgets.getBudgetStatus(category.id);
            const remaining = this.budgets.getRemainingBudget(category.id);
            const usagePercent = this.budgets.getBudgetUsagePercent(category.id);
            const hasBudget = this.budgets.getCategoryBudget(category.id);
            
            html += `
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
                    <div class="circle-label">${category.name}</div>
                    
                    ${hasBudget ? `
                        <div class="budget-progress">
                            <div class="budget-progress-bar" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        </div>
                        <div class="budget-remaining">
                            ${this.settings.currency}${remaining ? remaining.toFixed(2) : '0'}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateIncomeCategories() {
        const container = document.getElementById('income-circles');
        if (!container) {
            console.log("❌ Income circles container not found");
            return;
        }
        
        const categories = this.incomes.getCategories();
        console.log("💰 Rendering income categories:", categories);
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            const totalAmount = this.incomes.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '💰';
            
            html += `
                <div class="circle-item circle-income" onclick="addIncomeToCategory(${category.id})">
                    <div class="circle-actions">
                        ${category.id > 5 ? 
                            `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${category.id})">×</button>` :
                            ''
                        }
                    </div>
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${totalAmount}</div>` : ''}
                    <div class="circle-label">${category.name}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateDebtCategories() {
        const container = document.getElementById('debt-circles');
        if (!container) {
            console.log("❌ Debt circles container not found");
            return;
        }
        
        const debts = this.debts.getAll();
        console.log("💳 Rendering debts:", debts);
        
        if (!debts || debts.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        debts.forEach(debt => {
            const remaining = debt.amount - (debt.paidAmount || 0);
            const isPaid = remaining <= 0;
            const icon = debt.icon || '💳';
            
            html += `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" onclick="makeDebtPayment(${debt.id})">
                    <div class="circle-actions">
                        ${!isPaid ? 
                            `<button class="circle-action-btn circle-check" onclick="event.stopPropagation(); makeDebtPayment(${debt.id})">✓</button>` :
                            ''
                        }
                        <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteDebt(${debt.id})">×</button>
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
        });
        
        container.innerHTML = html;
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) return;
        
        const operations = this.operations.getAllOperations();
        
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
        let html = '';
        const grouped = this.groupOperationsByDate(operations);
        
        for (const [date, items] of Object.entries(grouped)) {
            html += `<div class="operations-group-title">${date}</div>`;
            
            items.forEach(operation => {
                html += this.createOperationHTML(operation);
            });
        }
        
        return html;
    }

    groupOperationsByDate(operations) {
        const groups = {};
        
        operations.forEach(operation => {
            const date = new Date(operation.date).toLocaleDateString('ru-RU');
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(operation);
        });
        
        return groups;
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
                                <span class="operation-time">${this.formatTime(operation.date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="operation-amount ${operation.type}">
                        ${config.sign}${this.settings.currency}${displayAmount.toFixed(2)}
                    </div>
                </div>
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

    getEditFunctionName(operation) {
        const functions = {
            'income': `editIncomeOperation(${operation.id})`,
            'expense': `editExpenseOperation(${operation.id})`,
            'debt': `editDebt(${operation.id})`,
            'debt-payment': `editDebtPayment(${operation.debtId}, ${operation.paymentIndex})`
        };
        return functions[operation.type] || functions.expense;
    }

    getDeleteFunctionName(operation) {
        const functions = {
            'income': `deleteIncomeOperation(${operation.id})`,
            'expense': `deleteExpenseOperation(${operation.id})`,
            'debt': `deleteDebt(${operation.id})`,
            'debt-payment': `deleteDebtPayment(${operation.debtId}, ${operation.paymentIndex})`
        };
        return functions[operation.type] || functions.expense;
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        const goalsContainer = document.getElementById('goals-container');
        
        if (container) {
            const goals = this.savingsGoals.getGoals();
            container.innerHTML = goals.length > 0 ? this.renderSavingsGoals(goals) : this.createEmptySavingsGoalsState();
        }
        
        if (goalsContainer) {
            const goals = this.savingsGoals.getGoals();
            goalsContainer.innerHTML = goals.length > 0 ? this.renderGoalsList(goals) : this.createEmptyGoalsState();
        }
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

    createEmptyGoalsState() {
        return `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
                <div>Нет целей</div>
                <div style="font-size: 12px; margin-top: 10px; color: #8E8E93;">
                    Нажмите + чтобы добавить первую цель
                </div>
            </div>
        `;
    }

    renderSavingsGoals(goals) {
        return goals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const daysRemaining = this.calculateDaysRemaining(goal.deadline);
            
            return `
                <div class="savings-goal-card ${goal.isCompleted ? 'completed' : ''}">
                    <div class="goal-header">
                        <div class="goal-icon">${goal.icon || '🎯'}</div>
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
                        <div class="goal-progress-fill" style="width: ${progress}%; background: ${goal.color || '#007AFF'}"></div>
                    </div>
                    
                    ${!goal.isCompleted ? this.renderActiveGoalDetails(goal, daysRemaining) : this.renderCompletedGoal(goal)}
                </div>
            `;
        }).join('');
    }

    renderGoalsList(goals) {
        return goals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const daysRemaining = this.calculateDaysRemaining(goal.deadline);
            
            return `
                <div class="savings-goal-card ${goal.isCompleted ? 'completed' : ''}">
                    <div class="goal-header">
                        <div class="goal-icon">${goal.icon || '🎯'}</div>
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
                        <div class="goal-progress-fill" style="width: ${progress}%; background: ${goal.color || '#007AFF'}"></div>
                    </div>
                    
                    <div class="goal-actions">
                        <button class="add-to-goal-btn" onclick="addToGoal(${goal.id})"
                                style="background: ${goal.color || '#007AFF'}">
                            + Добавить
                        </button>
                        <button class="goal-action-btn" onclick="editGoal(${goal.id})">✏️</button>
                        <button class="goal-action-btn" onclick="deleteGoal(${goal.id})">×</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderActiveGoalDetails(goal, daysRemaining) {
        const monthlySave = this.calculateMonthlySave(goal);
        
        return `
            <div class="goal-details">
                <div class="goal-deadline">
                    ${daysRemaining > 0 ? `⏱️ ${daysRemaining} дней` : '⌛ Срок истек'}
                </div>
                ${monthlySave > 0 ? `
                    <div class="goal-monthly">
                        💰 ${this.settings.currency}${monthlySave.toFixed(2)}/мес
                    </div>
                ` : ''}
            </div>
            
            <div class="goal-actions">
                <button class="add-to-goal-btn" onclick="addToGoal(${goal.id})"
                        style="background: ${goal.color || '#007AFF'}">
                    + Добавить
                </button>
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

    calculateDaysRemaining(deadline) {
        if (!deadline) return null;
        const today = new Date();
        const targetDate = new Date(deadline);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateMonthlySave(goal) {
        if (!goal.deadline) return 0;
        const daysRemaining = this.calculateDaysRemaining(goal.deadline);
        if (daysRemaining <= 0) return goal.targetAmount - goal.currentAmount;
        
        const monthsRemaining = daysRemaining / 30.44;
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        
        return remainingAmount / Math.max(1, Math.ceil(monthsRemaining));
    }

    updateReport() {
        try {
            const report = this.reports.generateReport();
            
            const reportIncome = document.getElementById('report-income');
            const reportExpense = document.getElementById('report-expense');
            const reportDebt = document.getElementById('report-debt');
            const reportBalance = document.getElementById('report-balance');
            const reportDetails = document.getElementById('report-details');
            
            if (reportIncome) reportIncome.textContent = `${this.settings.currency}${report.totalIncome.toFixed(2)}`;
            if (reportExpense) reportExpense.textContent = `${this.settings.currency}${report.totalExpenses.toFixed(2)}`;
            if (reportDebt) reportDebt.textContent = `${this.settings.currency}${report.totalPaidDebts.toFixed(2)}`;
            if (reportBalance) reportBalance.textContent = `${this.settings.currency}${report.balance.toFixed(2)}`;
            
            if (reportDetails) {
                reportDetails.innerHTML = this.createReportDetails(report.details);
            }
            
        } catch (error) {
            console.error("❌ Error updating report:", error);
        }
    }

    createReportDetails(details) {
        if (!details) return '';
        
        let html = '';
        
        // Доходы
        if (details.incomes && details.incomes.length > 0) {
            html += '<h4>Доходы по категориям:</h4>';
            details.incomes.forEach(income => {
                html += `<div class="result-item"><span>${income.name}</span><span class="income">${this.settings.currency}${income.amount.toFixed(2)}</span></div>`;
            });
        }
        
        // Расходы
        if (details.expenses && details.expenses.length > 0) {
            html += '<h4>Расходы по категориям:</h4>';
            details.expenses.forEach(expense => {
                html += `<div class="result-item"><span>${expense.name}</span><span class="expense">${this.settings.currency}${expense.amount.toFixed(2)}</span></div>`;
            });
        }
        
        return html;
    }

    // Методы для работы с доходами
    async addIncomeToCategory(categoryId) {
        try {
            const category = this.incomes.getCategory(categoryId);
            if (!category) {
                ToastService.error("Категория не найдена");
                return;
            }
            
            const amountStr = prompt(`Введите сумму дохода для "${category.name}":`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const description = prompt('Введите описание:', `Доход: ${category.name}`) || `Доход: ${category.name}`;
            
            await this.incomes.addOperation({
                categoryId: category.id,
                amount: amount,
                description: description,
                icon: category.icon
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            console.error("❌ Error adding income:", error);
            ToastService.error("Ошибка при добавлении дохода");
        }
    }

    async addNewIncomeCategory() {
        try {
            const categoryName = prompt('Введите название категории доходов:');
            if (!categoryName) return;
            
            const icon = prompt('Введите иконку для категории:', '💰') || '💰';
            
            await this.incomes.addCategory({
                name: categoryName,
                icon: icon
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Категория доходов добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding income category:", error);
            ToastService.error("Ошибка при добавлении категории доходов");
        }
    }

    async deleteIncomeCategory(categoryId) {
        try {
            if (!confirm('Удалить эту категорию доходов? Все связанные операции также будут удалены.')) {
                return;
            }
            
            await this.incomes.deleteCategory(categoryId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Категория доходов удалена');
            
        } catch (error) {
            console.error("❌ Error deleting income category:", error);
            ToastService.error("Ошибка при удалении категории доходов");
        }
    }

    async editIncomeOperation(operationId) {
        try {
            const operation = this.incomes.getOperation(operationId);
            if (!operation) {
                ToastService.error("Операция не найдена");
                return;
            }
            
            const newAmountStr = prompt('Введите новую сумму:', operation.amount.toString());
            if (newAmountStr === null) return;
            
            const newAmount = parseFloat(newAmountStr) || 0;
            if (newAmount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const newDescription = prompt('Введите новое описание:', operation.description) || operation.description;
            
            await this.incomes.updateOperation(operationId, {
                amount: newAmount,
                description: newDescription
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Операция обновлена');
            
        } catch (error) {
            console.error("❌ Error editing income operation:", error);
            ToastService.error("Ошибка при редактировании операции дохода");
        }
    }

    async deleteIncomeOperation(operationId) {
        try {
            if (!confirm('Удалить эту операцию дохода?')) {
                return;
            }
            
            await this.incomes.deleteOperation(operationId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Операция дохода удалена');
            
        } catch (error) {
            console.error("❌ Error deleting income operation:", error);
            ToastService.error("Ошибка при удалении операции дохода");
        }
    }

    // Методы для работы с расходами
    async addExpenseToCategory(categoryId) {
        try {
            const category = this.expenses.getCategory(categoryId);
            if (!category) {
                ToastService.error("Категория не найдена");
                return;
            }
            
            const amountStr = prompt(`Введите сумму расхода для "${category.name}":`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const description = prompt('Введите описание:', `Расход: ${category.name}`) || `Расход: ${category.name}`;
            
            await this.expenses.addOperation({
                categoryId: category.id,
                amount: amount,
                description: description,
                icon: category.icon
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            console.error("❌ Error adding expense:", error);
            ToastService.error("Ошибка при добавлении расхода");
        }
    }

    async addNewExpenseCategory() {
        try {
            const categoryName = prompt('Введите название категории расходов:');
            if (!categoryName) return;
            
            const icon = prompt('Введите иконку для категории:', '🛒') || '🛒';
            
            await this.expenses.addCategory({
                name: categoryName,
                icon: icon
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Категория расходов добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding expense category:", error);
            ToastService.error("Ошибка при добавлении категории расходов");
        }
    }

    async deleteExpenseCategory(categoryId) {
        try {
            if (!confirm('Удалить эту категорию расходов? Все связанные операции также будут удалены.')) {
                return;
            }
            
            await this.expenses.deleteCategory(categoryId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Категория расходов удалена');
            
        } catch (error) {
            console.error("❌ Error deleting expense category:", error);
            ToastService.error("Ошибка при удалении категории расходов");
        }
    }

    async editExpenseOperation(operationId) {
        try {
            const operation = this.expenses.getOperation(operationId);
            if (!operation) {
                ToastService.error("Операция не найдена");
                return;
            }
            
            const newAmountStr = prompt('Введите новую сумму:', operation.amount.toString());
            if (newAmountStr === null) return;
            
            const newAmount = parseFloat(newAmountStr) || 0;
            if (newAmount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const newDescription = prompt('Введите новое описание:', operation.description) || operation.description;
            
            await this.expenses.updateOperation(operationId, {
                amount: newAmount,
                description: newDescription
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Операция обновлена');
            
        } catch (error) {
            console.error("❌ Error editing expense operation:", error);
            ToastService.error("Ошибка при редактировании операции расхода");
        }
    }

    async deleteExpenseOperation(operationId) {
        try {
            if (!confirm('Удалить эту операцию расхода?')) {
                return;
            }
            
            await this.expenses.deleteOperation(operationId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Операция расхода удалена');
            
        } catch (error) {
            console.error("❌ Error deleting expense operation:", error);
            ToastService.error("Ошибка при удалении операции расхода");
        }
    }

    // Методы для работы с долгами
    async addNewDebt() {
        try {
            const amountStr = prompt('Введите сумму долга:', "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const description = prompt('Введите описание долга:', 'Долг') || 'Долг';
            const icon = prompt('Введите иконку:', '💳') || '💳';
            
            await this.debts.add({
                amount: amount,
                description: description,
                icon: icon
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Долг добавлен!');
            
        } catch (error) {
            console.error("❌ Error adding debt:", error);
            ToastService.error("Ошибка при добавлении долга");
        }
    }

    async makeDebtPayment(debtId) {
        try {
            const debt = this.debts.get(debtId);
            if (!debt) return;
            
            const remaining = debt.amount - (debt.paidAmount || 0);
            if (remaining <= 0) {
                ToastService.info("Долг уже полностью погашен");
                return;
            }
            
            const amountStr = prompt(`Введите сумму платежа (осталось: ${this.settings.currency}${remaining}):`, remaining.toString());
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0 || amount > remaining) {
                ToastService.error("Введите корректную сумму платежа");
                return;
            }
            
            await this.debts.makePayment(debtId, amount);
            await this.saveData();
            this.updateAllUI();
            ToastService.success(`Платеж ${this.settings.currency}${amount.toFixed(2)} внесен`);
            
        } catch (error) {
            console.error("❌ Error making debt payment:", error);
            ToastService.error("Ошибка при оплате долга");
        }
    }

    async editDebt(debtId) {
        try {
            const debt = this.debts.get(debtId);
            if (!debt) {
                ToastService.error("Долг не найден");
                return;
            }
            
            const newAmountStr = prompt('Введите новую сумму долга:', debt.amount.toString());
            if (newAmountStr === null) return;
            
            const newAmount = parseFloat(newAmountStr) || 0;
            if (newAmount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const newDescription = prompt('Введите новое описание:', debt.description) || debt.description;
            
            await this.debts.update(debtId, {
                amount: newAmount,
                description: newDescription
            });
            
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Долг обновлен');
            
        } catch (error) {
            console.error("❌ Error editing debt:", error);
            ToastService.error("Ошибка при редактировании долга");
        }
    }

    async deleteDebt(debtId) {
        try {
            if (!confirm('Удалить этот долг?')) {
                return;
            }
            
            await this.debts.delete(debtId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Долг удален');
            
        } catch (error) {
            console.error("❌ Error deleting debt:", error);
            ToastService.error("Ошибка при удалении долга");
        }
    }

    // Методы для работы с бюджетами
    async setCategoryBudget(categoryId) {
        try {
            const category = this.expenses.getCategory(categoryId);
            if (!category) {
                ToastService.error("Категория не найдена");
                return;
            }
            
            const limitStr = prompt(`Введите месячный лимит для "${category.name}":`, "1000");
            if (limitStr === null) return;
            
            const limit = parseFloat(limitStr) || 0;
            if (limit <= 0) {
                ToastService.error("Лимит должен быть больше 0");
                return;
            }
            
            await this.budgets.setCategoryBudget(categoryId, limit);
            await this.saveData();
            this.updateAllUI();
            ToastService.success(`Бюджет для "${category.name}" установлен`);
            
        } catch (error) {
            console.error("❌ Error setting budget:", error);
            ToastService.error("Ошибка при установке бюджета");
        }
    }

    async editCategoryBudget(categoryId) {
        try {
            const budget = this.budgets.getCategoryBudget(categoryId);
            const category = this.expenses.getCategory(categoryId);
            
            if (!budget || !category) {
                ToastService.error("Бюджет не найден");
                return;
            }
            
            const newLimitStr = prompt(`Введите новый лимит для "${category.name}":`, budget.monthlyLimit.toString());
            if (newLimitStr === null) return;
            
            const newLimit = parseFloat(newLimitStr) || 0;
            if (newLimit <= 0) {
                ToastService.error("Лимит должен быть больше 0");
                return;
            }
            
            await this.budgets.setCategoryBudget(categoryId, newLimit);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Бюджет обновлен');
            
        } catch (error) {
            console.error("❌ Error editing budget:", error);
            ToastService.error("Ошибка при редактировании бюджета");
        }
    }

    // Методы для работы с целями
    async showAddGoalModal() {
        const modal = document.getElementById('add-goal-modal');
        if (modal) {
            // Сбросить форму
            document.getElementById('goal-name').value = '';
            document.getElementById('goal-target').value = '';
            document.getElementById('goal-deadline').value = '';
            document.getElementById('goal-icon').value = '🎯';
            document.getElementById('goal-color').value = '#007AFF';
            this.currentEditingGoal = null;
            modal.classList.add('active');
        }
    }

    async createNewGoal() {
        try {
            const name = document.getElementById('goal-name').value;
            const target = parseFloat(document.getElementById('goal-target').value) || 0;
            const deadline = document.getElementById('goal-deadline').value;
            const icon = document.getElementById('goal-icon').value || '🎯';
            const color = document.getElementById('goal-color').value || '#007AFF';
            
            if (!name) {
                ToastService.error("Введите название цели");
                return;
            }
            
            if (target <= 0) {
                ToastService.error("Целевая сумма должна быть больше 0");
                return;
            }
            
            const goalData = {
                name: name,
                targetAmount: target,
                deadline: deadline,
                icon: icon,
                color: color
            };
            
            if (this.currentEditingGoal) {
                await this.savingsGoals.updateGoal(this.currentEditingGoal, goalData);
                ToastService.success('Цель обновлена');
            } else {
                await this.savingsGoals.createGoal(goalData);
                ToastService.success('Цель создана');
            }
            
            await this.saveData();
            this.updateAllUI();
            this.hideAddGoalModal();
            
        } catch (error) {
            console.error("❌ Error creating goal:", error);
            ToastService.error("Ошибка при создании цели");
        }
    }

    async addToGoal(goalId) {
        try {
            const goal = this.savingsGoals.getGoals().find(g => g.id === goalId);
            if (!goal) {
                ToastService.error("Цель не найдена");
                return;
            }
            
            if (goal.isCompleted) {
                ToastService.info("Цель уже достигнута");
                return;
            }
            
            const amountStr = prompt(`Введите сумму для добавления в цель "${goal.name}" (максимум: ${this.settings.currency}${goal.targetAmount - goal.currentAmount}):`, "0");
            if (amountStr === null) return;
            
            const amount = parseFloat(amountStr) || 0;
            if (amount <= 0) {
                ToastService.error("Сумма должна быть больше 0");
                return;
            }
            
            const remaining = goal.targetAmount - goal.currentAmount;
            if (amount > remaining) {
                ToastService.error(`Сумма не может превышать ${this.settings.currency}${remaining}`);
                return;
            }
            
            await this.savingsGoals.addToGoal(goalId, amount);
            await this.saveData();
            this.updateAllUI();
            ToastService.success(`Добавлено ${this.settings.currency}${amount.toFixed(2)} в цель`);
            
        } catch (error) {
            console.error("❌ Error adding to goal:", error);
            ToastService.error("Ошибка при добавлении средств в цель");
        }
    }

    async editGoal(goalId) {
        try {
            const goal = this.savingsGoals.getGoals().find(g => g.id === goalId);
            if (!goal) {
                ToastService.error("Цель не найдена");
                return;
            }
            
            this.currentEditingGoal = goalId;
            
            const modal = document.getElementById('add-goal-modal');
            if (modal) {
                document.getElementById('goal-name').value = goal.name;
                document.getElementById('goal-target').value = goal.targetAmount;
                document.getElementById('goal-deadline').value = goal.deadline || '';
                document.getElementById('goal-icon').value = goal.icon || '🎯';
                document.getElementById('goal-color').value = goal.color || '#007AFF';
                modal.classList.add('active');
            }
            
        } catch (error) {
            console.error("❌ Error editing goal:", error);
            ToastService.error("Ошибка при редактировании цели");
        }
    }

    async deleteGoal(goalId) {
        try {
            if (!confirm('Удалить эту цель?')) {
                return;
            }
            
            await this.savingsGoals.deleteGoal(goalId);
            await this.saveData();
            this.updateAllUI();
            ToastService.success('Цель удалена');
            
        } catch (error) {
            console.error("❌ Error deleting goal:", error);
            ToastService.error("Ошибка при удалении цели");
        }
    }

    hideAddGoalModal() {
        const modal = document.getElementById('add-goal-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Методы для работы с настройками
    async showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            // Загружаем текущие настройки
            const budgetAlerts = document.getElementById('setting-budget-alerts');
            const autoRecurring = document.getElementById('setting-auto-recurring');
            
            if (budgetAlerts) budgetAlerts.checked = this.settings.budgetAlerts;
            if (autoRecurring) autoRecurring.checked = this.settings.autoProcessRecurring;
            
            modal.classList.add('active');
        }
    }

    async saveSettings() {
        try {
            const budgetAlerts = document.getElementById('setting-budget-alerts');
            const autoRecurring = document.getElementById('setting-auto-recurring');
            
            this.settings.budgetAlerts = budgetAlerts ? budgetAlerts.checked : true;
            this.settings.autoProcessRecurring = autoRecurring ? autoRecurring.checked : true;
            
            await this.storage.saveSettings(this.settings);
            ToastService.success('Настройки сохранены');
            
        } catch (error) {
            console.error("❌ Error saving settings:", error);
            ToastService.error("Ошибка при сохранении настроек");
        }
    }

    async exportData() {
        try {
            const data = await this.storage.getAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            ToastService.success('Данные экспортированы');
            
        } catch (error) {
            console.error("❌ Error exporting data:", error);
            ToastService.error("Ошибка при экспорте данных");
        }
    }

    async clearAllData() {
        try {
            if (!confirm('ВНИМАНИЕ: Это удалит ВСЕ ваши данные без возможности восстановления. Продолжить?')) {
                return;
            }
            
            await this.storage.clearAllData();
            
            // Перезагружаем сервисы
            await this.expenses.load({});
            await this.incomes.load({});
            await this.debts.load({});
            await this.budgets.load({});
            await this.recurring.load({});
            await this.savingsGoals.load({});
            
            this.updateAllUI();
            ToastService.success('Все данные очищены');
            
        } catch (error) {
            console.error("❌ Error clearing data:", error);
            ToastService.error("Ошибка при очистке данных");
        }
    }

    async saveData() {
        if (!this.initialized) return;
        
        try {
            await this.storage.saveSettings(this.settings);
        } catch (error) {
            console.error('❌ Error saving data:', error);
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
                console.error("❌ Error updating time:", e);
            }
        };
        
        updateTime();
        setInterval(updateTime, 60000);
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

    // Навигация
    switchScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показываем целевой экран
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем соответствующую кнопку навигации
        const navItems = document.querySelectorAll('.nav-item');
        switch(screenName) {
            case 'overview':
                if (navItems[0]) navItems[0].classList.add('active');
                break;
            case 'operations':
                if (navItems[1]) navItems[1].classList.add('active');
                this.updateOperationsList();
                break;
            case 'goals':
                if (navItems[2]) navItems[2].classList.add('active');
                this.updateSavingsGoals();
                break;
            case 'report':
                if (navItems[3]) navItems[3].classList.add('active');
                this.updateReport();
                break;
        }
    }
}