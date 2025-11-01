class OperationsService {
    constructor(incomesService, debtsService, expensesService) {
        this.incomes = incomesService;
        this.debts = debtsService;
        this.expenses = expensesService;
    }

    getAllOperations() {
        const operations = [];
        
        // Доходы (новый формат с категориями)
        this.incomes.getOperations().forEach(operation => {
            const category = this.incomes.getCategory(operation.categoryId);
            let description = category?.name || 'Доход';
            
            if (operation.subcategoryId && category) {
                const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                if (subcategory) {
                    description = `${category.name} - ${subcategory.name}`;
                }
            }
            
            operations.push({
                id: operation.id,
                amount: operation.amount,
                displayAmount: operation.amount,
                description: description,
                date: operation.date,
                type: 'income',
                icon: category?.icon || '💰',
                isEditable: true,
                categoryId: operation.categoryId,
                subcategoryId: operation.subcategoryId
            });
        });

        // Долги
        this.debts.getAll().forEach(debt => {
            operations.push({
                id: debt.id,
                amount: debt.amount,
                displayAmount: -debt.amount,
                description: debt.description,
                date: debt.date,
                type: 'debt',
                icon: debt.icon,
                isEditable: true
            });

            // Платежи по долгам
            if (debt.paymentHistory) {
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

        // Расходы
        this.expenses.getOperations().forEach(op => {
            operations.push({
                id: op.id,
                amount: op.amount,
                displayAmount: -op.amount,
                description: op.description,
                date: op.date,
                type: 'expense',
                icon: op.icon,
                isEditable: true,
                categoryId: op.categoryId,
                subcategoryId: op.subcategoryId
            });
        });

        return operations.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}