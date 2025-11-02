class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 3; // Увеличиваем версию для пересоздания базы
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Upgrading IndexedDB to version:', event.newVersion);
                
                // Удаляем старые хранилища если есть
                if (db.objectStoreNames.contains('incomes')) {
                    db.deleteObjectStore('incomes');
                }
                if (db.objectStoreNames.contains('incomeCategories')) {
                    db.deleteObjectStore('incomeCategories');
                }
                if (db.objectStoreNames.contains('expenseCategories')) {
                    db.deleteObjectStore('expenseCategories');
                }
                if (db.objectStoreNames.contains('expenseOperations')) {
                    db.deleteObjectStore('expenseOperations');
                }

                // Создаем новые хранилища с правильной структурой
                const incomeStore = db.createObjectStore('incomes', { keyPath: 'id', autoIncrement: true });
                incomeStore.createIndex('categoryId', 'categoryId', { unique: false });
                incomeStore.createIndex('date', 'date', { unique: false });

                const incomeCatStore = db.createObjectStore('incomeCategories', { keyPath: 'id', autoIncrement: true });
                incomeCatStore.createIndex('name', 'name', { unique: false });

                const expenseCatStore = db.createObjectStore('expenseCategories', { keyPath: 'id', autoIncrement: true });
                expenseCatStore.createIndex('name', 'name', { unique: false });

                const expenseOpStore = db.createObjectStore('expenseOperations', { keyPath: 'id', autoIncrement: true });
                expenseOpStore.createIndex('categoryId', 'categoryId', { unique: false });
                expenseOpStore.createIndex('date', 'date', { unique: false });

                const debtsStore = db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                debtsStore.createIndex('date', 'date', { unique: false });

                const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });

                // Инициализируем базовые категории
                this.initializeDefaultCategories(db);
            };
        });
    }

    async initializeDefaultCategories(db) {
        try {
            // Базовые категории расходов
            const expenseCategories = this.getDefaultExpenseCategories();
            for (const category of expenseCategories) {
                const tx = db.transaction(['expenseCategories'], 'readwrite');
                const store = tx.objectStore('expenseCategories');
                store.add(category);
            }

            // Базовые категории доходов
            const incomeCategories = this.getDefaultIncomeCategories();
            for (const category of incomeCategories) {
                const tx = db.transaction(['incomeCategories'], 'readwrite');
                const store = tx.objectStore('incomeCategories');
                store.add(category);
            }

            // Настройки по умолчанию
            const tx = db.transaction(['settings'], 'readwrite');
            const store = tx.objectStore('settings');
            store.add({
                id: 1,
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            });

            console.log('Default categories initialized');
        } catch (error) {
            console.error('Error initializing default categories:', error);
        }
    }

    // Общие методы для работы с данными
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            } catch (error) {
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
                settings
            ] = await Promise.all([
                this.getAll('incomes'),
                this.getAll('incomeCategories'),
                this.getAll('debts'),
                this.getAll('expenseCategories'),
                this.getAll('expenseOperations'),
                this.getSettings()
            ]);

            return {
                incomes,
                incomeCategories,
                debts,
                expenseCategories,
                expenseOperations,
                settings
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            // Возвращаем структуру по умолчанию
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
                }
            };
        }
    }

    getDefaultExpenseCategories() {
        return [
            { 
                id: 1, 
                name: "Продукты", 
                amount: 0, 
                icon: "🛒",
                subcategories: []
            },
            { 
                id: 2, 
                name: "Транспорт", 
                amount: 0, 
                icon: "🚗",
                subcategories: []
            },
            { 
                id: 3, 
                name: "Жилье", 
                amount: 0, 
                icon: "🏠",
                subcategories: []
            },
            { 
                id: 4, 
                name: "Связь/интернет", 
                amount: 0, 
                icon: "📱",
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
                subcategories: []
            },
            { 
                id: 2, 
                name: "Стипендия", 
                amount: 0, 
                icon: "🎓",
                subcategories: []
            }
        ];
    }
}