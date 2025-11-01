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
            if (operation.type === 'expense') {
                actionButtons = `
                    <div class="operation-actions">
                        <button class="operation-action-btn operation-edit" onclick="editExpenseOperation(${operation.id})">✏️</button>
                        <button class="operation-action-btn operation-delete" onclick="deleteExpenseOperation(${operation.id})">×</button>
                    </div>
                `;
            } else if (operation.type === 'income') {
                actionButtons = `
                    <div class="operation-actions">
                        <button class="operation-action-btn operation-edit" onclick="editIncomeOperation(${operation.id})">✏️</button>
                        <button class="operation-action-btn operation-delete" onclick="deleteIncomeOperation(${operation.id})">×</button>
                    </div>
                `;
            } else if (operation.type === 'debt') {
                actionButtons = `
                    <div class="operation-actions">
                        <button class="operation-action-btn operation-edit" onclick="editDebtOperation(${operation.id})">✏️</button>
                        <button class="operation-action-btn operation-delete" onclick="deleteDebtOperation(${operation.id})">×</button>
                    </div>
                `;
            } else if (operation.type === 'debt-payment') {
                actionButtons = `
                    <div class="operation-actions">
                        <button class="operation-action-btn operation-edit" onclick="editDebtPayment(${operation.debtId}, ${operation.paymentIndex})">✏️</button>
                        <button class="operation-action-btn operation-delete" onclick="deleteDebtPayment(${operation.debtId}, ${operation.paymentIndex})">×</button>
                    </div>
                `;
            }
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
                alert("Долг уже полностью погашен!");
                return;
            }
            
            const paymentStr = prompt(
                `Введите сумму платежа по долгу "${debt.description}"\nОсталось погасить: ${this.settings.currency}${remaining.toFixed(2)}`,
                remaining.toString()
            );
            
            if (paymentStr === null) return;
            
            const payment = parseFloat(paymentStr) || 0;
            
            try {
                this.debts.makePayment(debtId, payment);
                this.saveData();
                
                if (debt.paidAmount >= debt.amount) {
                    alert("Долг полностью погашен!");
                }
            } catch (error) {
                alert("Ошибка при внесении платежа: " + error.message);
            }
        }
    }

    // Вспомогательные методы
    getTypeName(type) {
        const names = {
            income: 'дохода',
            debt: 'долга', 
            expense: 'расхода'
        };
        return names[type] || 'операции';
    }

    getDefaultDescription(type) {
        const defaults = {
            income: 'Доход',
            debt: 'Долг', 
            expense: 'Расход'
        };
        return defaults[type] || 'Операция';
    }

    // Модальные окна для расходов
    showCategorySelection() {
        const modal = document.getElementById('category-modal');
        const categoryList = document.getElementById('category-list');
        
        const categories = this.expenses.getCategories();
        if (!categories || categories.length === 0) {
            alert('Сначала добавьте категории расходов!');
            return;
        }
        
        categoryList.innerHTML = categories.map(category => {
            const totalAmount = this.expenses.calculateCategoryTotal(category);
            return `
                <button class="category-option" onclick="selectExpenseCategory(${category.id})">
                    <div class="category-option-icon">${category.icon}</div>
                    <div class="category-option-name">${category.name}</div>
                    <div class="category-option-amount">${this.settings.currency}${totalAmount}</div>
                </button>
            `;
        }).join('');
        
        modal.classList.add('active');
    }

    hideCategorySelection() {
        const modal = document.getElementById('category-modal');
        modal.classList.remove('active');
    }

    selectExpenseCategory(categoryId) {
        const category = this.expenses.getCategory(categoryId);
        if (category) {
            this.currentState.selectedCategoryId = categoryId;
            
            // Если у категории есть подкатегории, показываем их выбор
            if (category.subcategories && category.subcategories.length > 0) {
                this.showSubcategorySelection(category);
            } else {
                // Иначе сразу запрашиваем сумму для категории
                this.hideCategorySelection();
                this.addExpenseToCategory(categoryId, null);
            }
        }
    }

    showSubcategorySelection(category) {
        const modal = document.getElementById('subcategory-modal');
        const subcategoryList = document.getElementById('subcategory-list');
        const title = document.getElementById('subcategory-modal-title');
        
        title.textContent = `Выберите подкатегорию для ${category.name}`;
        
        let optionsHTML = '';
        
        // Добавляем вариант для добавления расхода в основную категорию
        optionsHTML += `
            <button class="category-option" onclick="selectSubcategory(null)">
                <div class="category-option-icon">${category.icon}</div>
                <div class="category-option-name">${category.name} (основная)</div>
                <div class="category-option-amount">${this.settings.currency}${category.amount || 0}</div>
            </button>
        `;
        
        // Добавляем подкатегории
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                optionsHTML += `
                    <button class="category-option" onclick="selectSubcategory(${subcategory.id})">
                        <div class="category-option-icon">${subcategory.icon}</div>
                        <div class="category-option-name">${subcategory.name}</div>
                        <div class="category-option-amount">${this.settings.currency}${subcategory.amount || 0}</div>
                    </button>
                `;
            });
        }
        
        subcategoryList.innerHTML = optionsHTML;
        
        // Скрываем выбор категорий и показываем выбор подкатегорий
        this.hideCategorySelection();
        modal.classList.add('active');
    }

    hideSubcategorySelection() {
        const modal = document.getElementById('subcategory-modal');
        modal.classList.remove('active');
        this.showCategorySelection(); // Возвращаемся к выбору категории
    }

    selectSubcategory(subcategoryId) {
        this.hideSubcategorySelection();
        this.addExpenseToCategory(this.currentState.selectedCategoryId, subcategoryId);
    }

    addExpenseToCategory(categoryId, subcategoryId) {
        const category = this.expenses.getCategory(categoryId);
        if (!category) return;
        
        let targetName = category.name;
        let targetIcon = category.icon;
        
        if (subcategoryId) {
            const subcategory = category.subcategories.find(s => s.id === subcategoryId);
            if (subcategory) {
                targetName = subcategory.name;
                targetIcon = subcategory.icon;
            }
        }
        
        const amountStr = prompt(`Введите сумму расхода для "${targetName}":`, "0");
        if (amountStr === null) return;
        
        const amount = parseFloat(amountStr) || 0;
        if (amount <= 0) {
            alert("Пожалуйста, введите корректную сумму (больше 0)");
            return;
        }
        
        try {
            const operation = this.expenses.addOperation({
                categoryId: category.id,
                subcategoryId: subcategoryId,
                categoryName: category.name,
                subcategoryName: subcategoryId ? targetName : null,
                amount: amount,
                description: `${category.name}${subcategoryId ? ` - ${targetName}` : ''}`,
                icon: targetIcon
            });
            
            this.saveData();
            
            alert(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен в "${targetName}"`);
        } catch (error) {
            alert("Ошибка при добавлении расхода: " + error.message);
        }
    }

    // Модальные окна редактирования категорий
    showEditCategoryModal(categoryId) {
        const category = this.expenses.getCategory(categoryId);
        if (!category) return;
        
        this.currentState.editingCategoryId = categoryId;
        
        document.getElementById('edit-category-title').textContent = `Редактировать ${category.name}`;
        document.getElementById('edit-category-name').value = category.name;
        document.getElementById('edit-category-icon').value = category.icon;
        
        this.updateSubcategoriesList();
        
        document.getElementById('edit-category-modal').classList.add('active');
    }

    hideEditCategoryModal() {
        document.getElementById('edit-category-modal').classList.remove('active');
        this.currentState.editingCategoryId = null;
    }

    updateSubcategoriesList() {
        const container = document.getElementById('subcategories-list');
        const category = this.expenses.getCategory(this.currentState.editingCategoryId);
        
        if (!category) return;
        
        if (!category.subcategories || category.subcategories.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет подкатегорий</div>';
            return;
        }
        
        container.innerHTML = category.subcategories.map(subcategory => `
            <div class="subcategory-item">
                <div class="subcategory-info">
                    <div class="category-option-icon">${subcategory.icon}</div>
                    <div class="category-option-name">${subcategory.name}</div>
                    <div class="category-option-amount">${this.settings.currency}${subcategory.amount || 0}</div>
                </div>
                <div class="subcategory-actions">
                    <button class="subcategory-action-btn subcategory-edit" onclick="editSubcategory(${subcategory.id})">✏️</button>
                    <button class="subcategory-action-btn subcategory-delete" onclick="deleteSubcategory(${subcategory.id})">×</button>
                </div>
            </div>
        `).join('');
    }

    saveCategoryChanges() {
        const category = this.expenses.getCategory(this.currentState.editingCategoryId);
        if (!category) return;
        
        const newName = document.getElementById('edit-category-name').value.trim();
        const newIcon = document.getElementById('edit-category-icon').value.trim();
        
        if (!newName) {
            alert("Введите название категории");
            return;
        }
        
        try {
            this.expenses.updateCategory(category.id, {
                name: newName,
                icon: newIcon
            });
            this.saveData();
            this.hideEditCategoryModal();
        } catch (error) {
            alert("Ошибка при сохранении: " + error.message);
        }
    }

    addNewSubcategory() {
        const category = this.expenses.getCategory(this.currentState.editingCategoryId);
        if (!category) return;
        
        try {
            this.expenses.addSubcategory(category.id, {
                name: "Новая подкатегория",
                icon: "📁"
            });
            this.updateSubcategoriesList();
        } catch (error) {
            alert("Ошибка при добавлении подкатегории: " + error.message);
        }
    }

    editSubcategory(subcategoryId) {
        const category = this.expenses.getCategory(this.currentState.editingCategoryId);
        if (!category || !category.subcategories) return;
        
        const subcategory = category.subcategories.find(s => s.id === subcategoryId);
        if (!subcategory) return;
        
        this.currentState.editingSubcategory = subcategory;
        
        document.getElementById('edit-subcategory-title').textContent = `Редактировать ${subcategory.name}`;
        document.getElementById('edit-subcategory-name').value = subcategory.name;
        document.getElementById('edit-subcategory-icon').value = subcategory.icon;
        
        this.hideEditCategoryModal();
        document.getElementById('edit-subcategory-modal').classList.add('active');
    }

    hideEditSubcategoryModal() {
        document.getElementById('edit-subcategory-modal').classList.remove('active');
        this.currentState.editingSubcategory = null;
        this.showEditCategoryModal(this.currentState.editingCategoryId);
    }

    saveSubcategoryChanges() {
        if (!this.currentState.editingSubcategory) return;
        
        const newName = document.getElementById('edit-subcategory-name').value.trim();
        const newIcon = document.getElementById('edit-subcategory-icon').value.trim();
        
        if (!newName) {
            alert("Введите название подкатегории");
            return;
        }
        
        try {
            this.expenses.updateSubcategory(
                this.currentState.editingCategoryId,
                this.currentState.editingSubcategory.id,
                {
                    name: newName,
                    icon: newIcon
                }
            );
            this.saveData();
            this.hideEditSubcategoryModal();
        } catch (error) {
            alert("Ошибка при сохранении: " + error.message);
        }
    }

    deleteSubcategory(subcategoryId) {
        if (!confirm("Удалить эту подкатегорию? Все связанные расходы будут перемещены в основную категорию.")) {
            return;
        }
        
        try {
            this.expenses.deleteSubcategory(this.currentState.editingCategoryId, subcategoryId);
            this.saveData();
            this.updateSubcategoriesList();
        } catch (error) {
            alert("Ошибка при удалении: " + error.message);
        }
    }

    // Настройки
    showSettingsModal() {
        const totalIncome = this.incomes.getTotal();
        const totalPaidDebts = this.debts.getTotalPaid();
        const totalExpenses = this.expenses.getTotalExpenses();
        const balance = totalIncome - totalPaidDebts - totalExpenses;
        
        const debugInfo = `
=== ИНФОРМАЦИЯ О ПРИЛОЖЕНИИ ===

Доходы: ${this.incomes.getAll().length} категорий
Долги: ${this.debts.getAll().length} записей
Категории расходов: ${this.expenses.getCategories().length}
Операции расходов: ${this.expenses.getOperations().length}

ОБЩАЯ СТАТИСТИКА:
- Доходы: ${this.settings.currency}${totalIncome.toFixed(2)}
- Оплаченные долги: ${this.settings.currency}${totalPaidDebts.toFixed(2)}
- Расходы: ${this.settings.currency}${totalExpenses.toFixed(2)}
- Баланс: ${this.settings.currency}${balance.toFixed(2)}
        `.trim();
        
        const userChoice = confirm(debugInfo + "\n\nНажмите OK для очистки всех данных или Отмена для закрытия");
        
        if (userChoice) {
            this.clearAllData();
        }
    }

    clearAllData() {
        if (confirm('Вы уверены? Все данные будут удалены.')) {
            this.resetToDefaults();
            alert('Все данные очищены!');
        }
    }

    // Заглушки для отсутствующих функций
    editExpenseOperation(id) {
        alert('Редактирование операции расхода - в разработке');
    }

    deleteExpenseOperation(id) {
        if (confirm('Удалить эту операцию расхода?')) {
            this.expenses.deleteOperation(id);
            this.saveData();
            this.updateOperationsList();
        }
    }

    editIncomeOperation(id) {
        alert('Редактирование операции дохода - в разработке');
    }

    deleteIncomeOperation(id) {
        if (confirm('Удалить эту операцию дохода?')) {
            this.incomes.delete(id);
            this.saveData();
            this.updateOperationsList();
        }
    }

    editDebtOperation(id) {
        alert('Редактирование операции долга - в разработке');
    }

    deleteDebtOperation(id) {
        if (confirm('Удалить эту операцию долга?')) {
            this.debts.delete(id);
            this.saveData();
            this.updateOperationsList();
        }
    }

    editDebtPayment(debtId, paymentIndex) {
        alert('Редактирование платежа по долгу - в разработке');
    }

    deleteDebtPayment(debtId, paymentIndex) {
        alert('Удаление платежа по долгу - в разработке');
    }
}