class BudgetService {
    constructor(expensesService, storageService) {
        this.expenses = expensesService;
        this.storage = storageService;
        this.budgets = new Map();
        this.cache = new Map();
    }

    async load(data = null) {
        try {
            if (data?.budgets) {
                this.budgets = new Map(data.budgets.map(b => [b.categoryId, b]));
            } else {
                const saved = await this.storage.getAll('budgets');
                this.budgets = new Map(saved.map(b => [b.categoryId, b]));
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.budgets = new Map();
        }
    }

    async setCategoryBudget(categoryId, monthlyLimit, period = 'monthly') {
        const budget = {
            categoryId,
            monthlyLimit,
            period,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.budgets.set(categoryId, budget);
        await this.storage.put('budgets', budget);
        this.cache.delete(`budget_${categoryId}`);
        return budget;
    }

    getCategoryBudget(categoryId) {
        return this.budgets.get(categoryId);
    }

    getRemainingBudget(categoryId) {
        const cacheKey = `remaining_${categoryId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const budget = this.budgets.get(categoryId);
        if (!budt) {
            this.cache.set(cacheKey, null);
            return null;
        }
        
        const category = this.expenses.getCategory(categoryId);
        const spent = this.expenses.calculateCategoryTotal(category);
        const remaining = Math.max(0, budget.monthlyLimit - spent);
        
        this.cache.set(cacheKey, remaining);
        return remaining;
    }

    getBudgetUsagePercent(categoryId) {
        const budget = this.budgets.get(categoryId);
        if (!budget) return 0;
        
        const category = this.expenses.getCategory(categoryId);
        const spent = this.expenses.calculateCategoryTotal(category);
        const usage = (spent / budget.monthlyLimit) * 100;
        return Math.min(usage, 100);
    }

    getBudgetStatus(categoryId) {
        const usage = this.getBudgetUsagePercent(categoryId);
        if (usage >= 100) return 'exceeded';
        if (usage >= 80) return 'warning';
        return 'normal';
    }

    checkBudgetAlerts() {
        const alerts = [];
        for (const [categoryId, budget] of this.budgets) {
            const status = this.getBudgetStatus(categoryId);
            const category = this.expenses.getCategory(categoryId);
            
            if (status === 'warning') {
                alerts.push({
                    type: 'budget_warning',
                    categoryId,
                    categoryName: category.name,
                    usage: this.getBudgetUsagePercent(categoryId),
                    message: `Бюджет категории "${category.name}" почти исчерпан (${Math.round(this.getBudgetUsagePercent(categoryId))}%)`
                });
            } else if (status === 'exceeded') {
                alerts.push({
                    type: 'budget_exceeded',
                    categoryId,
                    categoryName: category.name,
                    usage: this.getBudgetUsagePercent(categoryId),
                    message: `Бюджет категории "${category.name}" превышен!`
                });
            }
        }
        return alerts;
    }

    getAllBudgets() {
        return Array.from(this.budgets.values());
    }

    async deleteBudget(categoryId) {
        this.budgets.delete(categoryId);
        this.cache.delete(`budget_${categoryId}`);
        this.cache.delete(`remaining_${categoryId}`);
        await this.storage.delete('budgets', categoryId);
    }

    clearCache() {
        this.cache.clear();
    }

    toJSON() {
        return this.getAllBudgets();
    }
}