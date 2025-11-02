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
            console.log("📊 Loaded data:", data);
            
            // Загружаем данные в сервисы
            await this.expenses.load(data);
            await this.incomes.load(data);
            await this.debts.load(data);
            
            // Настройки
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Инициализируем с пустыми данными
            await this.expenses.load({});
            await this.incomes.load({});
            await this.debts.load({});
        }
    }

    initializeUI() {
        this.updateAllUI();
        this.startClock();
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
            
            console.log("💰 Balance update:", { totalIncome, totalExpenses, totalPaidDebts, balance });
            
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
        console.log("📦 Expense categories:", categories);
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            const totalAmount = this.expenses.calculateCategoryTotal(category);
            const showAmount = totalAmount > 0;
            const icon = category.icon || '🛒';
            
            html += `
                <div class="circle-item circle-expense" onclick="addExpenseToCategory(${category.id})">
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${totalAmount}</div>` : ''}
                    <div class="circle-label">${category.name}</div>
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
        console.log("💰 Income categories:", categories);
        
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
        console.log("💳 Debts:", debts);
        
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
                    <div class="circle-icon">${icon}</div>
                    <div class="circle-amount">${this.settings.currency}${remaining}</div>
                    <div class="circle-label">${debt.description}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) {
            console.log("❌ Operations list container not found");
            return;
        }
        
        const operations = this.operations.getAllOperations();
        console.log("📝 Operations:", operations);
        
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
        
        operations.forEach(operation => {
            let typeClass = operation.type;
            let typeIcon, typeColor;
            let amountSign = '';
            let displayAmount = Math.abs(operation.amount || 0);
            
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
            
            html += `
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
                                </div>
                            </div>
                        </div>
                        <div class="operation-amount ${typeClass}">
                            ${amountSign}${this.settings.currency}${displayAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        if (!container) {
            console.log("❌ Savings goals container not found");
            return;
        }
        
        const goals = this.savingsGoals.getGoals();
        console.log("🎯 Savings goals:", goals);
        
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
        
        let html = '';
        goals.forEach(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            
            html += `
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
                        <div class="goal-progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    
                    ${!goal.isCompleted ? `
                        <div class="goal-actions">
                            <button class="add-to-goal-btn" onclick="addToGoal(${goal.id})">
                                + Добавить
                            </button>
                        </div>
                    ` : `
                        <div class="goal-completed">
                            🎉 Цель достигнута!
                        </div>
                    `}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateReport() {
        try {
            const report = this.reports.generateReport();
            
            const reportIncome = document.getElementById('report-income');
            const reportExpense = document.getElementById('report-expense');
            const reportDebt = document.getElementById('report-debt');
            const reportBalance = document.getElementById('report-balance');
            
            if (reportIncome) reportIncome.textContent = `${this.settings.currency}${report.totalIncome.toFixed(2)}`;
            if (reportExpense) reportExpense.textContent = `${this.settings.currency}${report.totalExpenses.toFixed(2)}`;
            if (reportDebt) reportDebt.textContent = `${this.settings.currency}${report.totalPaidDebts.toFixed(2)}`;
            if (reportBalance) reportBalance.textContent = `${this.settings.currency}${report.balance.toFixed(2)}`;
            
        } catch (error) {
            console.error("❌ Error updating report:", error);
        }
    }

    // Методы для добавления операций
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

    async saveData() {
        if (!this.initialized) return;
        
        try {
            await this.storage.saveSettings(this.settings);
            console.log("💾 Data saved successfully");
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