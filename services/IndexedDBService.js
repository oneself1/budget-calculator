class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 5; // Увеличиваем версию
        this.db = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return this.db;
        
        return new Promise((resolve, reject) => {
            console.log('Opening IndexedDB...');
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('IndexedDB open error:', request.error);
                reject(new Error(`Ошибка открытия базы данных: ${request.error}`));
            };
            
            request.onsuccess = (event) => {
                console.log('IndexedDB opened successfully');
                this.db = request.result;
                this.initialized = true;
                
                // Проверяем наличие базовых данных
                this.ensureBasicData().then(() => {
                    resolve(this.db);
                }).catch(error => {
                    console.error('Error ensuring basic data:', error);
                    resolve(this.db);
                });
            };

            request.onupgradeneeded = (event) => {
                console.log('IndexedDB upgrade needed, version:', event.oldVersion, '->', event.newVersion);
                const db = event.target.result;
                this.createStores(db);
            };

            request.onblocked = (event) => {
                console.warn('IndexedDB blocked, please close other tabs');
                reject(new Error('База данных заблокирована. Закройте другие вкладки с приложением.'));
            };
        });
    }

    createStores(db) {
        try {
            // Удаляем старые хранилища если есть проблемы
            const storeNames = [
                'incomes', 'incomeCategories', 'debts', 
                'expenseCategories', 'expenseOperations', 'settings',
                'budgets', 'recurringTransactions', 'savingsGoals'
            ];

            for (const storeName of storeNames) {
                if (db.objectStoreNames.contains(storeName)) {
                    try {
                        db.deleteObjectStore(storeName);
                        console.log('Deleted old store:', storeName);
                    } catch (error) {
                        console.warn('Could not delete store:', storeName, error);
                    }
                }
            }

            // Создаем новые хранилища
            const incomeStore = db.createObjectStore('incomes', { keyPath: 'id' });
            incomeStore.createIndex('categoryId', 'categoryId', { unique: false });
            incomeStore.createIndex('date', 'date', { unique: false });

            const incomeCatStore = db.createObjectStore('incomeCategories', { keyPath: 'id' });
            incomeCatStore.createIndex('name', 'name', { unique: false });

            const expenseCatStore = db.createObjectStore('expenseCategories', { keyPath: 'id' });
            expenseCatStore.createIndex('name', 'name', { unique: false });

            const expenseOpStore = db.createObjectStore('expenseOperations', { keyPath: 'id' });
            expenseOpStore.createIndex('categoryId', 'categoryId', { unique: false });
            expenseOpStore.createIndex('date', 'date', { unique: false });

            db.createObjectStore('debts', { keyPath: 'id' });
            db.createObjectStore('settings', { keyPath: 'id' });
            db.createObjectStore('budgets', { keyPath: 'categoryId' });
            db.createObjectStore('recurringTransactions', { keyPath: 'id' });
            db.createObjectStore('savingsGoals', { keyPath: 'id' });

            console.log('All stores created successfully');

        } catch (error) {
            console.error('Error creating stores:', error);
            throw error;
        }
    }

    async ensureBasicData() {
        try {
            // Сначала проверяем и добавляем базовые категории расходов
            const existingExpenseCategories = await this.getAll('expenseCategories');
            if (existingExpenseCategories.length === 0) {
                console.log('Adding default expense categories...');
                const defaultCategories = this.getDefaultExpenseCategories();
                for (const category of defaultCategories) {
                    await this.add('expenseCategories', category);
                }
                console.log('Added', defaultCategories.length, 'default expense categories');
            }

            // Затем проверяем и добавляем базовые категории доходов
            const existingIncomeCategories = await this.getAll('incomeCategories');
            if (existingIncomeCategories.length === 0) {
                console.log('Adding default income categories...');
                const defaultCategories = this.getDefaultIncomeCategories();
                for (const category of defaultCategories) {
                    await this.add('incomeCategories', category);
                }
                console.log('Added', defaultCategories.length, 'default income categories');
            }

            // Проверяем настройки
            const existingSettings = await this.getAll('settings');
            if (existingSettings.length === 0) {
                console.log('Adding default settings...');
                await this.add('settings', {
                    id: 1,
                    currency: "₽",
                    budgetAlerts: true,
                    autoProcessRecurring: true
                });
            }

            console.log('Basic data ensured successfully');
        } catch (error) {
            console.error('Error ensuring basic data:', error);
            throw error;
        }
    }

    // Общие методы для работы с данными
    async getAll(storeName) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => {
                    console.error(`Error getting all from ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in getAll for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    async get(storeName, id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    console.error(`Error getting from ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in get for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    async add(storeName, data) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        // Генерируем ID если нет
        if (!data.id) {
            data.id = Date.now() + Math.random();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    console.error(`Error adding to ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in add for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    async put(storeName, data) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        // Генерируем ID если нет
        if (!data.id) {
            data.id = Date.now() + Math.random();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    console.error(`Error putting to ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in put for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    async delete(storeName, id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error(`Error deleting from ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in delete for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    async clear(storeName) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error(`Error clearing ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in clear for ${storeName}:`, error);
                reject(error);
            }
        });
    }

    // Специфичные методы для приложения
    async getSettings() {
        try {
            const settings = await this.get('settings', 1);
            return settings || { 
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { 
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };
        }
    }

    async saveSettings(settings) {
        return await this.put('settings', { id: 1, ...settings });
    }

    // Получение всех данных приложения
    async getAllData() {
        try {
            const [
                incomes,
                incomeCategories,
                debts,
                expenseCategories,
                expenseOperations,
                settings,
                budgets,
                recurringTransactions,
                savingsGoals
            ] = await Promise.all([
                this.getAll('incomes').catch(() => []),
                this.getAll('incomeCategories').catch(() => []),
                this.getAll('debts').catch(() => []),
                this.getAll('expenseCategories').catch(() => []),
                this.getAll('expenseOperations').catch(() => []),
                this.getSettings().catch(() => ({})),
                this.getAll('budgets').catch(() => []),
                this.getAll('recurringTransactions').catch(() => []),
                this.getAll('savingsGoals').catch(() => [])
            ]);

            return {
                incomes,
                incomeCategories,
                debts,
                expenseCategories,
                expenseOperations,
                settings,
                budgets,
                recurringTransactions,
                savingsGoals
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            return this.getDefaultDataStructure();
        }
    }

    getDefaultDataStructure() {
        return {
            incomes: [],
            incomeCategories: this.getDefaultIncomeCategories(),
            debts: [],
            expenseCategories: this.getDefaultExpenseCategories(),
            expenseOperations: [],
            settings: {
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            },
            budgets: [],
            recurringTransactions: [],
            savingsGoals: []
        };
    }

    async clearAllData() {
        try {
            console.log('Clearing all data...');
            
            const storeNames = [
                'incomes', 'incomeCategories', 'debts', 
                'expenseCategories', 'expenseOperations', 'settings',
                'budgets', 'recurringTransactions', 'savingsGoals'
            ];

            const clearPromises = storeNames.map(storeName => 
                this.clear(storeName).catch(error => {
                    console.warn(`Could not clear ${storeName}:`, error);
                    return true;
                })
            );

            await Promise.all(clearPromises);
            
            // Восстанавливаем базовые данные
            await this.ensureBasicData();
            
            console.log('All data cleared and reset to defaults');
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }

    getDefaultExpenseCategories() {
        return [
            { 
                id: 1, 
                name: "Продукты", 
                amount: 0, 
                icon: "🛒",
                subcategories: [
                    { id: 101, name: "Овощи и фрукты", amount: 0, icon: "🍎" },
                    { id: 102, name: "Мясо и рыба", amount: 0, icon: "🍗" },
                    { id: 103, name: "Молочные продукты", amount: 0, icon: "🥛" }
                ]
            },
            { 
                id: 2, 
                name: "Транспорт", 
                amount: 0, 
                icon: "🚗",
                subcategories: [
                    { id: 201, name: "Общественный транспорт", amount: 0, icon: "🚌" },
                    { id: 202, name: "Такси", amount: 0, icon: "🚕" },
                    { id: 203, name: "Бензин", amount: 0, icon: "⛽" }
                ]
            },
            { 
                id: 3, 
                name: "Жилье", 
                amount: 0, 
                icon: "🏠",
                subcategories: [
                    { id: 301, name: "Аренда", amount: 0, icon: "🏘️" },
                    { id: 302, name: "Коммунальные услуги", amount: 0, icon: "💡" },
                    { id: 303, name: "Ремонт", amount: 0, icon: "🛠️" }
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
                subcategories: []
            },
            { 
                id: 6, 
                name: "Здоровье", 
                amount: 0, 
                icon: "🏥",
                subcategories: [
                    { id: 601, name: "Лекарства", amount: 0, icon: "💊" },
                    { id: 602, name: "Врачи", amount: 0, icon: "👨‍⚕️" }
                ]
            },
            { 
                id: 7, 
                name: "Развлечения", 
                amount: 0, 
                icon: "🎬",
                subcategories: [
                    { id: 701, name: "Кино", amount: 0, icon: "🎥" },
                    { id: 702, name: "Рестораны", amount: 0, icon: "🍽️" }
                ]
            },
            { 
                id: 8, 
                name: "Образование", 
                amount: 0, 
                icon: "🎓",
                subcategories: []
            },
            { 
                id: 9, 
                name: "Подарки", 
                amount: 0, 
                icon: "🎁",
                subcategories: []
            },
            { 
                id: 10, 
                name: "Красота", 
                amount: 0, 
                icon: "💄",
                subcategories: []
            },
            { 
                id: 11, 
                name: "Дети", 
                amount: 0, 
                icon: "👶",
                subcategories: []
            },
            { 
                id: 12, 
                name: "Прочее", 
                amount: 0, 
                icon: "📦",
                subcategories: []
            }
        ];
    }

    getDefaultIncomeCategories() {
        return [
            { 
                id: 1, 
                name: "Зарплата", 
                amount: 0, 
                icon: "💰",
                subcategories: [
                    { id: 101, name: "Основная работа", amount: 0, icon: "💼" },
                    { id: 102, name: "Аванс", amount: 0, icon: "📅" }
                ]
            },
            { 
                id: 2, 
                name: "Стипендия", 
                amount: 0, 
                icon: "🎓",
                subcategories: []
            },
            { 
                id: 3, 
                name: "Инвестиции", 
                amount: 0, 
                icon: "📈",
                subcategories: []
            },
            { 
                id: 4, 
                name: "Фриланс", 
                amount: 0, 
                icon: "💻",
                subcategories: []
            },
            { 
                id: 5, 
                name: "Подарки", 
                amount: 0, 
                icon: "🎁",
                subcategories: []
            }
        ];
    }

    // Метод для полного сброса базы данных
    async resetDatabase() {
        try {
            if (this.db) {
                this.db.close();
                this.db = null;
                this.initialized = false;
            }

            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(this.dbName);
                
                request.onsuccess = () => {
                    console.log('Database deleted successfully');
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('Error deleting database:', request.error);
                    reject(request.error);
                };
                
                request.onblocked = () => {
                    console.warn('Database deletion blocked');
                    reject(new Error('Удаление базы заблокировано. Закройте другие вкладки.'));
                };
            });
        } catch (error) {
            console.error('Error in resetDatabase:', error);
            throw error;
        }
    }
}