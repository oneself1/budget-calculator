class ExpensesService {
    constructor(storageService) {
        this.storage = storageService;
        this.categories = [];
        this.operations = [];
    }

    async load(data = null) {
        try {
            if (data) {
                this.categories = data.expenseCategories || [];
                this.operations = data.expenseOperations || [];
            } else {
                this.categories = await this.storage.getAll('expenseCategories');
                this.operations = await this.storage.getAll('expenseOperations');
            }
            
            await this.migrateCategories();
            this.updateCategoryAmountsFromOperations();
        } catch (error) {
            console.error('Error loading expenses:', error);
            this.categories = [];
            this.operations = [];
        }
    }

    async migrateCategories() {
        let migrated = false;
        const defaultCategories = this.getDefaultCategories();
        
        for (const defaultCategory of defaultCategories) {
            const categoryExists = this.categories.some(
                category => category.id === defaultCategory.id
            );
            
            if (!categoryExists) {
                this.categories.push({ ...defaultCategory });
                await this.storage.add('expenseCategories', defaultCategory);
                migrated = true;
            } else {
                // Обновляем существующую категорию, добавляя недостающие подкатегории
                const existingCategory = this.categories.find(c => c.id === defaultCategory.id);
                if (existingCategory && (!existingCategory.subcategories || existingCategory.subcategories.length === 0)) {
                    existingCategory.subcategories = defaultCategory.subcategories || [];
                    await this.storage.put('expenseCategories', existingCategory);
                    migrated = true;
                }
            }
        }

        return migrated;
    }

    getDefaultCategories() {
        return this.storage.getDefaultExpenseCategories();
    }

    updateCategoryAmountsFromOperations() {
        // Сбрасываем суммы всех категорий и подкатегорий
        this.categories.forEach(category => {
            category.amount = 0;
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    subcategory.amount = 0;
                });
            }
        });
        
        // Пересчитываем суммы на основе операций
        this.operations.forEach(operation => {
            this.updateCategoryAmounts(operation);
        });
    }

    updateCategoryAmounts(operation) {
        const category = this.getCategory(operation.categoryId);
        if (category) {
            if (operation.subcategoryId) {
                // Операция для подкатегории
                const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                if (subcategory) {
                    subcategory.amount = (subcategory.amount || 0) + operation.amount;
                }
            } else {
                // Операция для основной категории
                category.amount = (category.amount || 0) + operation.amount;
            }
        }
    }

    // Категории
    async addCategory(category) {
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
        // Запрещаем удаление базовых категорий (ID 1-12)
        if (id >= 1 && id <= 12) {
            throw new Error("Базовые категории нельзя удалить");
        }
        
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            // Удаляем ВСЕ связанные операции
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

    // Подкатегории
    async addSubcategory(categoryId, subcategory) {
        const category = this.getCategory(categoryId);
        if (category) {
            if (!category.subcategories) {
                category.subcategories = [];
            }
            const newSub = {
                id: Date.now(),
                amount: 0,
                ...subcategory
            };
            category.subcategories.push(newSub);
            await this.storage.put('expenseCategories', category);
            return newSub;
        }
        return null;
    }

    async updateSubcategory(categoryId, subcategoryId, updatedSubcategory) {
        const category = this.getCategory(categoryId);
        if (category && category.subcategories) {
            const index = category.subcategories.findIndex(sub => sub.id === subcategoryId);
            if (index !== -1) {
                category.subcategories[index] = { ...category.subcategories[index], ...updatedSubcategory };
                await this.storage.put('expenseCategories', category);
                return category.subcategories[index];
            }
        }
        return null;
    }

    async deleteSubcategory(categoryId, subcategoryId) {
        const category = this.getCategory(categoryId);
        if (category && category.subcategories) {
            const index = category.subcategories.findIndex(sub => sub.id === subcategoryId);
            if (index !== -1) {
                const deletedSub = category.subcategories.splice(index, 1)[0];
                
                // Удаляем операции этой подкатегории
                const relatedOperations = this.operations.filter(operation => 
                    operation.categoryId === categoryId && operation.subcategoryId === subcategoryId
                );
                
                for (const operation of relatedOperations) {
                    await this.storage.delete('expenseOperations', operation.id);
                }
                
                this.operations = this.operations.filter(operation => 
                    !(operation.categoryId === categoryId && operation.subcategoryId === subcategoryId)
                );
                
                await this.storage.put('expenseCategories', category);
                return deletedSub;
            }
        }
        return null;
    }

    // Операции
    async addOperation(operation) {
        const newOperation = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...operation
        };
        
        // Обновляем суммы в категориях
        this.updateCategoryAmounts(newOperation);
        
        this.operations.push(newOperation);
        await this.storage.add('expenseOperations', newOperation);
        return newOperation;
    }

    async updateOperation(operationId, updatedData) {
        const operation = this.getOperation(operationId);
        if (!operation) {
            throw new Error("Операция не найдена");
        }

        const oldAmount = operation.amount;
        const oldCategoryId = operation.categoryId;
        const oldSubcategoryId = operation.subcategoryId;

        // Вычитаем старую сумму из старой категории/подкатегории
        this.reverseCategoryAmounts(operation);

        // Обновляем данные операции
        Object.assign(operation, updatedData);

        // Добавляем новую сумму в новую категорию/подкатегорию
        this.updateCategoryAmounts(operation);

        await this.storage.put('expenseOperations', operation);
        return operation;
    }

    getOperation(id) {
        return this.operations.find(op => op.id === id);
    }

    getOperations() {
        return this.operations;
    }

    async deleteOperation(id) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index !== -1) {
            const operation = this.operations[index];
            // Вычитаем сумму из категории
            this.reverseCategoryAmounts(operation);
            this.operations.splice(index, 1);
            await this.storage.delete('expenseOperations', id);
            return operation;
        }
        return null;
    }

    reverseCategoryAmounts(operation) {
        const category = this.getCategory(operation.categoryId);
        if (category) {
            if (operation.subcategoryId) {
                const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                if (subcategory) {
                    subcategory.amount -= operation.amount;
                }
            } else {
                category.amount -= operation.amount;
            }
        }
    }

    getTotalExpenses() {
        let total = 0;
        this.categories.forEach(category => {
            total += category.amount || 0;
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    total += subcategory.amount || 0;
                });
            }
        });
        return total;
    }

    calculateCategoryTotal(category) {
        let total = category.amount || 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                total += subcategory.amount || 0;
            });
        }
        return total;
    }

    // Новый метод для получения операций по категории
    getOperationsByCategory(categoryId) {
        return this.operations.filter(op => op.categoryId === categoryId);
    }

    getOperationsBySubcategory(categoryId, subcategoryId) {
        return this.operations.filter(op => 
            op.categoryId === categoryId && op.subcategoryId === subcategoryId
        );
    }

    toJSON() {
        return {
            categories: this.categories,
            operations: this.operations
        };
    }
}