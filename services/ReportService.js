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

        return {
            expenses: expenseDetails,
            incomes: this.incomes.getAll(),
            debts: this.debts.getAll()
        };
    }
}