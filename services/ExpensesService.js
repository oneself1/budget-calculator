class ExpensesService {
    constructor(storageService) {
        this.storage = storageService;
        this.categories = [];
        this.operations = [];
        this.defaultCategories = [
            { 
                id: 1, 
                name: "Продукты", 
                amount: 0, 
                icon: "🛒",
                subcategories: [
                    { id: 101, name: "Супермаркет", icon: "🛒", amount: 0 },
                    { id: 102, name: "Рынок", icon: "🥦", amount: 0 },
                    { id: 103, name: "Молочные", icon: "🥛", amount: 0 }
                ]
            },
            { 
                id: 2, 
                name: "Транспорт", 
                amount: 0, 
                icon: "🚗",
                subcategories: [
                    { id: 201, name: "Бензин", icon: "⛽", amount: 0 },
                    { id: 202, name: "Такси", icon: "🚕", amount: 0 },
                    { id: 203, name: "Общественный", icon: "🚌", amount: 0 }
                ]
            },
            { 
                id: 3, 
                name: "Жилье", 
                amount: 0, 
                icon: "🏠",
                subcategories: [
                    { id: 301, name: "Аренда", icon: "🏠", amount: 0 },
                    { id: 302, name: "Коммунальные", icon: "💡", amount: 0 },
                    { id: 303, name: "Ремонт", icon: "🛠️", amount: 0 }
                ]
            },
            { 
                id: 4, 
                name: "Связь/интернет", 
                amount: 0, 
                icon: "📱",
                subcategories: []
            },
            { 
                id: 5, 
                name: "Одежда", 
                amount: 0, 
                icon: "👕",
                subcategories: [
                    { id: 501, name: "Одежда", icon: "👕", amount: 0 },
                    { id: 502, name: "Обувь", icon: "👟", amount: 0 },
                    { id: 503, name: "Аксессуары", icon: "🕶️", amount: 0 }
                ]
            }
        ];
    }

    load(data) {
        this.categories = data?.expenseCategories || [];
        this.operations = data?.expenseOperations || [];
        this.migrateCategories();
        this.updateCategoryAmountsFromOperations();
    }

    migrateCategories() {
        let migrated = false;
        
        this.defaultCategories.forEach(defaultCategory => {
            const categoryExists = this.categories.some(
                category => category.id === defaultCategory.id
            );
            
            if (!categoryExists) {
                this.categories.push({
                    ...defaultCategory
                });
                migrated = true;
            } else {
                // Обновляем существующую категорию, добавляя недостающие подкатегории
                const existingCategory = this.categories.find(c => c.id === defaultCategory.id);
                if (existingCategory && (!existingCategory.subcategories || existingCategory.subcategories.length === 0)) {
                    existingCategory.subcategories = defaultCategory.subcategories || [];
                    migrated = true;
                }
            }
        });

        return migrated;
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
    addCategory(category) {
        const newCategory = {
            id: Date.now(),
            amount: 0,
            subcategories: [],
            ...category,
            date: new Date().toISOString()
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
            // Удаляем ВСЕ связанные операции
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
                
                // Удаляем операции этой подкатегории
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
        
        // Обновляем суммы в категориях
        this.updateCategoryAmounts(newOperation);
        
        this.operations.push(newOperation);
        return newOperation;
    }

    updateOperation(operationId, updatedData) {
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

        return operation;
    }

    getOperation(id) {
        return this.operations.find(op => op.id === id);
    }

    getOperations() {
        return this.operations;
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
}