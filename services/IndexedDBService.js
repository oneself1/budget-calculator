class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 2; // Увеличиваем версию
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
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
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                console.log(`✅ Created store: ${storeName}`);
                
                // Создаем индексы для основных хранилищ
                if (storeName === 'expenseCategories' || storeName === 'incomeCategories') {
                    store.createIndex('name', 'name', { unique: false });
                }
                if (storeName === 'expenseOperations' || storeName === 'incomes') {
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('categoryId', 'categoryId', { unique: false });
                }
            }
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.db) {
                    reject(new Error('Database not initialized'));
                    return;
                }
                
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    console.log(`📁 Loaded ${request.result?.length || 0} items from ${storeName}`);
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    console.error(`❌ Error loading from ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`❌ Exception in getAll for ${storeName}:`, error);
                reject(error);
            }
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
            
            // Убедимся, что у данных есть ID
            const itemWithId = {
                ...data,
                id: data.id || Date.now() + Math.floor(Math.random() * 1000)
            };
            
            const request = store.add(itemWithId);

            request.onsuccess = () => {
                console.log(`✅ Added to ${storeName}:`, itemWithId);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`❌ Error adding to ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                console.log(`✅ Updated in ${storeName}:`, data);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`❌ Error updating in ${storeName}:`, request.error);
                reject(request.error);
            };
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

    async ensureBasicData() {
        try {
            console.log('📦 Ensuring basic data...');

            // Проверяем и создаем базовые категории расходов
            let expenseCategories = await this.getAll('expenseCategories');
            if (expenseCategories.length === 0) {
                console.log('Creating default expense categories...');
                const defaultCategories = this.getDefaultExpenseCategories();
                for (const category of defaultCategories) {
                    await this.add('expenseCategories', category);
                }
                expenseCategories = defaultCategories;
            }

            // Проверяем и создаем базовые категории доходов
            let incomeCategories = await this.getAll('incomeCategories');
            if (incomeCategories.length === 0) {
                console.log('Creating default income categories...');
                const defaultCategories = this.getDefaultIncomeCategories();
                for (const category of defaultCategories) {
                    await this.add('incomeCategories', category);
                }
                incomeCategories = defaultCategories;
            }

            // Проверяем настройки
            let settings = await this.getAll('settings');
            if (settings.length === 0) {
                console.log('Creating default settings...');
                const defaultSettings = {
                    id: 1,
                    currency: "₽",
                    budgetAlerts: true,
                    autoProcessRecurring: true
                };
                await this.add('settings', defaultSettings);
                settings = [defaultSettings];
            }

            console.log('✅ Basic data ensured successfully');
            return {
                expenseCategories,
                incomeCategories,
                settings: settings[0]
            };
        } catch (error) {
            console.error('❌ Error ensuring basic data:', error);
            throw error;
        }
    }

    getDefaultExpenseCategories() {
        return [
            { id: 1, name: "Продукты", amount: 0, icon: "🛒" },
            { id: 2, name: "Транспорт", amount: 0, icon: "🚗" },
            { id: 3, name: "Жилье", amount: 0, icon: "🏠" },
            { id: 4, name: "Связь", amount: 0, icon: "📱" },
            { id: 5, name: "Одежда", amount: 0, icon: "👕" },
            { id: 6, name: "Здоровье", amount: 0, icon: "🏥" }
        ];
    }

    getDefaultIncomeCategories() {
        return [
            { id: 1, name: "Зарплата", amount: 0, icon: "💰" },
            { id: 2, name: "Стипендия", amount: 0, icon: "🎓" },
            { id: 3, name: "Инвестиции", amount: 0, icon: "📈" },
            { id: 4, name: "Подарки", amount: 0, icon: "🎁" }
        ];
    }

    async getAllData() {
        try {
            console.log('📊 Loading all data...');
            
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

            const settingsObj = settings.length > 0 ? settings[0] : {
                id: 1,
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };

            const data = {
                expenseCategories,
                expenseOperations,
                incomeCategories,
                incomes,
                debts,
                savingsGoals,
                settings: settingsObj
            };

            console.log('📊 Loaded data summary:', {
                expenseCategories: expenseCategories.length,
                expenseOperations: expenseOperations.length,
                incomeCategories: incomeCategories.length,
                incomes: incomes.length,
                debts: debts.length,
                savingsGoals: savingsGoals.length
            });

            return data;
        } catch (error) {
            console.error('❌ Error loading all data:', error);
            // Возвращаем данные по умолчанию вместо выброса ошибки
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
            console.log('🧹 Clearing all data...');
            
            const stores = [
                'expenseCategories', 'expenseOperations',
                'incomeCategories', 'incomes', 
                'debts', 'savingsGoals'
            ];
            
            // Очищаем все хранилища кроме настроек
            for (const storeName of stores) {
                await this.clear(storeName);
            }
            
            // Пересоздаем базовые данные
            await this.ensureBasicData();
            
            console.log('✅ All data cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            throw error;
        }
    }
}
