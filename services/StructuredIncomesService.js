class StructuredIncomesService {
    constructor(storageService) {
        this.storage = storageService;
        this.categories = [];
        this.operations = [];
    }

    load(data) {
        this.categories = data?.incomeCategories || [];
        this.operations = data?.incomeOperations || [];
        
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
        }
        
        this.updateCategoryAmountsFromOperations();
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
    addCategory(category) {
        const newCategory = {
            id: Date.now(),
            amount: 0,
            subcategories: [],
            ...category
        };
        this.categories.push(newCategory);
        return newCategory;
    }

    updateCategory(id, updatedCategory) {
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...updatedCategory };
            return this.categories[index];
        }
        return null;
    }

    deleteCategory(id) {
        const index = this.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            this.operations = this.operations.filter(op => op.categoryId !== id);
            return this.categories.splice(index, 1)[0];
        }
        return null;
    }

    getCategory(id) {
        return this.categories.find(cat => cat.id === id);
    }

    getCategories() {
        return this.categories;
    }

    // Подкатегории
    addSubcategory(categoryId, subcategory) {
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
            return newSub;
        }
        return null;
    }

    updateSubcategory(categoryId, subcategoryId, updatedSubcategory) {
        const category = this.getCategory(categoryId);
        if (category && category.subcategories) {
            const index = category.subcategories.findIndex(sub => sub.id === subcategoryId);
            if (index !== -1) {
                category.subcategories[index] = { ...category.subcategories[index], ...updatedSubcategory };
                return category.subcategories[index];
            }
        }
        return null;
    }

    deleteSubcategory(categoryId, subcategoryId) {
        const category = this.getCategory(categoryId);
        if (category && category.subcategories) {
            const index = category.subcategories.findIndex(sub => sub.id === subcategoryId);
            if (index !== -1) {
                const deletedSub = category.subcategories.splice(index, 1)[0];
                this.operations = this.operations.filter(operation => 
                    !(operation.categoryId === categoryId && operation.subcategoryId === subcategoryId)
                );
                return deletedSub;
            }
        }
        return null;
    }

    // Операции
    addOperation(operation) {
        const newOperation = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...operation
        };
        
        this.updateCategoryAmounts(newOperation);
        this.operations.push(newOperation);
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
    updateOperation(operationId, updatedData) {
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

        return operation;
    }

    deleteOperation(id) {
        const index = this.operations.findIndex(op => op.id === id);
        if (index !== -1) {
            const operation = this.operations[index];
            // Вычитаем сумму из категории
            this.reverseCategoryAmounts(operation);
            return this.operations.splice(index, 1)[0];
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