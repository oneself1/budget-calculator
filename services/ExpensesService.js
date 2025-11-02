class ExpensesService {
    constructor(storageService) {
        this.storage = storageService;
        this.categories = [];
        this.operations = [];
    }

    async load(data = null) {
        try {
            if (data && data.expenseCategories) {
                this.categories = data.expenseCategories;
            } else {
                this.categories = await this.storage.getAll('expenseCategories');
            }

            if (data && data.expenseOperations) {
                this.operations = data.expenseOperations;
            } else {
                this.operations = await this.storage.getAll('expenseOperations');
            }

            console.log('ExpensesService loaded:', {
                categories: this.categories.length,
                operations: this.operations.length
            });

        } catch (error) {
            console.error('Error loading expenses:', error);
            this.categories = this.storage.getDefaultExpenseCategories();
            this.operations = [];
        }
    }

    // Категории
    async addCategory(category) {
        try {
            const newCategory = {
                id: Date.now(),
                amount: 0,
                subcategories: [],
                ...category,
                date: new Date().toISOString()
            };
            
            this.categories.push(newCategory);
            await this.storage.add('expenseCategories', newCategory);
            return newCategory;
        } catch (error) {
            console.error('Error adding expense category:', error);
            throw error;
        }
    }

    async updateCategory(id, updatedCategory) {
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updatedCategory };
            await this.storage.put('expenseCategories', this.categories[index]);
            return this.categories[index];
        }
        return null;
    }

    async deleteCategory(id) {
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            // Удаляем связанные операции
            const relatedOperations = this.operations.filter(op => op.categoryId === id);
            for (const operation of relatedOperations) {
                await this.storage.delete('expenseOperations', operation.id);
            }
            
            this.operations = this.operations.filter(op => op.categoryId !== id);
            this.categories.splice(index, 1);
            await this.storage.delete('expenseCategories', id);
            return true;
        }
        return false;
    }

    getCategory(id) {
        return this.categories.find(cat => cat.id === id);
    }

    getCategories() {
        return this.categories;
    }

    // Операции
    async addOperation(operation) {
        try {
            const newOperation = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...operation
            };
            
            // Обновляем сумму в категории
            const category = this.getCategory(operation.categoryId);
            if (category) {
                category.amount = (category.amount || 0) + operation.amount;
                await this.storage.put('expenseCategories', category);
            }
            
            this.operations.push(newOperation);
            await this.storage.add('expenseOperations', newOperation);
            
            console.log('Expense operation added:', newOperation);
            return newOperation;
        } catch (error) {
            console.error('Error adding expense operation:', error);
            throw error;
        }
    }

    getOperation(id) {
        return this.operations.find(op => op.id === id);
    }

    getOperations() {
        return this.operations;
    }

    async updateOperation(operationId, updatedData) {
        const operation = this.getOperation(operationId);
        if (!operation) {
            throw new Error("Операция не найдена");
        }

        // Вычитаем старую сумму из категории
        const oldCategory = this.getCategory(operation.categoryId);
        if (oldCategory) {
            oldCategory.amount = (oldCategory.amount || 0) - operation.amount;
            await this.storage.put('expenseCategories', oldCategory);
        }

        // Обновляем операцию
        Object.assign(operation, updatedData);

        // Добавляем новую сумму в категорию
        const newCategory = this.getCategory(operation.categoryId);
        if (newCategory) {
            newCategory.amount = (newCategory.amount || 0) + operation.amount;
            await this.storage.put('expenseCategories', newCategory);
        }

        await this.storage.put('expenseOperations', operation);
        return operation;
    }

    async deleteOperation(id) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index !== -1) {
            const operation = this.operations[index];
            
            // Вычитаем сумму из категории
            const category = this.getCategory(operation.categoryId);
            if (category) {
                category.amount = (category.amount || 0) - operation.amount;
                await this.storage.put('expenseCategories', category);
            }
            
            this.operations.splice(index, 1);
            await this.storage.delete('expenseOperations', id);
            return operation;
        }
        return null;
    }

    getTotalExpenses() {
        return this.operations.reduce((sum, op) => sum + (op.amount || 0), 0);
    }

    calculateCategoryTotal(category) {
        return category.amount || 0;
    }

    toJSON() {
        return {
            categories: this.categories,
            operations: this.operations
        };
    }
}