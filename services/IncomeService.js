class IncomesService {
    constructor(storageService) {
        this.storage = storageService;
        this.incomes = [];
    }

    load(data) {
        this.incomes = data?.incomes || [];
    }

    add(income) {
        const newIncome = {
            id: Date.now(),
            ...income,
            date: new Date().toISOString()
        };
        this.incomes.push(newIncome);
        return newIncome;
    }

    update(id, updatedIncome) {
        const index = this.incomes.findIndex(inc => inc.id === id);
        if (index !== -1) {
            this.incomes[index] = { ...this.incomes[index], ...updatedIncome };
            return this.incomes[index];
        }
        return null;
    }

    delete(id) {
        const index = this.incomes.findIndex(inc => inc.id === id);
        if (index !== -1) {
            return this.incomes.splice(index, 1)[0];
        }
        return null;
    }

    get(id) {
        return this.incomes.find(inc => inc.id === id);
    }

    getAll() {
        return this.incomes;
    }

    getTotal() {
        return this.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
}