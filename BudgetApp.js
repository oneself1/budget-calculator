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
            console.log("Loaded data:", data); // Отладочная информация
            
            if (data) {
                // Загружаем данные в правильном порядке
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
            } else {
                console.log("No data found, resetting to defaults");
                await this.resetToDefaults();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            await this.resetToDefaults();
        }
    }

    // Упрощенный метод для операций (без виртуализации)
    updateOperationsList() {
        const container = document.getElementById('operations-list');
        if (!container) {
            console.log("Operations container not found");
            return;
        }
        
        const operations = this.operations.getAllOperations();
        console.log("Found operations:", operations); // Отладочная информация
        
        if (operations.length === 0) {
            container.innerHTML = this.createEmptyOperationsState();
            return;
        }
        
        container.innerHTML = this.createOperationsHTML(operations);
    }

    createOperationsHTML(operations) {
        // Группировка операций по типам
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
            ToastService.success(`Расход ${this.settings.currency}${amount.toFixed(2)} добавлен в "${targetName}"`);
        } catch (error) {
            console.error("Error adding expense:", error);
            ToastService.error("Ошибка при добавлении расхода: " + error.message);
        }
    }

    // Остальные методы остаются без изменений...
    // ... (все остальные методы из предыдущей версии)
}

// Вспомогательные классы (упрощенные)
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