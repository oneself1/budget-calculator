class BudgetApp {
    constructor() {
        this.storage = new IndexedDBService();
        this.settings = {
            currency: "₽",
            budgetAlerts: true,
            autoProcessRecurring: true
        };
        
        this.expenseCategories = [];
        this.incomeCategories = [];
        this.debts = [];
        this.savingsGoals = [];
        this.expenseOperations = [];
        this.incomeOperations = [];

        this.initialized = false;
    }

    async init() {
        console.log("🚀 Starting Budget App...");
        
        try {
            // Инициализация хранилища
            await this.storage.init();
            await this.storage.ensureBasicData();
            
            // Загрузка данных
            await this.loadData();
            
            // Инициализация UI
            this.initializeUI();
            
            this.initialized = true;
            console.log("✅ Budget App initialized successfully");
            
        } catch (error) {
            console.error("❌ Budget App initialization failed:", error);
            this.showError("Ошибка загрузки приложения");
        }
    }

    async loadData() {
        try {
            const data = await this.storage.getAllData();
            console.log("📊 Loaded data:", data);

            this.expenseCategories = data.expenseCategories || [];
            this.incomeCategories = data.incomeCategories || [];
            this.debts = data.debts || [];
            this.savingsGoals = data.savingsGoals || [];
            this.expenseOperations = data.expenseOperations || [];
            this.incomeOperations = data.incomes || [];

            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
            }

        } catch (error) {
            console.error("❌ Error loading data:", error);
            // Используем данные по умолчанию
            const defaultData = this.storage.getDefaultData();
            Object.assign(this, defaultData);
        }
    }

    initializeUI() {
        this.updateAllUI();
        this.startClock();
        console.log("✅ UI initialized");
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
            const totalIncome = this.getTotalIncome();
            const totalExpenses = this.getTotalExpenses();
            const totalPaidDebts = this.getTotalPaidDebts();
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

    getTotalIncome() {
        return this.incomeOperations.reduce((sum, op) => sum + (op.amount || 0), 0);
    }

    getTotalExpenses() {
        return this.expenseOperations.reduce((sum, op) => sum + (op.amount || 0), 0);
    }

    getTotalPaidDebts() {
        return this.debts.reduce((sum, debt) => sum + (debt.paidAmount || 0), 0);
    }

    updateCategories() {
        this.updateExpenseCategories();
        this.updateIncomeCategories();
        this.updateDebtCategories();
    }

    updateExpenseCategories() {
        const container = document.getElementById('expense-circles');
        if (!container) return;
        
        if (this.expenseCategories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        this.expenseCategories.forEach(category => {
            const categoryTotal = this.getCategoryTotal(category.id, 'expense');
            const showAmount = categoryTotal > 0;
            
            html += `
                <div class="circle-item circle-expense" onclick="app.addExpenseToCategory(${category.id})">
                    <div class="circle-icon">${category.icon || '🛒'}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${categoryTotal.toFixed(2)}</div>` : ''}
                    <div class="circle-label">${category.name}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateIncomeCategories() {
        const container = document.getElementById('income-circles');
        if (!container) return;
        
        if (this.incomeCategories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        this.incomeCategories.forEach(category => {
            const categoryTotal = this.getCategoryTotal(category.id, 'income');
            const showAmount = categoryTotal > 0;
            
            html += `
                <div class="circle-item circle-income" onclick="app.addIncomeToCategory(${category.id})">
                    <div class="circle-icon">${category.icon || '💰'}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${categoryTotal.toFixed(2)}</div>` : ''}
                    <div class="circle-label">${category.name}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateDebtCategories() {
        const container = document.getElementById('debt-circles');
        if (!container) return;
        
        if (this.debts.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        let html = '';
        this.debts.forEach(debt => {
            const remaining = debt.amount - (debt.paidAmount || 0);
            const isPaid = remaining <= 0;
            
            html += `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" onclick="app.makeDebtPayment(${debt.id})">
                    <div class="circle-icon">${debt.icon || '💳'}</div>
                    <div class="circle-amount">${this.settings.currency}${remaining.toFixed(2)}</div>
                    <div class="circle-label">${debt.description || 'Долг'}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    getCategoryTotal(categoryId, type) {
        if (type === 'expense') {
            return this.expenseOperations
                .filter(op => op.categoryId === categoryId)
                .reduce((sum, op) => sum + (op.amount || 0), 0);
        } else {
            return this.incomeOperations
                .filter(op => op.categoryId === categoryId)
                .reduce((sum, op) => sum + (op.amount || 0), 0);
        }
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) return;
        
        const allOperations = this.getAllOperations();
        
        if (allOperations.length === 0) {
            container.innerHTML = this.createEmptyOperationsState();
            return;
        }
        
        container.innerHTML = this.createOperationsHTML(allOperations);
    }

    getAllOperations() {
        const operations = [];
        
        // Доходы
        this.incomeOperations.forEach(op => {
            const category = this.incomeCategories.find(c => c.id === op.categoryId);
            operations.push({
                id: op.id,
                type: 'income',
                amount: op.amount,
                description: op.description || (category ? category.name : 'Доход'),
                date: op.date,
                icon: category ? category.icon : '💰'
            });
        });
        
        // Расходы
        this.expenseOperations.forEach(op => {
            const category = this.expenseCategories.find(c => c.id === op.categoryId);
            operations.push({
                id: op.id,
                type: 'expense',
                amount: op.amount,
                description: op.description || (category ? category.name : 'Расход'),
                date: op.date,
                icon: category ? category.icon : '🛒'
            });
        });
        
        // Долги
        this.debts.forEach(debt => {
            operations.push({
                id: debt.id,
                type: 'debt',
                amount: debt.amount,
                description: debt.description || 'Долг',
                date: debt.date,
                icon: debt.icon || '💳'
            });
        });
        
        // Сортируем по дате (новые сверху)
        return operations.sort((a, b) => new Date(b.date) - new Date(a.date));
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
            const config = this.getOperationConfig(operation.type);
            const displayAmount = Math.abs(operation.amount || 0);
            
            html += `
                <div class="operation-item">
                    <div class="operation-main-content">
                        <div class="operation-info">
                            <div class="operation-icon" style="background: ${config.color}">
                                ${operation.icon || config.icon}
                            </div>
                            <div class="operation-details">
                                <div class="operation-title">${operation.description}</div>
                                <div class="operation-meta">
                                    <span>${this.formatDate(operation.date)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="operation-amount ${operation.type}">
                            ${config.sign}${this.settings.currency}${displayAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    getOperationConfig(type) {
        const configs = {
            income: { icon: '💰', color: '#34C759', sign: '+' },
            expense: { icon: '🛒', color: '#FF3B30', sign: '-' },
            debt: { icon: '💳', color: '#FF9500', sign: '-' }
        };
        return configs[type] || configs.expense;
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        if (!container) return;
        
        if (this.savingsGoals.length === 0) {
            container.innerHTML = this.createEmptySavingsGoalsState();
            return;
        }
        
        let html = '';
        this.savingsGoals.forEach(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            
            html += `
                <div class="savings-goal-card ${goal.isCompleted ? 'completed' : ''}" onclick="app.addToGoal(${goal.id})">
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
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
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

    updateReport() {
        try {
            const totalIncome = this.getTotalIncome();
            const totalExpenses = this.getTotalExpenses();
            const totalPaidDebts = this.getTotalPaidDebts();
            const balance = totalIncome - totalExpenses - totalPaidDebts;
            
            const reportIncome = document.getElementById('report-income');
            const reportExpense = document.getElementById('report-expense');
            const reportDebt = document.getElementById('report-debt');
            const reportBalance = document.getElementById('report-balance');
            
            if (reportIncome) reportIncome.textContent = `${this.settings.currency}${totalIncome.toFixed(2)}`;
            if (reportExpense) reportExpense.textContent = `${this.settings.currency}${totalExpenses.toFixed(2)}`;
            if (reportDebt) reportDebt.textContent = `${this.settings.currency}${totalPaidDebts.toFixed(2)}`;
            if (reportBalance) reportBalance.textContent = `${this.settings.currency}${balance.toFixed(2)}`;
            
        } catch (error) {
            console.error("❌ Error updating report:", error);
        }
    }

    // Основные методы для работы с данными
    async addIncomeToCategory(categoryId) {
        try {
            const category = this.incomeCategories.find(c => c.id === categoryId);
            if (!category) {
                this.showError("Категория не найдена");
                return;
            }
            
            const amountStr = prompt(`Введите сумму дохода для "${category.name}":`, "0");
            if (!amountStr) return;
            
            const amount = parseFloat(amountStr);
            if (!amount || amount <= 0) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            const description = prompt('Введите описание:', `Доход: ${category.name}`) || `Доход: ${category.name}`;
            
            const newOperation = {
                id: Date.now(),
                categoryId: category.id,
                amount: amount,
                description: description,
                date: new Date().toISOString()
            };
            
            this.incomeOperations.push(newOperation);
            await this.storage.add('incomes', newOperation);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            console.error("❌ Error adding income:", error);
            this.showError("Ошибка при добавлении дохода");
        }
    }

    async addExpenseToCategory(categoryId) {
        try {
            const category = this.expenseCategories.find(c => c.id === categoryId);
            if (!category) {
                this.showError("Категория не найдена");
                return;
            }
            
            const amountStr = prompt(`Введите сумму расхода для "${category.name}":`, "0");
            if (!amountStr) return;
            
            const amount = parseFloat(amountStr);
            if (!amount || amount <= 0) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            const description = prompt('Введите описание:', `Расход: ${category.name}`) || `Расход: ${category.name}`;
            
            const newOperation = {
                id: Date.now(),
                categoryId: category.id,
                amount: amount,
                description: description,
                date: new Date().toISOString()
            };
            
            this.expenseOperations.push(newOperation);
            await this.storage.add('expenseOperations', newOperation);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
        } catch (error) {
            console.error("❌ Error adding expense:", error);
            this.showError("Ошибка при добавлении расхода");
        }
    }

    async addNewIncomeCategory() {
        try {
            const name = prompt('Введите название категории доходов:');
            if (!name) return;
            
            const icon = prompt('Введите иконку:', '💰') || '💰';
            
            const newCategory = {
                id: Date.now(),
                name: name,
                icon: icon,
                amount: 0
            };
            
            this.incomeCategories.push(newCategory);
            await this.storage.add('incomeCategories', newCategory);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess('Категория доходов добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding income category:", error);
            this.showError("Ошибка при добавлении категории");
        }
    }

    async addNewExpenseCategory() {
        try {
            const name = prompt('Введите название категории расходов:');
            if (!name) return;
            
            const icon = prompt('Введите иконку:', '🛒') || '🛒';
            
            const newCategory = {
                id: Date.now(),
                name: name,
                icon: icon,
                amount: 0
            };
            
            this.expenseCategories.push(newCategory);
            await this.storage.add('expenseCategories', newCategory);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess('Категория расходов добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding expense category:", error);
            this.showError("Ошибка при добавлении категории");
        }
    }

    async addNewDebt() {
        try {
            const amountStr = prompt('Введите сумму долга:', "0");
            if (!amountStr) return;
            
            const amount = parseFloat(amountStr);
            if (!amount || amount <= 0) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            const description = prompt('Введите описание:', 'Долг') || 'Долг';
            const icon = prompt('Введите иконку:', '💳') || '💳';
            
            const newDebt = {
                id: Date.now(),
                amount: amount,
                description: description,
                icon: icon,
                paidAmount: 0,
                date: new Date().toISOString()
            };
            
            this.debts.push(newDebt);
            await this.storage.add('debts', newDebt);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess('Долг добавлен!');
            
        } catch (error) {
            console.error("❌ Error adding debt:", error);
            this.showError("Ошибка при добавлении долга");
        }
    }

    async makeDebtPayment(debtId) {
        try {
            const debt = this.debts.find(d => d.id === debtId);
            if (!debt) {
                this.showError("Долг не найден");
                return;
            }
            
            const remaining = debt.amount - (debt.paidAmount || 0);
            if (remaining <= 0) {
                this.showInfo("Долг уже погашен");
                return;
            }
            
            const amountStr = prompt(`Введите сумму платежа (осталось: ${this.settings.currency}${remaining}):`, remaining.toString());
            if (!amountStr) return;
            
            const amount = parseFloat(amountStr);
            if (!amount || amount <= 0 || amount > remaining) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            debt.paidAmount = (debt.paidAmount || 0) + amount;
            await this.storage.put('debts', debt);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess(`Платеж ${this.settings.currency}${amount.toFixed(2)} внесен`);
            
        } catch (error) {
            console.error("❌ Error making debt payment:", error);
            this.showError("Ошибка при оплате долга");
        }
    }

    async saveData() {
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

    showError(message) {
        ToastService.error(message);
    }

    showSuccess(message) {
        ToastService.success(message);
    }

    showInfo(message) {
        ToastService.info(message);
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
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('onclick')?.includes(screenName)) {
                item.classList.add('active');
            }
        });
        
        // Обновляем контент экрана
        this.updateScreenContent(screenName);
    }

    updateScreenContent(screenName) {
        switch (screenName) {
            case 'operations':
                this.updateOperationsList();
                break;
            case 'goals':
                this.updateSavingsGoals();
                break;
            case 'report':
                this.updateReport();
                break;
        }
    }

    // Новые методы для работы с целями
    async showAddGoalModal() {
        try {
            const name = prompt('Введите название цели:');
            if (!name) return;
            
            const targetStr = prompt('Введите целевую сумму:', '1000');
            if (!targetStr) return;
            
            const targetAmount = parseFloat(targetStr);
            if (!targetAmount || targetAmount <= 0) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            const icon = prompt('Введите иконку:', '🎯') || '🎯';
            
            const newGoal = {
                id: Date.now(),
                name: name,
                targetAmount: targetAmount,
                currentAmount: 0,
                icon: icon,
                isCompleted: false,
                date: new Date().toISOString()
            };
            
            this.savingsGoals.push(newGoal);
            await this.storage.add('savingsGoals', newGoal);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess('Цель добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding goal:", error);
            this.showError("Ошибка при добавлении цели");
        }
    }

    async addToGoal(goalId) {
        try {
            const goal = this.savingsGoals.find(g => g.id === goalId);
            if (!goal) {
                this.showError("Цель не найдена");
                return;
            }
            
            if (goal.isCompleted) {
                this.showInfo("Цель уже достигнута");
                return;
            }
            
            const amountStr = prompt(`Введите сумму для цели "${goal.name}" (текущий прогресс: ${this.settings.currency}${goal.currentAmount.toFixed(2)} / ${this.settings.currency}${goal.targetAmount.toFixed(2)}):`, "0");
            if (!amountStr) return;
            
            const amount = parseFloat(amountStr);
            if (!amount || amount <= 0) {
                this.showError("Введите корректную сумму");
                return;
            }
            
            goal.currentAmount += amount;
            if (goal.currentAmount >= goal.targetAmount) {
                goal.currentAmount = goal.targetAmount;
                goal.isCompleted = true;
                this.showSuccess(`Цель "${goal.name}" достигнута! 🎉`);
            }
            
            await this.storage.put('savingsGoals', goal);
            
            await this.saveData();
            this.updateAllUI();
            this.showSuccess(`Внесено ${this.settings.currency}${amount.toFixed(2)} в цель "${goal.name}"`);
            
        } catch (error) {
            console.error("❌ Error adding to goal:", error);
            this.showError("Ошибка при внесении средств в цель");
        }
    }

    // Метод для очистки всех данных
    async clearAllData() {
        try {
            if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
                await this.storage.clearAllData();
                
                // Сбрасываем локальные данные
                const defaultData = this.storage.getDefaultData();
                this.expenseCategories = defaultData.expenseCategories;
                this.incomeCategories = defaultData.incomeCategories;
                this.debts = [];
                this.savingsGoals = [];
                this.expenseOperations = [];
                this.incomeOperations = [];
                
                this.updateAllUI();
                this.showSuccess('Все данные очищены');
            }
        } catch (error) {
            console.error("❌ Error clearing data:", error);
            this.showError("Ошибка при очистке данных");
        }
    }
}
