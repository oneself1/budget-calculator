class StructuredIncomesService {
    constructor(storageService) {
        this.storage = storageService;
        this.categories = [];
        this.operations = [];
    }

    async load(data = null) {
        try {
            if (data) {
                this.categories = data.incomeCategories || [];
                this.operations = data.incomes || [];
            } else {
                this.categories = await this.storage.getAll('incomeCategories');
                this.operations = await this.storage.getAll('incomes');
            }
            
            // Если нет категорий, создаем начальные
            if (this.categories.length === 0) {
                this.categories = [
                    { 
                        id: 1, 
                        name: "Зарплата", 
                        amount: 0, 
                        icon: "💰",
                        subcategories: [
                            { id: 101, name: "Основная зарплата", icon: "💵", amount: 0 },
                            { id: 102, name: "Премия", icon: "🎁", amount: 0 },
                            { id: 103, name: "Аванс", icon: "📅", amount: 0 }
                        ]
                    },
                    { 
                        id: 2, 
                        name: "Стипендия", 
                        amount: 0, 
                        icon: "🎓",
                        subcategories: [
                            { id: 201, name: "Академическая", icon: "📚", amount: 0 },
                            { id: 202, name: "Социальная", icon: "❤️", amount: 0 }
                        ]
                    }
                ];
                
                // Сохраняем начальные категории
                for (const category of this.categories) {
                    await this.storage.add('incomeCategories', category);
                }
            }
            
            this.updateCategoryAmountsFromOperations();
        } catch (error) {
            console.error('Error loading incomes:', error);
        }
    }

    updateCategoryAmountsFromOperations() {
        // Сбрасываем суммы
        this.categories.forEach(category => {
            category.amount = 0;
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    subcategory.amount = 0;
                });
            }
        });
        
        // Пересчитываем на основе операций
        this.operations.forEach(operation => {
            this.updateCategoryAmounts(operation);
        });
    }

    updateCategoryAmounts(operation) {
        const category = this.getCategory(operation.categoryId);
        if (category) {
            if (operation.subcategoryId) {
                const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                if (subcategory) {
                    subcategory.amount = (subcategory.amount || 0) + operation.amount;
                }
            } else {
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
            ...category
        };
        
        this.categories.push(newCategory);
        await this.storage.add('incomeCategories', newCategory);
        return newCategory;
    }

    async updateCategory(id, updatedCategory) {
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updatedCategory };
            await this.storage.put('incomeCategories', this.categories[index]);
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
                await this.storage.delete('incomes', operation.id);
            }
            
            this.operations = this.operations.filter(op => op.categoryId !== id);
            this.categories.splice(index, 1);
            await this.storage.delete('incomeCategories', id);
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
            await this.storage.put('incomeCategories', category);
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
                await this.storage.put('incomeCategories', category);
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
                    await this.storage.delete('incomes', operation.id);
                }
                
                this.operations = this.operations.filter(operation => 
                    !(operation.categoryId === categoryId && operation.subcategoryId === subcategoryId)
                );
                
                await this.storage.put('incomeCategories', category);
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
        
        this.updateCategoryAmounts(newOperation);
        this.operations.push(newOperation);
        await this.storage.add('incomes', newOperation);
        return newOperation;
    }

    getOperation(id) {
        return this.operations.find(op => op.id === id);
    }

    getOperations() {
        return this.operations;
    }

    // Для совместимости со старым кодом
    getAll() {
        return this.categories.map(category => ({
            id: category.id,
            name: category.name,
            amount: this.calculateCategoryTotal(category),
            icon: category.icon,
            date: new Date().toISOString()
        }));
    }

    getTotal() {
        return this.categories.reduce((total, category) => {
            return total + this.calculateCategoryTotal(category);
        }, 0);
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

    // Обновление операции
    async updateOperation(operationId, updatedData) {
        const operation = this.getOperation(operationId);
        if (!operation) {
            throw new Error("Операция не найдена");
        }

        // Вычитаем старую сумму
        this.reverseCategoryAmounts(operation);

        // Обновляем операцию
        Object.assign(operation, updatedData);

        // Добавляем новую сумму
        this.updateCategoryAmounts(operation);

        await this.storage.put('incomes', operation);
        return operation;
    }

    async deleteOperation(id) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index !== -1) {
            const operation = this.operations[index];
            // Вычитаем сумму из категории
            this.reverseCategoryAmounts(operation);
            this.operations.splice(index, 1);
            await this.storage.delete('incomes', id);
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
}