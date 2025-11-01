class OperationsService {
    constructor(incomesService, debtsService, expensesService) {
        this.incomes = incomesService;
        this.debts = debtsService;
        this.expenses = expensesService;
    }

    getAllOperations() {
        const operations = [];
        
        // Доходы (новый формат с категориями)
        const incomeOperations = this.incomes.getOperations();
        if (incomeOperations && incomeOperations.length > 0) {
            incomeOperations.forEach(operation => {
                const category = this.incomes.getCategory(operation.categoryId);
                let description = category?.name || 'Доход';
                let icon = category?.icon || '💰';
                
                if (operation.subcategoryId && category) {
                    const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                    if (subcategory) {
                        description = `${category.name} - ${subcategory.name}`;
                        icon = subcategory.icon || icon;
                    }
                }
                
                operations.push({
                    id: operation.id,
                    amount: operation.amount,
                    displayAmount: operation.amount,
                    description: description,
                    date: operation.date,
                    type: 'income',
                    icon: icon,
                    isEditable: true,
                    categoryId: operation.categoryId,
                    subcategoryId: operation.subcategoryId
                });
            });
        }

        // Долги
        const debts = this.debts.getAll();
        if (debts && debts.length > 0) {
            debts.forEach(debt => {
                operations.push({
                    id: debt.id,
                    amount: debt.amount,
                    displayAmount: -debt.amount,
                    description: debt.description,
                    date: debt.date,
                    type: 'debt',
                    icon: debt.icon || '💳',
                    isEditable: true
                });

                // Платежи по долгам
                if (debt.paymentHistory && debt.paymentHistory.length > 0) {
                    debt.paymentHistory.forEach((payment, index) => {
                        operations.push({
                            id: debt.id + '_payment_' + index,
                            amount: payment.amount,
                            displayAmount: payment.amount,
                            description: `Погашение: ${debt.description}`,
                            date: payment.date,
                            type: 'debt-payment',
                            icon: '✅',
                            isEditable: true,
                            debtId: debt.id,
                            paymentIndex: index
                        });
                    });
                }
            });
        }

        // Расходы
        const expenseOperations = this.expenses.getOperations();
        if (expenseOperations && expenseOperations.length > 0) {
            expenseOperations.forEach(op => {
                const category = this.expenses.getCategory(op.categoryId);
                let description = op.description || category?.name || 'Расход';
                let icon = op.icon || category?.icon || '🛒';
                
                if (op.subcategoryId && category) {
                    const subcategory = category.subcategories?.find(s => s.id === op.subcategoryId);
                    if (subcategory) {
                        description = `${category.name} - ${subcategory.name}`;
                        icon = subcategory.icon || icon;
                    }
                }
                
                operations.push({
                    id: op.id,
                    amount: op.amount,
                    displayAmount: -op.amount,
                    description: description,
                    date: op.date,
                    type: 'expense',
                    icon: icon,
                    isEditable: true,
                    categoryId: op.categoryId,
                    subcategoryId: op.subcategoryId
                });
            });
        }

        // Сортируем по дате (новые сверху)
        return operations.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Методы для получения операций по типам
    getIncomeOperations() {
        return this.getAllOperations().filter(op => op.type === 'income');
    }

    getExpenseOperations() {
        return this.getAllOperations().filter(op => op.type === 'expense');
    }

    getDebtOperations() {
        return this.getAllOperations().filter(op => op.type === 'debt' || op.type === 'debt-payment');
    }

    // Поиск операции по ID
    getOperationById(id) {
        return this.getAllOperations().find(op => op.id === id);
    }

    // Получение операций за определенный период
    getOperationsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.getAllOperations().filter(op => {
            const opDate = new Date(op.date);
            return opDate >= start && opDate <= end;
        });
    }

    // Получение операций по категории
    getOperationsByCategory(categoryId, type = 'expense') {
        return this.getAllOperations().filter(op => 
            op.type === type && op.categoryId === categoryId
        );
    }

    // Статистика по операциям
    getOperationsStats() {
        const operations = this.getAllOperations();
        const totalIncome = operations
            .filter(op => op.type === 'income')
            .reduce((sum, op) => sum + op.amount, 0);
            
        const totalExpenses = operations
            .filter(op => op.type === 'expense')
            .reduce((sum, op) => sum + op.amount, 0);
            
        const totalDebts = operations
            .filter(op => op.type === 'debt')
            .reduce((sum, op) => sum + op.amount, 0);
            
        const totalDebtPayments = operations
            .filter(op => op.type === 'debt-payment')
            .reduce((sum, op) => sum + op.amount, 0);

        return {
            totalOperations: operations.length,
            totalIncome,
            totalExpenses,
            totalDebts,
            totalDebtPayments,
            balance: totalIncome - totalExpenses - totalDebtPayments
        };
    }
}