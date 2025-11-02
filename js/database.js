
class Database {
    constructor() {
        this.dbName = 'FinanceAppDB';
        this.version = 4;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        const stores = {
            categories: { keyPath: 'id', indexes: ['type'] },
            transactions: { keyPath: 'id', indexes: ['type', 'date', 'categoryId'] },
            debts: { keyPath: 'id', indexes: ['date'] },
            goals: { keyPath: 'id', indexes: ['isCompleted'] },
            settings: { keyPath: 'id' }
        };

        for (const [storeName, config] of Object.entries(stores)) {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
                
                // Create indexes
                if (config.indexes) {
                    config.indexes.forEach(index => {
                        store.createIndex(index, index, { unique: false });
                    });
                }
                
                console.log(`✅ Created store: ${storeName}`);
            }
        }

        // Add default data after creating stores
        this.addDefaultData(db);
    }

    addDefaultData(db) {
        const defaultCategories = [
            // Income Categories
            { id: 1, name: 'Зарплата', icon: '💰', type: 'income', subcategories: [] },
            { id: 2, name: 'Стипендия', icon: '🎓', type: 'income', subcategories: [] },
            { id: 3, name: 'Инвестиции', icon: '📈', type: 'income', subcategories: [] },
            { id: 4, name: 'Подарки', icon: '🎁', type: 'income', subcategories: [] },
            
            // Expense Categories
            { id: 5, name: 'Продукты', icon: '🛒', type: 'expense', subcategories: [
                { id: 1, name: 'Овощи/Фрукты', icon: '🥦' },
                { id: 2, name: 'Молочные продукты', icon: '🥛' },
                { id: 3, name: 'Мясо/Рыба', icon: '🍖' }
            ]},
            { id: 6, name: 'Транспорт', icon: '🚗', type: 'expense', subcategories: [
                { id: 1, name: 'Бензин', icon: '⛽' },
                { id: 2, name: 'Общественный транспорт', icon: '🚌' },
                { id: 3, name: 'Такси', icon: '🚕' }
            ]},
            { id: 7, name: 'Жилье', icon: '🏠', type: 'expense', subcategories: [
                { id: 1, name: 'Аренда', icon: '🏘️' },
                { id: 2, name: 'Коммунальные услуги', icon: '💡' },
                { id: 3, name: 'Ремонт', icon: '🛠️' }
            ]},
            { id: 8, name: 'Развлечения', icon: '🎬', type: 'expense', subcategories: [
                { id: 1, name: 'Кино', icon: '🎥' },
                { id: 2, name: 'Рестораны', icon: '🍽️' },
                { id: 3, name: 'Хобби', icon: '🎨' }
            ]}
        ];

        const defaultSettings = {
            id: 1,
            currency: '₽',
            budgetAlerts: true,
            autoProcessRecurring: true
        };

        const transaction = db.transaction(['categories', 'settings'], 'readwrite');
        
        const categoryStore = transaction.objectStore('categories');
        defaultCategories.forEach(category => {
            categoryStore.add(category);
        });

        const settingsStore = transaction.objectStore('settings');
        settingsStore.add(defaultSettings);

        transaction.oncomplete = () => {
            console.log('✅ Default data added successfully');
        };
    }

    // Generic database methods
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const itemWithId = {
                ...data,
                id: data.id || Date.now() + Math.random()
            };
            
            const request = store.add(itemWithId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Specific methods for categories
    async getCategoriesByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            const index = store.index('type');
            const request = index.getAll(type);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async addSubcategory(categoryId, subcategory) {
        const category = await this.get('categories', categoryId);
        if (!category) throw new Error('Category not found');

        if (!category.subcategories) {
            category.subcategories = [];
        }

        const newSubcategory = {
            id: Date.now() + Math.random(),
            ...subcategory
        };

        category.subcategories.push(newSubcategory);
        await this.put('categories', category);
        return newSubcategory;
    }

    // Specific methods for transactions
    async getTransactionsByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            const index = store.index('type');
            const request = index.getAll(type);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentTransactions(limit = 10) {
        const allTransactions = await this.getAll('transactions');
        return allTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Settings methods
    async getSettings() {
        const settings = await this.get('settings', 1);
        return settings || {
            id: 1,
            currency: '₽',
            budgetAlerts: true,
            autoProcessRecurring: true
        };
    }

    async saveSettings(settings) {
        return await this.put('settings', { id: 1, ...settings });
    }

    // Data export/import
    async exportData() {
        const data = {
            categories: await this.getAll('categories'),
            transactions: await this.getAll('transactions'),
            debts: await this.getAll('debts'),
            goals: await this.getAll('goals'),
            settings: await this.getSettings(),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    async importData(data) {
        // Clear existing data
        await this.clear('categories');
        await this.clear('transactions');
        await this.clear('debts');
        await this.clear('goals');

        // Import new data
        for (const category of data.categories) {
            await this.add('categories', category);
        }
        for (const transaction of data.transactions) {
            await this.add('transactions', transaction);
        }
        for (const debt of data.debts) {
            await this.add('debts', debt);
        }
        for (const goal of data.goals) {
            await this.add('goals', goal);
        }
        if (data.settings) {
            await this.saveSettings(data.settings);
        }
    }

    async clearAllData() {
        await this.clear('categories');
        await this.clear('transactions');
        await this.clear('debts');
        await this.clear('goals');
        
        // Re-add default categories and settings
        const db = this.db;
        this.addDefaultData(db);
    }
}
