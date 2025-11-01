class ReportService {
    constructor(incomesService, debtsService, expensesService) {
        this.incomes = incomesService;
        this.debts = debtsService;
        this.expenses = expensesService;
    }

    generateReport() {
        const totalIncome = this.incomes.getTotal();
        const totalPaidDebts = this.debts.getTotalPaid();
        const totalExpenses = this.expenses.getTotalExpenses();
        const balance = totalIncome - totalPaidDebts - totalExpenses;

        return {
            totalIncome,
            totalPaidDebts,
            totalExpenses,
            balance,
            details: this.getDetailedReport()
        };
    }

    getDetailedReport() {
        const expenseDetails = this.expenses.getCategories().map(cat => ({
            name: cat.name,
            amount: this.expenses.calculateCategoryTotal(cat),
            subcategories: cat.subcategories?.map(sub => ({
                name: sub.name,
                amount: sub.amount
            })) || []
        }));

        const incomeDetails = this.incomes.getCategories().map(cat => ({
            name: cat.name,
            amount: this.incomes.calculateCategoryTotal(cat),
            subcategories: cat.subcategories?.map(sub => ({
                name: sub.name,
                amount: sub.amount
            })) || []
        }));

        return {
            expenses: expenseDetails,
            incomes: incomeDetails,
            debts: this.debts.getAll()
        };
    }

    // Новый метод для получения отчета по бюджетам
    getBudgetReport() {
        const expenseCategories = this.expenses.getCategories();
        const budgetReport = [];
        
        expenseCategories.forEach(category => {
            const totalSpent = this.expenses.calculateCategoryTotal(category);
            budgetReport.push({
                categoryId: category.id,
                categoryName: category.name,
                totalSpent,
                budgetStatus: 'no-budget' // По умолчанию
            });
        });
        
        return budgetReport;
    }

    // Метод для получения статистики за период
    getPeriodReport(startDate, endDate) {
        const operations = this.getAllOperationsInPeriod(startDate, endDate);
        
        const income = operations
            .filter(op => op.type === 'income')
            .reduce((sum, op) => sum + op.amount, 0);
            
        const expenses = operations
            .filter(op => op.type === 'expense')
            .reduce((sum, op) => sum + op.amount, 0);
            
        const debtPayments = operations
            .filter(op => op.type === 'debt-payment')
            .reduce((sum, op) => sum + op.amount, 0);

        return {
            period: `${startDate} - ${endDate}`,
            income,
            expenses,
            debtPayments,
            balance: income - expenses - debtPayments,
            operationsCount: operations.length
        };
    }

    getAllOperationsInPeriod(startDate, endDate) {
        // Этот метод должен быть реализован в OperationsService
        // Возвращаем пустой массив для совместимости
        return [];
    }
}