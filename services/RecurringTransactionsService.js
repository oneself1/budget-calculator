class RecurringTransactionsService {
    constructor(storageService, expensesService, incomesService) {
        this.storage = storageService;
        this.expenses = expensesService;
        this.incomes = incomesService;
        this.recurringTransactions = [];
    }

    async load(data = null) {
        try {
            if (data?.recurringTransactions) {
                this.recurringTransactions = data.recurringTransactions;
            } else {
                this.recurringTransactions = await this.storage.getAll('recurringTransactions');
            }
        } catch (error) {
            console.error('Error loading recurring transactions:', error);
            this.recurringTransactions = [];
        }
    }

    async addRecurringTransaction(transaction) {
        const newTransaction = {
            id: Date.now(),
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            categoryId: transaction.categoryId,
            subcategoryId: transaction.subcategoryId || null,
            recurrence: transaction.recurrence,
            nextDate: this.calculateNextDate(transaction.recurrence),
            icon: transaction.icon || '🔄',
            createdAt: new Date().toISOString(),
            isActive: true
        };

        this.recurringTransactions.push(newTransaction);
        await this.storage.add('recurringTransactions', newTransaction);
        return newTransaction;
    }

    calculateNextDate(recurrence, fromDate = new Date()) {
        const date = new Date(fromDate);
        switch (recurrence) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                break;
        }
        return date.toISOString();
    }

    async processRecurringTransactions() {
        const now = new Date();
        const processed = [];
        
        for (const transaction of this.recurringTransactions) {
            if (!transaction.isActive) continue;
            
            if (new Date(transaction.nextDate) <= now) {
                try {
                    await this.createTransaction(transaction);
                    
                    transaction.nextDate = this.calculateNextDate(
                        transaction.recurrence, 
                        new Date(transaction.nextDate)
                    );
                    
                    await this.storage.put('recurringTransactions', transaction);
                    processed.push(transaction);
                } catch (error) {
                    console.error('Error processing recurring transaction:', error);
                }
            }
        }
        
        return processed;
    }

    async createTransaction(transaction) {
        const operationData = {
            amount: transaction.amount,
            description: `${transaction.description} (авто)`,
            categoryId: transaction.categoryId,
            subcategoryId: transaction.subcategoryId,
            icon: transaction.icon,
            date: new Date().toISOString()
        };

        if (transaction.type === 'expense') {
            await this.expenses.addOperation(operationData);
        } else {
            await this.incomes.addOperation(operationData);
        }
        
        return operationData;
    }

    getRecurringTransactions() {
        return this.recurringTransactions.filter(t => t.isActive);
    }

    getRecurringTransaction(id) {
        return this.recurringTransactions.find(t => t.id === id);
    }

    async updateRecurringTransaction(id, updates) {
        const index = this.recurringTransactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.recurringTransactions[index] = {
                ...this.recurringTransactions[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.storage.put('recurringTransactions', this.recurringTransactions[index]);
            return this.recurringTransactions[index];
        }
        return null;
    }

    async deleteRecurringTransaction(id) {
        const index = this.recurringTransactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.recurringTransactions.splice(index, 1);
            await this.storage.delete('recurringTransactions', id);
            return true;
        }
        return false;
    }

    async toggleTransactionActive(id) {
        const transaction = this.getRecurringTransaction(id);
        if (transaction) {
            transaction.isActive = !transaction.isActive;
            await this.storage.put('recurringTransactions', transaction);
            return transaction;
        }
        return null;
    }

    getRecurrenceText(recurrence) {
        const texts = {
            'daily': 'Ежедневно',
            'weekly': 'Еженедельно',
            'monthly': 'Ежемесячно',
            'yearly': 'Ежегодно'
        };
        return texts[recurrence] || recurrence;
    }

    toJSON() {
        return this.recurringTransactions;
    }
}