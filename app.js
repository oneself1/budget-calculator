class BudgetApp {
    constructor() {
        this.storage = new StorageService();
        this.incomes = new IncomesService(this.storage);
        this.debts = new DebtsService(this.storage);
        this.expenses = new ExpensesService(this.storage);
        this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
        this.reports = new ReportService(this.incomes, this.debts, this.expenses);
        
        this.settings = { currency: "₽" };
        this.currentState = {
            editingCategoryId: null,
            editingSubcategory: null,
            selectedCategoryId: null
        };
    }

    init() {
        console.log("Budget App: Initializing...");
        try {
            this.loadData();
            this.updateUI();
            this.startClock();
            console.log("Budget App: Initialized successfully");
        } catch (error) {
            console.error("Budget App: Initialization error:", error);
            this.resetToDefaults();
        }
    }

    loadData() {
        const data = this.storage.load();
        if (data) {
            this.incomes.load(data);
            this.debts.load(data);
            this.expenses.load(data);
            this.settings = data.settings || this.settings;
        } else {
            this.resetToDefaults();
        }
    }

    saveData() {
        const data = {
            incomes: this.incomes.getAll(),
            debts: this.debts.getAll(),
            expenseCategories: this.expenses.getCategories(),
            expenseOperations: this.expenses.getOperations(),
            settings: this.settings
        };
        if (this.storage.save(data)) {
            this.updateUI();
        } else {
            alert("Ошибка сохранения данных");
        }
    }

    resetToDefaults() {
        // Создаем новые экземпляры сервисов для сброса
        this.incomes = new IncomesService(this.storage);
        this.debts = new DebtsService(this.storage);
        this.expenses = new ExpensesService(this.storage);
        this.operations = new OperationsService(this.incomes, this.debts, this.expenses);
        this.reports = new ReportService(this.incomes, this.debts, this.expenses);
        
        this.settings = { currency: "₽" };
        this.saveData();
    }

    // UI методы
    updateUI() {
        this.updateCircles();
        this.updateBalance();
        this.updateReport();
    }

    updateCircles() {
        this.updateIncomeCategories();
        this.updateDebtCategories();
        this.updateExpenseCategories();
    }

    updateIncomeCategories() {
        const container = document.getElementById('income-circles');
        if (!container) return;
        
        const incomes = this.incomes.getAll();
        if (!incomes || incomes.length === 0) {
            container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
            return;
        }
        
        container.innerHTML = incomes.map(income => {
            const showAmount = income.amount > 0;
            const icon = income.icon || '💰';
            
            return `
                <div class="circle-item circle-income" onclick="editIncomeCategory(${income.id})">
                    <div class="circle-actions">
                        <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${income.id})">×</button>
                    </div>
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${income.amount}</div>` : ''}
                    <div class="circle-label">${income.name}</div>
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
            const remainingAmount = (debt.amount || 0) - (debt.paidAmount || 0);
            const isPaid = remainingAmount <= 0;
            const progressPercent = debt.amount > 0 ? ((debt.paidAmount || 0) / debt.amount * 100) : 0;
            const icon = debt.icon || '💳';
            
            return `
                <div class="circle-item circle-debt ${isPaid ? 'paid' : ''}" onclick="editCircle('debt', ${debt.id})">
                    <div class="circle-actions">
                        <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteCircle('debt', ${debt.id})">×</button>
                        ${!isPaid ? `<button class="circle-action-btn circle-check" onclick="event.stopPropagation(); makeDebtPayment(${debt.id})">✓</button>` : ''}
                    </div>
                    <div class="circle-icon">${icon}</div>
                    <div class="circle-amount">${this.settings.currency}${remainingAmount.toFixed(2)}</div>
                    <div class="circle-label">${debt.description}</div>
                    ${!isPaid ? `<div class="debt-progress">
                        <div class="debt-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>` : ''}
                </div>
            `;
        }).join('');
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
            const showAmount = category.amount > 0;
            const icon = category.icon || '🛒';
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            
            const deleteButton = `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>`;
            
            return `
                <div class="circle-item circle-expense" onclick="editExpenseCategory(${category.id})">
                    <div class="circle-actions">${deleteButton}</div>
                    <div class="circle-icon">${icon}</div>
                    ${showAmount ? `<div class="circle-amount">${this.settings.currency}${category.amount}</div>` : ''}
                    <div class="circle-label">${category.name} ${hasSubcategories ? '📁' : ''}</div>
                </div>
            `;
        }).join('');
    }

    updateBalance() {
        const report = this.reports.generateReport();
        const balanceElement = document.getElementById('balance-amount');
        if (balanceElement) {
            balanceElement.textContent = this.settings.currency + report.balance.toFixed(2);
        }
    }

    updateReport() {
        const report = this.reports.generateReport();
        
        const reportIncome = document.getElementById('report-income');
        const reportExpense = document.getElementById('report-expense');
        const reportDebt = document.getElementById('report-debt');
        const reportBalance = document.getElementById('report-balance');
        
        if (reportIncome) reportIncome.textContent = this.settings.currency + report.totalIncome.toFixed(2);
        if (reportExpense) reportExpense.textContent = this.settings.currency + report.totalExpenses.toFixed(2);
        if (reportDebt) reportDebt.textContent = this.settings.currency + report.totalPaidDebts.toFixed(2);
        if (reportBalance) reportBalance.textContent = this.settings.currency + report.balance.toFixed(2);
        
        const reportDetails = document.getElementById('report-details');
        if (reportDetails) {
            reportDetails.innerHTML = `
                <div class="result-item">
                    <span>Общий доход:</span>
                    <span class="income">${this.settings.currency}${report.totalIncome.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span>Оплаченные долги:</span>
                    <span class="debt">${this.settings.currency}${report.totalPaidDebts.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span>Общие расходы:</span>
                    <span class="expense">${this.settings.currency}${report.totalExpenses.toFixed(2)}</span>
                </div>
                <div class="result-item total">
                    <span>Итоговый баланс:</span>
                    <span class="${report.balance >= 0 ? 'balance-positive' : 'balance-negative'}">${this.settings.currency}${Math.abs(report.balance).toFixed(2)}</span>
                </div>
            `;
        }
    }

    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) return;
        
        const operations = this.operations.getAllOperations();
        
        if (operations.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет операций</div>';
            return;
        }
        
        // Группируем операции по типу
        const incomeOperations = operations.filter(op => op.type === 'income');
        const expenseOperations = operations.filter(op => op.type === 'expense');
        const debtOperations = operations.filter(op => op.type === 'debt' || op.type === 'debt-payment');
        
        let operationsHTML = '';
        
        if (incomeOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">Доходы</div>
                    ${incomeOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        if (expenseOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">Расходы</div>
                    ${expenseOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        if (debtOperations.length > 0) {
            operationsHTML += `
                <div class="operations-group">
                    <div class="operations-group-title">Долги</div>
                    ${debtOperations.map(operation => this.createOperationHTML(operation)).join('')}
                </div>
            `;
        }
        
        container.innerHTML = operationsHTML;
    }

    createOperationHTML(operation) {
        let typeClass = operation.type;
        let typeIcon, typeColor;
        let amountSign = '';
        let displayAmount = Math.abs(operation.displayAmount);
        
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
        if (operation.isEditable) {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="event.stopPropagation(); ${this.getEditFunctionName(operation)}">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="event.stopPropagation(); ${this.getDeleteFunctionName(operation)}">×</button>
                </div>
            `;
        }
        
        return `
            <div class="operation-item">
                <div class="operation-info">
                    <div class="operation-icon" style="background: ${typeColor}">
                        ${typeIcon}
                    </div>
                    <div class="operation-details">
                        <div class="operation-title">${operation.description}</div>
                        <div class="operation-meta">
                            <span>${this.formatDate(operation.date)}</span>
                            <span class="operation-time">${this.formatTime(operation.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="operation-amount ${typeClass}">
                    ${amountSign}${this.settings.currency}${displayAmount.toFixed(2)}
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
        }
    }

    // Добавление новых записей
    addNewIncomeCategory() {
        const categoryName = prompt('Введите название категории доходов:');
        if (!categoryName) return;
        
        const amountStr = prompt(`Введите сумму для категории "${categoryName}":`, "0");
        if (amountStr === null) return;
        
        const amount = parseFloat(amountStr) || 0;
        if (amount < 0) {
            alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
            return;
        }
        
        const icon = prompt('Введите смайлик (иконку) для категории (например: 💰, 💵, 💳):', '💰') || '💰';
        
        try {
            this.incomes.add({
                name: categoryName,
                amount: amount,
                icon: icon
            });
            this.saveData();
        } catch (error) {
            alert("Ошибка при добавлении дохода: " + error.message);
        }
    }

    addNewCircle(type) {
        const amountStr = prompt(`Введите сумму ${this.getTypeName(type)}:`, "0");
        if (amountStr === null) return;
        
        const amount = parseFloat(amountStr) || 0;
        if (amount < 0) {
            alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
            return;
        }
        
        const description = prompt('Введите описание:') || this.getDefaultDescription(type);
        
        let defaultIcon = '💰';
        if (type === 'debt') defaultIcon = '💳';
        
        const icon = prompt('Введите смайлик (иконку):', defaultIcon) || defaultIcon;
        
        try {
            if (type === 'debt') {
                this.debts.add({
                    amount: amount,
                    description: description,
                    icon: icon
                });
                this.saveData();
            }
        } catch (error) {
            alert("Ошибка при добавлении: " + error.message);
        }
    }

    addNewExpenseCategory() {
        const categoryName = prompt('Введите название категории расходов:');
        if (!categoryName) return;
        
        const icon = prompt('Введите смайлик (иконку) для категории (например: 🍔, 🚗, 🎮):', '🛒') || '🛒';
        
        try {
            this.expenses.addCategory({
                name: categoryName,
                icon: icon
            });
            this.saveData();
        } catch (error) {
            alert("Ошибка при добавлении категории: " + error.message);
        }
    }

    // Редактирование
    editIncomeCategory(categoryId) {
        const category = this.incomes.get(categoryId);
        if (category) {
            const newName = prompt('Изменить название категории:', category.name);
            if (newName) {
                category.name = newName;
            }
            
            const newAmountStr = prompt('Изменить сумму:', category.amount);
            if (newAmountStr !== null) {
                const newAmount = parseFloat(newAmountStr) || 0;
                if (newAmount >= 0) {
                    category.amount = newAmount;
                } else {
                    alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
                }
            }
            
            const newIcon = prompt('Изменить иконку (смайлик):', category.icon);
            if (newIcon) {
                category.icon = newIcon;
            }
            
            this.saveData();
        }
    }

    editExpenseCategory(categoryId) {
        this.showEditCategoryModal(categoryId);
    }

    editCircle(type, id) {
        if (type === 'debt') {
            const debt = this.debts.get(id);
            if (debt) {
                const newAmountStr = prompt('Изменить общую сумму долга:', debt.amount);
                if (newAmountStr !== null) {
                    const newAmount = parseFloat(newAmountStr) || 0;
                    if (newAmount >= 0) {
                        if (newAmount < debt.paidAmount) {
                            debt.paidAmount = newAmount;
                        }
                        debt.amount = newAmount;
                    } else {
                        alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
                        return;
                    }
                }
                
                const newDescription = prompt('Изменить описание:', debt.description) || debt.description;
                debt.description = newDescription;
                
                const newIcon = prompt('Изменить иконку (смайлик):', debt.icon) || debt.icon;
                debt.icon = newIcon;
                
                this.saveData();
            }
        }
    }

    // Удаление
    deleteIncomeCategory(categoryId) {
        if (confirm('Удалить эту категорию доходов?')) {
            this.incomes.delete(categoryId);
            this.saveData();
        }
    }

    deleteCircle(type, id) {
        if (confirm('Удалить эту запись?')) {
            if (type === 'debt') {
                this.debts.delete(id);
                this.saveData();
            }
        }
    }

    deleteExpenseCategory(categoryId) {
        if (confirm('Удалить эту категорию?')) {
            this.expenses.deleteCategory(categoryId);
            this.saveData();
        }
    }

    // Долги - платежи
    makeDebtPayment(debtId) {
        const debt = this.debts.get(debtId);
        if (debt) {
            const remaining = debt.amount - (debt.paidAmount || 0);
            
            if (remaining <= 0) {
                alert("Долг уже полностью п