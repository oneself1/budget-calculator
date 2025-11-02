class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Initializing IndexedDB...');
            
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(new Error('Failed to open database'));
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed');
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        const stores = [
            'expenseCategories', 'expenseOperations',
            'incomeCategories', 'incomes', 
            'debts', 'settings', 'savingsGoals'
        ];

        stores.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
                console.log(`✅ Created store: ${storeName}`);
            }
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error(`Error getting all from ${storeName}:`, error);
                resolve([]);
            }
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const itemWithId = {
                ...data,
                id: data.id || Date.now()
            };
            
            const request = store.add(itemWithId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async ensureBasicData() {
        try {
            // Проверяем и создаем базовые категории расходов
            const expenseCategories = await this.getAll('expenseCategories');
            if (expenseCategories.length === 0) {
                const defaultCategories = this.getDefaultExpenseCategories();
                for (const category of defaultCategories) {
                    await this.add('expenseCategories', category);
                }
            }

            // Проверяем и создаем базовые категории доходов
            const incomeCategories = await this.getAll('incomeCategories');
            if (incomeCategories.length === 0) {
                const defaultCategories = this.getDefaultIncomeCategories();
                for (const category of defaultCategories) {
                    await this.add('incomeCategories', category);
                }
            }

            // Проверяем настройки
            const settings = await this.getAll('settings');
            if (settings.length === 0) {
                await this.add('settings', {
                    id: 1,
                    currency: "₽",
                    budgetAlerts: true,
                    autoProcessRecurring: true
                });
            }

            console.log('✅ Basic data ensured successfully');
        } catch (error) {
            console.error('❌ Error ensuring basic data:', error);
        }
    }

    getDefaultExpenseCategories() {
        return [
            { id: 1, name: "Продукты", amount: 0, icon: "🛒" },
            { id: 2, name: "Транспорт", amount: 0, icon: "🚗" },
            { id: 3, name: "Жилье", amount: 0, icon: "🏠" },
            { id: 4, name: "Связь", amount: 0, icon: "📱" }
        ];
    }

    getDefaultIncomeCategories() {
        return [
            { id: 1, name: "Зарплата", amount: 0, icon: "💰" },
            { id: 2, name: "Стипендия", amount: 0, icon: "🎓" },
            { id: 3, name: "Инвестиции", amount: 0, icon: "📈" }
        ];
    }

    async getAllData() {
        try {
            const [
                expenseCategories,
                expenseOperations,
                incomeCategories,
                incomes,
                debts,
                savingsGoals,
                settings
            ] = await Promise.all([
                this.getAll('expenseCategories'),
                this.getAll('expenseOperations'),
                this.getAll('incomeCategories'),
                this.getAll('incomes'),
                this.getAll('debts'),
                this.getAll('savingsGoals'),
                this.getAll('settings')
            ]);

            return {
                expenseCategories,
                expenseOperations,
                incomeCategories,
                incomes,
                debts,
                savingsGoals,
                settings: settings[0] || {
                    id: 1,
                    currency: "₽",
                    budgetAlerts: true,
                    autoProcessRecurring: true
                }
            };
        } catch (error) {
            console.error('❌ Error loading all data:', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            expenseCategories: this.getDefaultExpenseCategories(),
            expenseOperations: [],
            incomeCategories: this.getDefaultIncomeCategories(),
            incomes: [],
            debts: [],
            savingsGoals: [],
            settings: {
                id: 1,
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            }
        };
    }

    async saveSettings(settings) {
        return await this.put('settings', { id: 1, ...settings });
    }

    async clearAllData() {
        try {
            const stores = [
                'expenseCategories', 'expenseOperations',
                'incomeCategories', 'incomes', 
                'debts', 'savingsGoals'
            ];
            
            for (const storeName of stores) {
                await this.clear(storeName);
            }
            
            await this.ensureBasicData();
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            throw error;
        }
    }
}
