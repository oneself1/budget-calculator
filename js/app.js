// Simple Toast fallback
if (typeof Toast === 'undefined') {
    var Toast = {
        show: function(message, type = 'info') {
            console.log(`${type}: ${message}`);
            alert(message);
        },
        success: function(message) { this.show(message, 'success'); },
        error: function(message) { this.show(message, 'error'); },
        warning: function(message) { this.show(message, 'warning'); },
        info: function(message) { this.show(message, 'info'); }
    };
}

class FinanceApp {
    constructor() {
        this.db = new Database();
        this.settings = {};
        this.categories = { income: [], expense: [] };
        this.transactions = [];
        this.debts = [];
        this.goals = [];
        this.currentModal = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing Finance App...');
            
            if (this.isInitialized) {
                console.log('⚠️ App already initialized');
                return;
            }

            // Initialize database first
            await this.db.init();
            
            // Load all data
            await this.loadData();
            
            // Initialize UI
            this.initUI();
            
            // Start clock
            this.startClock();
            
            this.isInitialized = true;
            console.log('✅ Finance App initialized successfully');
            Toast.success('Приложение загружено');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            Toast.error('Ошибка загрузки приложения: ' + error.message);
            this.showFallbackUI();
        }
    }

    async loadData() {
        try {
            console.log('📥 Loading data...');
            
            // Load settings first
            this.settings = await this.db.getSettings();
            console.log('Settings loaded:', this.settings);
            
            // Load categories
            this.categories.income = await this.db.getCategoriesByType('income');
            this.categories.expense = await this.db.getCategoriesByType('expense');
            console.log('Categories loaded - income:', this.categories.income.length, 'expense:', this.categories.expense.length);
            
            // Load transactions
            this.transactions = await this.db.getAll('transactions');
            console.log('Transactions loaded:', this.transactions.length);
            
            // Load debts
            this.debts = await this.db.getAll('debts');
            console.log('Debts loaded:', this.debts.length);
            
            // Load goals
            this.goals = await this.db.getAll('goals');
            console.log('Goals loaded:', this.goals.length);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw new Error('Не удалось загрузить данные: ' + error.message);
        }
    }

    initUI() {
        this.updateBalance();
        this.updateCategories();
        this.updateRecentTransactions();
        this.updateGoals();
        this.initModals();
    }

    showFallbackUI() {
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            mainScreen.innerHTML = `
                <div style="padding: 40px 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">😕</div>
                    <h2 style="margin-bottom: 12px; color: #DC3545;">Ошибка загрузки</h2>
                    <p style="margin-bottom: 20px; color: #666;">Не удалось загрузить приложение. Пожалуйста, обновите страницу.</p>
                    <button onclick="location.reload()" class="btn primary" style="margin: 0 auto;">Обновить страницу</button>
                </div>
            `;
        }
    }

    // Balance and Statistics
    updateBalance() {
        try {
            const totalIncome = this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpense = this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalPaidDebts = this.debts
                .reduce((sum, debt) => sum + (debt.paidAmount || 0), 0);
                
            const balance = totalIncome - totalExpense - totalPaidDebts;

            // Update UI
            const currency = this.settings.currency || '₽';
            document.getElementById('balance-amount').textContent = 
                `${currency}${balance.toFixed(2)}`;
            document.getElementById('total-income').textContent = 
                `${currency}${totalIncome.toFixed(2)}`;
            document.getElementById('total-expense').textContent = 
                `${currency}${totalExpense.toFixed(2)}`;
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }

    // Categories Management
    updateCategories() {
        this.updateCategorySection('income');
        this.updateCategorySection('expense');
    }

    updateCategorySection(type) {
        const container = document.getElementById(`${type}-categories`);
        const categories = this.categories[type];
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет категорий</div>';
            return;
        }

        let html = '';
        categories.forEach(category => {
            const total = this.getCategoryTotal(category.id, type);
            html += `
                <div class="category-card" onclick="app.showAddTransactionModal('${type}', ${category.id})">
                    <div class="category-icon">${category.icon || '📁'}</div>
                    <div class="category-name">${category.name}</div>
                    ${total > 0 ? `<div class="category-amount">${this.settings.currency}${total.toFixed(2)}</div>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    getCategoryTotal(categoryId, type) {
        return this.transactions
            .filter(t => t.type === type && t.categoryId === categoryId)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    // Transactions Management
    updateRecentTransactions() {
        this.renderTransactionsList('recent-transactions', this.transactions.slice(0, 5));
        this.renderTransactionsList('all-transactions', this.transactions);
    }

    renderTransactionsList(containerId, transactions) {
        const container = document.getElementById(containerId);
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <div>Нет операций</div>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );

        let html = '';
        sortedTransactions.forEach(transaction => {
            const category = this.categories[transaction.type]?.find(c => c.id === transaction.categoryId);
            const config = this.getTransactionConfig(transaction.type);
            const amount = transaction.amount || 0;
            const description = transaction.description || 'Без описания';
            const date = transaction.date || transaction.createdAt;
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-icon ${transaction.type}" style="background: ${config.color}">
                        ${category?.icon || config.icon}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${description}</div>
                        <div class="transaction-meta">
                            ${this.formatDate(date)}
                            ${category ? ` • ${category.name}` : ''}
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${config.sign}${this.settings.currency}${amount.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    getTransactionConfig(type) {
        const configs = {
            income: { icon: '💰', color: '#28A745', sign: '+' },
            expense: { icon: '🛒', color: '#DC3545', sign: '-' },
            debt: { icon: '💳', color: '#FFC107', sign: '-' }
        };
        return configs[type] || configs.expense;
    }

    // Goals Management
    updateGoals() {
        const container = document.getElementById('goals-list');
        
        if (!this.goals || this.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🎯</div>
                    <div>Нет целей накоплений</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #8E8E93;">
                        Добавьте первую цель
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        this.goals.forEach(goal => {
            const currentAmount = goal.currentAmount || 0;
            const targetAmount = goal.targetAmount || 1;
            const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
            const isCompleted = goal.isCompleted || currentAmount >= targetAmount;
            
            html += `
                <div class="goal-card" onclick="app.addToGoal(${goal.id})">
                    <div class="goal-header">
                        <div class="goal-icon">${goal.icon || '🎯'}</div>
                        <div class="goal-info">
                            <div class="goal-name">${goal.name}</div>
                            <div class="goal-amount">
                                ${this.settings.currency}${currentAmount.toFixed(2)} / ${this.settings.currency}${targetAmount.toFixed(2)}
                            </div>
                        </div>
                        <div class="goal-progress">${Math.round(progress)}%</div>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    ${isCompleted ? '<div style="color: var(--success); font-size: 12px; text-align: center;">🎉 Цель достигнута!</div>' : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Modal Management
    initModals() {
        // Close modal when clicking overlay
        document.getElementById('modal-overlay').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.hideModal();
            }
        });
    }

    showModal(modalId) {
        this.hideModal(); // Hide any existing modal
        
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modal-overlay');
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            this.currentModal = modalId;
            
            // Initialize modal-specific content
            this.initModalContent(modalId);
        }
    }

    hideModal() {
        if (this.currentModal) {
            const modal = document.getElementById(this.currentModal);
            const overlay = document.getElementById('modal-overlay');
            
            if (modal) modal.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            
            this.currentModal = null;
        }
    }

    initModalContent(modalId) {
        switch (modalId) {
            case 'add-income-modal':
                this.populateCategorySelect('income-category-select', 'income');
                break;
            case 'add-expense-modal':
                this.populateCategorySelect('expense-category-select', 'expense');
                break;
        }
    }

    // Screen Navigation
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update active nav button
        const navBtn = document.querySelector(`[onclick="app.showScreen('${screenId}')"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }
        
        // Update screen-specific content
        this.updateScreenContent(screenId);
    }

    updateScreenContent(screenId) {
        switch (screenId) {
            case 'transactions-screen':
                this.updateRecentTransactions();
                break;
            case 'goals-screen':
                this.updateGoals();
                break;
            case 'reports-screen':
                this.updateReports();
                break;
        }
    }

    // Transaction Modals
    showAddIncomeModal() {
        this.showModal('add-income-modal');
    }

    showAddExpenseModal() {
        this.showModal('add-expense-modal');
    }

    populateCategorySelect(selectId, type) {
        const select = document.getElementById(selectId);
        const categories = this.categories[type];
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.icon || '📁'} ${category.name}`;
                select.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Нет категорий';
            option.disabled = true;
            select.appendChild(option);
        }
    }

    // Data Operations
    async addIncome() {
        try {
            const amount = parseFloat(document.getElementById('income-amount').value);
            const description = document.getElementById('income-description').value;
            const categoryId = parseInt(document.getElementById('income-category-select').value);

            if (!amount || amount <= 0 || !categoryId) {
                Toast.error('Заполните все обязательные поля');
                return;
            }

            const transaction = {
                type: 'income',
                amount: amount,
                description: description || 'Доход',
                categoryId: categoryId,
                date: new Date().toISOString()
            };

            await this.db.add('transactions', transaction);
            this.transactions.push(transaction);
            
            this.updateBalance();
            this.updateRecentTransactions();
            this.hideModal();
            
            Toast.success(`Доход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
            // Clear form
            document.getElementById('income-amount').value = '';
            document.getElementById('income-description').value = '';
            
        } catch (error) {
            console.error('Error adding income:', error);
            Toast.error('Ошибка при добавлении дохода: ' + error.message);
        }
    }

    async addExpense() {
        try {
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const description = document.getElementById('expense-description').value;
            const categoryId = parseInt(document.getElementById('expense-category-select').value);

            if (!amount || amount <= 0 || !categoryId) {
                Toast.error('Заполните все обязательные поля');
                return;
            }

            const transaction = {
                type: 'expense',
                amount: amount,
                description: description || 'Расход',
                categoryId: categoryId,
                date: new Date().toISOString()
            };

            await this.db.add('transactions', transaction);
            this.transactions.push(transaction);
            
            this.updateBalance();
            this.updateRecentTransactions();
            this.hideModal();
            
            Toast.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен`);
            
            // Clear form
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-description').value = '';
            
        } catch (error) {
            console.error('Error adding expense:', error);
            Toast.error('Ошибка при добавлении расхода: ' + error.message);
        }
    }

    async addDebt() {
        try {
            const amount = parseFloat(document.getElementById('debt-amount').value);
            const description = document.getElementById('debt-description').value;
            const icon = document.getElementById('debt-icon').value;

            if (!amount || amount <= 0) {
                Toast.error('Введите корректную сумму');
                return;
            }

            const debt = {
                amount: amount,
                description: description || 'Долг',
                icon: icon || '💳',
                paidAmount: 0,
                date: new Date().toISOString()
            };

            await this.db.add('debts', debt);
            this.debts.push(debt);
            
            this.updateBalance();
            this.hideModal();
            
            Toast.success('Долг добавлен');
            
        } catch (error) {
            console.error('Error adding debt:', error);
            Toast.error('Ошибка при добавлении долга: ' + error.message);
        }
    }

    async addGoal() {
        try {
            const name = document.getElementById('goal-name').value;
            const target = parseFloat(document.getElementById('goal-target').value);
            const icon = document.getElementById('goal-icon').value;

            if (!name || !target || target <= 0) {
                Toast.error('Заполните все поля корректно');
                return;
            }

            const goal = {
                name: name,
                targetAmount: target,
                currentAmount: 0,
                icon: icon || '🎯',
                isCompleted: false,
                createdAt: new Date().toISOString()
            };

            await this.db.add('goals', goal);
            this.goals.push(goal);
            
            this.updateGoals();
            this.hideModal();
            
            Toast.success('Цель добавлена');
            
        } catch (error) {
            console.error('Error adding goal:', error);
            Toast.error('Ошибка при добавлении цели: ' + error.message);
        }
    }

    async addCategory() {
        try {
            const name = document.getElementById('category-name').value;
            const icon = document.getElementById('category-icon').value;
            const type = document.getElementById('category-type').value;

            if (!name) {
                Toast.error('Введите название категории');
                return;
            }

            const category = {
                name: name,
                icon: icon || '📁',
                type: type
            };

            await this.db.add('categories', category);
            this.categories[type].push(category);
            
            this.updateCategories();
            this.hideModal();
            
            Toast.success('Категория добавлена');
            
        } catch (error) {
            console.error('Error adding category:', error);
            Toast.error('Ошибка при добавлении категории: ' + error.message);
        }
    }

    // Other Methods
    showAddCategoryModal(type) {
        this.showModal('add-category-modal');
        if (type) {
            document.getElementById('category-type').value = type;
        }
    }

    showAddDebtModal() {
        this.showModal('add-debt-modal');
    }

    showAddGoalModal() {
        this.showModal('add-goal-modal');
    }

    showSettings() {
        this.showModal('settings-modal');
        
        // Load current settings
        document.getElementById('budget-alerts').checked = this.settings.budgetAlerts !== false;
        document.getElementById('auto-recurring').checked = this.settings.autoProcessRecurring !== false;
        document.getElementById('currency').value = this.settings.currency || '₽';
    }

    async saveSettings() {
        try {
            this.settings.budgetAlerts = document.getElementById('budget-alerts').checked;
            this.settings.autoProcessRecurring = document.getElementById('auto-recurring').checked;
            this.settings.currency = document.getElementById('currency').value;

            await this.db.saveSettings(this.settings);
            this.hideModal();
            
            this.updateBalance();
            this.updateRecentTransactions();
            this.updateGoals();
            
            Toast.success('Настройки сохранены');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            Toast.error('Ошибка при сохранении настроек: ' + error.message);
        }
    }

    async addToGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        if (goal.isCompleted) {
            Toast.info('Цель уже достигнута!');
            return;
        }

        const amount = parseFloat(prompt(
            `Введите сумму для цели "${goal.name}"\nТекущий прогресс: ${this.settings.currency}${(goal.currentAmount || 0).toFixed(2)} / ${this.settings.currency}${(goal.targetAmount || 0).toFixed(2)}`,
            '0'
        ));

        if (!amount || amount <= 0) return;

        goal.currentAmount = (goal.currentAmount || 0) + amount;
        if (goal.currentAmount >= goal.targetAmount) {
            goal.currentAmount = goal.targetAmount;
            goal.isCompleted = true;
            goal.completedAt = new Date().toISOString();
            Toast.success(`Цель "${goal.name}" достигнута! 🎉`);
        }

        await this.db.put('goals', goal);
        this.updateGoals();
        Toast.success(`Внесено ${this.settings.currency}${amount.toFixed(2)} в цель`);
    }

    async clearData() {
        if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
            try {
                await this.db.clearAllData();
                await this.loadData();
                this.initUI();
                Toast.success('Все данные очищены');
            } catch (error) {
                console.error('Error clearing data:', error);
                Toast.error('Ошибка при очистке данных: ' + error.message);
            }
        }
    }

    async exportData() {
        try {
            const data = await this.db.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Toast.success('Данные экспортированы');
        } catch (error) {
            console.error('Error exporting data:', error);
            Toast.error('Ошибка при экспорте данных: ' + error.message);
        }
    }

    // Utility Methods
    startClock() {
        const updateTime = () => {
            const now = new Date();
            document.getElementById('current-time').textContent = 
                now.getHours().toString().padStart(2, '0') + ':' + 
                now.getMinutes().toString().padStart(2, '0');
            document.getElementById('current-date').textContent = 
                now.getDate().toString().padStart(2, '0') + '.' + 
                (now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                now.getFullYear();
        };
        
        updateTime();
        setInterval(updateTime, 60000);
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            return 'неизвестно';
        }
    }

    updateReports() {
        const container = document.getElementById('reports-content');
        
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        const balance = totalIncome - totalExpense;

        container.innerHTML = `
            <div style="padding: 16px;">
                <div class="balance-card" style="margin: 0 0 16px 0;">
                    <div class="balance-amount">${this.settings.currency}${balance.toFixed(2)}</div>
                    <div class="balance-label">Общий баланс</div>
                </div>
                
                <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <h3 style="margin-bottom: 12px;">Статистика</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="text-align: center; padding: 12px; background: #E8F5E8; border-radius: 8px;">
                            <div style="font-size: 14px; color: #666;">Доходы</div>
                            <div style="font-size: 18px; font-weight: bold; color: #28A745;">${this.settings.currency}${totalIncome.toFixed(2)}</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: #FFE8E8; border-radius: 8px;">
                            <div style="font-size: 14px; color: #666;">Расходы</div>
                            <div style="font-size: 18px; font-weight: bold; color: #DC3545;">${this.settings.currency}${totalExpense.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: white; border-radius: 12px; padding: 16px;">
                    <h3 style="margin-bottom: 12px;">Последние операции</h3>
                    <div id="reports-transactions"></div>
                </div>
            </div>
        `;

        this.renderTransactionsList('reports-transactions', this.transactions.slice(0, 10));
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new FinanceApp();
    await app.init();
    window.app = app; // Make app globally available
    console.log('🎉 App initialized and ready!');
});
