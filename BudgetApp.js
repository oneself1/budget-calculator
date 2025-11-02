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
        this.currentEditingItem = null;
    }

    async init() {
        console.log("🚀 Starting Budget App...");
        
        try {
            // Показываем loading state
            this.showLoading(true);
            
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
            this.showError("Ошибка загрузки приложения. Попробуйте обновить страницу.");
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading-overlay');
        if (!loadingElement) {
            if (show) {
                const overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <div>Загрузка...</div>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
        } else {
            loadingElement.style.display = show ? 'flex' : 'none';
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

            console.log("✅ Data loaded successfully");
            
        } catch (error) {
            console.error("❌ Error loading data:", error);
            // Используем данные по умолчанию
            const defaultData = this.storage.getDefaultData();
            this.expenseCategories = defaultData.expenseCategories;
            this.incomeCategories = defaultData.incomeCategories;
            this.debts = defaultData.debts;
            this.savingsGoals = defaultData.savingsGoals;
            this.expenseOperations = defaultData.expenseOperations;
            this.incomeOperations = defaultData.incomes;
            this.settings = defaultData.settings;
        }
    }

    initializeUI() {
        this.updateAllUI();
        this.startClock();
        this.initializeModals();
        console.log("✅ UI initialized");
    }

    initializeModals() {
        // Закрытие модальных окон по клику на фон
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-modal')) {
                this.hideAllModals();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    hideAllModals() {
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
        this.updateClock();
    }

    // ... (остальные методы updateBalance, updateCategories и т.д. остаются похожими, но с улучшениями)

    // ОПЕРАЦИИ С УДАЛЕНИЕМ И РЕДАКТИРОВАНИЕМ
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

    createOperationsHTML(operations) {
        let html = '';
        
        operations.forEach(operation => {
            const config = this.getOperationConfig(operation.type);
            const displayAmount = Math.abs(operation.amount || 0);
            
            html += `
                <div class="operation-item" data-id="${operation.id}" data-type="${operation.type}">
                    <div class="operation-main-content">
                        <div class="operation-info">
                            <div class="operation-icon" style="background: ${config.color}">
                                ${operation.icon || config.icon}
                            </div>
                            <div class="operation-details">
                                <div class="operation-title">${operation.description}</div>
                                <div class="operation-meta">
                                    <span>${this.formatDate(operation.date)}</span>
                                    ${operation.type === 'debt' ? `<span>Остаток: ${this.settings.currency}${(operation.amount - (this.getDebtPaidAmount(operation.id) || 0)).toFixed(2)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="operation-amount ${operation.type}">
                            ${config.sign}${this.settings.currency}${displayAmount.toFixed(2)}
                        </div>
                    </div>
                    <div class="operation-actions">
                        <button class="operation-action-btn operation-edit" onclick="app.editOperation('${operation.type}', ${operation.id})">
                            ✏️
                        </button>
                        <button class="operation-action-btn operation-delete" onclick="app.deleteOperation('${operation.type}', ${operation.id})">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    getDebtPaidAmount(debtId) {
        const debt = this.debts.find(d => d.id === debtId);
        return debt ? debt.paidAmount || 0 : 0;
    }

    async deleteOperation(type, id) {
        if (!confirm('Вы уверены, что хотите удалить эту операцию?')) return;

        try {
            switch (type) {
                case 'income':
                    await this.deleteIncomeOperation(id);
                    break;
                case 'expense':
                    await this.deleteExpenseOperation(id);
                    break;
                case 'debt':
                    await this.deleteDebt(id);
                    break;
            }
            
            this.updateAllUI();
            this.showSuccess('Операция удалена');
        } catch (error) {
            console.error('❌ Error deleting operation:', error);
            this.showError('Ошибка при удалении операции');
        }
    }

    async deleteIncomeOperation(id) {
        const index = this.incomeOperations.findIndex(op => op.id === id);
        if (index !== -1) {
            this.incomeOperations.splice(index, 1);
            await this.storage.delete('incomes', id);
        }
    }

    async deleteExpenseOperation(id) {
        const index = this.expenseOperations.findIndex(op => op.id === id);
        if (index !== -1) {
            this.expenseOperations.splice(index, 1);
            await this.storage.delete('expenseOperations', id);
        }
    }

    async deleteDebt(id) {
        const index = this.debts.findIndex(debt => debt.id === id);
        if (index !== -1) {
            this.debts.splice(index, 1);
            await this.storage.delete('debts', id);
        }
    }

    editOperation(type, id) {
        this.currentEditingItem = { type, id };
        
        switch (type) {
            case 'income':
                this.showEditIncomeModal(id);
                break;
            case 'expense':
                this.showEditExpenseModal(id);
                break;
            case 'debt':
                this.showEditDebtModal(id);
                break;
        }
    }

    showEditIncomeModal(id) {
        const operation = this.incomeOperations.find(op => op.id === id);
        if (!operation) return;

        const modal = document.getElementById('edit-income-modal');
        if (!modal) {
            this.createEditIncomeModal();
            this.showEditIncomeModal(id); // Рекурсивно вызываем после создания модалки
            return;
        }

        document.getElementById('edit-income-amount').value = operation.amount;
        document.getElementById('edit-income-description').value = operation.description;
        
        modal.classList.add('active');
    }

    createEditIncomeModal() {
        const modalHTML = `
            <div class="category-modal" id="edit-income-modal">
                <div class="category-modal-content">
                    <h2 class="category-modal-title">Редактировать доход</h2>
                    <div class="form-group">
                        <label for="edit-income-amount">Сумма:</label>
                        <input type="number" id="edit-income-amount" class="modal-input" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-income-description">Описание:</label>
                        <input type="text" id="edit-income-description" class="modal-input">
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn cancel" onclick="app.hideAllModals()">Отмена</button>
                        <button class="modal-btn confirm" onclick="app.saveEditedIncome()">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async saveEditedIncome() {
        if (!this.currentEditingItem) return;

        const amount = parseFloat(document.getElementById('edit-income-amount').value);
        const description = document.getElementById('edit-income-description').value;

        if (!amount || amount <= 0) {
            this.showError('Введите корректную сумму');
            return;
        }

        try {
            const operation = this.incomeOperations.find(op => op.id === this.currentEditingItem.id);
            if (operation) {
                operation.amount = amount;
                operation.description = description;
                await this.storage.put('incomes', operation);
                
                this.hideAllModals();
                this.updateAllUI();
                this.showSuccess('Доход обновлен');
            }
        } catch (error) {
            this.showError('Ошибка при обновлении дохода');
        }
    }

    // ДОЛГИ С ПРОГРЕСС-БАРОМ И УЛУЧШЕННЫМ УПРАВЛЕНИЕМ
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
            const progress = debt.amount > 0 ? ((debt.paidAmount || 0) / debt.amount) * 100 : 0;
            
            html += `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" data-debt-id="${debt.id}">
                    <div class="circle-icon">${debt.icon || '💳'}</div>
                    <div class="circle-amount">${this.settings.currency}${remaining.toFixed(2)}</div>
                    <div class="circle-label">${debt.description || 'Долг'}</div>
                    
                    <!-- Прогресс-бар долга -->
                    <div class="debt-progress">
                        <div class="debt-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="debt-progress-text">${Math.round(progress)}%</div>
                    
                    <!-- Действия с долгом -->
                    <div class="circle-actions">
                        ${!isPaid ? `
                            <button class="circle-action-btn circle-check" onclick="app.makeDebtPayment(${debt.id})" title="Внести платеж">
                                💰
                            </button>
                        ` : ''}
                        <button class="circle-action-btn circle-delete" onclick="app.deleteDebt(${debt.id})" title="Удалить долг">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async makeDebtPayment(debtId) {
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

        // Показываем модальное окно для платежа
        const modal = document.getElementById('debt-payment-modal');
        if (!modal) {
            this.createDebtPaymentModal();
        }

        document.getElementById('debt-payment-title').textContent = `Платеж по долгу: ${debt.description}`;
        document.getElementById('debt-remaining').textContent = `Остаток: ${this.settings.currency}${remaining.toFixed(2)}`;
        document.getElementById('debt-payment-amount').value = remaining;
        document.getElementById('debt-payment-amount').max = remaining;
        
        document.getElementById('debt-payment-modal').classList.add('active');
        this.currentEditingItem = { type: 'debt', id: debtId };
    }

    createDebtPaymentModal() {
        const modalHTML = `
            <div class="category-modal" id="debt-payment-modal">
                <div class="category-modal-content">
                    <h2 class="category-modal-title" id="debt-payment-title">Внести платеж</h2>
                    <div class="debt-info" id="debt-remaining"></div>
                    <div class="form-group">
                        <label for="debt-payment-amount">Сумма платежа:</label>
                        <input type="number" id="debt-payment-amount" class="modal-input" step="0.01" min="0.01">
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn cancel" onclick="app.hideAllModals()">Отмена</button>
                        <button class="modal-btn confirm" onclick="app.processDebtPayment()">Внести платеж</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async processDebtPayment() {
        if (!this.currentEditingItem) return;

        const amount = parseFloat(document.getElementById('debt-payment-amount').value);
        const debt = this.debts.find(d => d.id === this.currentEditingItem.id);

        if (!debt || !amount || amount <= 0) {
            this.showError("Введите корректную сумму");
            return;
        }

        const remaining = debt.amount - (debt.paidAmount || 0);
        if (amount > remaining) {
            this.showError("Сумма платежа не может превышать оставшуюся сумму долга");
            return;
        }

        try {
            debt.paidAmount = (debt.paidAmount || 0) + amount;
            
            // Добавляем запись в историю платежей
            if (!debt.paymentHistory) {
                debt.paymentHistory = [];
            }
            debt.paymentHistory.push({
                date: new Date().toISOString(),
                amount: amount
            });

            await this.storage.put('debts', debt);
            
            this.hideAllModals();
            this.updateAllUI();
            
            if (debt.paidAmount >= debt.amount) {
                this.showSuccess(`Долг "${debt.description}" полностью погашен! 🎉`);
            } else {
                this.showSuccess(`Платеж ${this.settings.currency}${amount.toFixed(2)} внесен`);
            }
            
        } catch (error) {
            console.error("❌ Error making debt payment:", error);
            this.showError("Ошибка при оплате долга");
        }
    }

    // МОДАЛЬНЫЕ ОКНА ДЛЯ ЦЕЛЕЙ
    showAddGoalModal() {
        const modal = document.getElementById('add-goal-modal');
        if (!modal) {
            this.createAddGoalModal();
        }
        document.getElementById('add-goal-modal').classList.add('active');
    }

    createAddGoalModal() {
        const modalHTML = `
            <div class="category-modal" id="add-goal-modal">
                <div class="category-modal-content">
                    <h2 class="category-modal-title">Новая цель накопления</h2>
                    <div class="form-group">
                        <label for="goal-name">Название цели:</label>
                        <input type="text" id="goal-name" class="modal-input" placeholder="Например: Новый телефон">
                    </div>
                    <div class="form-group">
                        <label for="goal-target">Целевая сумма:</label>
                        <input type="number" id="goal-target" class="modal-input" placeholder="10000" min="1" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="goal-icon">Иконка:</label>
                        <input type="text" id="goal-icon" class="modal-input" value="🎯" maxlength="2">
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn cancel" onclick="app.hideAllModals()">Отмена</button>
                        <button class="modal-btn confirm" onclick="app.createNewGoal()">Создать цель</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async createNewGoal() {
        const name = document.getElementById('goal-name').value;
        const targetAmount = parseFloat(document.getElementById('goal-target').value);
        const icon = document.getElementById('goal-icon').value;

        if (!name || !targetAmount || targetAmount <= 0) {
            this.showError("Заполните все поля корректно");
            return;
        }

        try {
            const newGoal = {
                id: Date.now(),
                name: name,
                targetAmount: targetAmount,
                currentAmount: 0,
                icon: icon || '🎯',
                isCompleted: false,
                createdAt: new Date().toISOString()
            };
            
            this.savingsGoals.push(newGoal);
            await this.storage.add('savingsGoals', newGoal);
            
            this.hideAllModals();
            this.updateAllUI();
            this.showSuccess('Цель добавлена!');
            
        } catch (error) {
            console.error("❌ Error adding goal:", error);
            this.showError("Ошибка при добавлении цели");
        }
    }

    async addToGoal(goalId) {
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
        if (isNaN(amount) || amount <= 0) {
            this.showError("Введите корректную сумму");
            return;
        }

        try {
            goal.currentAmount += amount;
            if (goal.currentAmount >= goal.targetAmount) {
                goal.currentAmount = goal.targetAmount;
                goal.isCompleted = true;
                goal.completedAt = new Date().toISOString();
                this.showSuccess(`Цель "${goal.name}" достигнута! 🎉`);
            }
            
            await this.storage.put('savingsGoals', goal);
            
            this.updateAllUI();
            this.showSuccess(`Внесено ${this.settings.currency}${amount.toFixed(2)} в цель "${goal.name}"`);
            
        } catch (error) {
            console.error("❌ Error adding to goal:", error);
            this.showError("Ошибка при внесении средств в цель");
        }
    }

    // УЛУЧШЕННЫЙ ОТЧЕТ
    updateReport() {
        try {
            const totalIncome = this.getTotalIncome();
            const totalExpenses = this.getTotalExpenses();
            const totalPaidDebts = this.getTotalPaidDebts();
            const totalRemainingDebts = this.getTotalRemainingDebts();
            const balance = totalIncome - totalExpenses - totalPaidDebts;
            
            // Основные показатели
            const reportIncome = document.getElementById('report-income');
            const reportExpense = document.getElementById('report-expense');
            const reportDebt = document.getElementById('report-debt');
            const reportBalance = document.getElementById('report-balance');
            
            if (reportIncome) reportIncome.textContent = `${this.settings.currency}${totalIncome.toFixed(2)}`;
            if (reportExpense) reportExpense.textContent = `${this.settings.currency}${totalExpenses.toFixed(2)}`;
            if (reportDebt) reportDebt.textContent = `${this.settings.currency}${totalPaidDebts.toFixed(2)}`;
            if (reportBalance) reportBalance.textContent = `${this.settings.currency}${balance.toFixed(2)}`;
            
            // Детализация по категориям
            this.updateReportDetails();
            
        } catch (error) {
            console.error("❌ Error updating report:", error);
        }
    }

    getTotalRemainingDebts() {
        return this.debts.reduce((sum, debt) => {
            const remaining = debt.amount - (debt.paidAmount || 0);
            return sum + Math.max(0, remaining);
        }, 0);
    }

    updateReportDetails() {
        const container = document.getElementById('report-details');
        if (!container) return;

        let html = `
            <div class="report-details-section">
                <h4>Доходы по категориям:</h4>
                ${this.incomeCategories.map(cat => {
                    const total = this.getCategoryTotal(cat.id, 'income');
                    return total > 0 ? `
                        <div class="report-detail-item">
                            <span>${cat.icon} ${cat.name}</span>
                            <span class="income">${this.settings.currency}${total.toFixed(2)}</span>
                        </div>
                    ` : '';
                }).join('')}
            </div>

            <div class="report-details-section">
                <h4>Расходы по категориям:</h4>
                ${this.expenseCategories.map(cat => {
                    const total = this.getCategoryTotal(cat.id, 'expense');
                    return total > 0 ? `
                        <div class="report-detail-item">
                            <span>${cat.icon} ${cat.name}</span>
                            <span class="expense">${this.settings.currency}${total.toFixed(2)}</span>
                        </div>
                    ` : '';
                }).join('')}
            </div>

            <div class="report-details-section">
                <h4>Текущие долги:</h4>
                ${this.debts.map(debt => {
                    const remaining = debt.amount - (debt.paidAmount || 0);
                    return remaining > 0 ? `
                        <div class="report-detail-item">
                            <span>${debt.icon} ${debt.description}</span>
                            <span class="debt">${this.settings.currency}${remaining.toFixed(2)}</span>
                        </div>
                    ` : '';
                }).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    // БАЛАНС С УЧЕТОМ ПОГАШЕННЫХ ДОЛГОВ
    updateBalance() {
        try {
            const totalIncome = this.getTotalIncome();
            const totalExpenses = this.getTotalExpenses();
            const totalPaidDebts = this.getTotalPaidDebts();
            const balance = totalIncome - totalExpenses - totalPaidDebts;
            
            const balanceElement = document.getElementById('balance-amount');
            if (balanceElement) {
                balanceElement.textContent = `${this.settings.currency}${balance.toFixed(2)}`;
                balanceElement.className = `balance-amount ${balance >= 0 ? 'balance-positive' : 'balance-negative'}`;
            }
            
            const incomeStat = document.querySelector('.stat-income');
            const expenseStat = document.querySelector('.stat-expense');
            if (incomeStat) incomeStat.textContent = `Доходы: ${this.settings.currency}${totalIncome.toFixed(2)}`;
            if (expenseStat) expenseStat.textContent = `Расходы: ${this.settings.currency}${totalExpenses.toFixed(2)}`;
            
        } catch (error) {
            console.error("❌ Error updating balance:", error);
        }
    }

    // ОСТАЛЬНЫЕ МЕТОДЫ (startClock, formatDate, showError, showSuccess, showInfo, switchScreen)
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 60000);
    }

    updateClock() {
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

    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('onclick')?.includes(screenName)) {
                item.classList.add('active');
            }
        });
        
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

    // Очистка данных
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
