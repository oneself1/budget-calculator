class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 7;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
                console.log('🔄 Database upgrade completed');
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
                if (storeName === 'expenseCategories' || storeName === 'incomeCategories') {
                    store.createIndex('name', 'name', { unique: false });
                }
                if (storeName === 'expenseOperations' || storeName === 'incomes') {
                    store.createIndex('date', 'date', { unique: false });
                }
                console.log(`✅ Created store: ${storeName}`);
            }
        });
    }

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
            const request = store.add({ 
                ...data, 
                id: data.id || Date.now() + Math.random() 
            });

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

    async ensureBasicData() {
        try {
            // Проверяем и создаем базовые категории расходов
            const expenseCategories = await this.getAll('expenseCategories');
            if (expenseCategories.length === 0) {
                console.log('📦 Creating default expense categories...');
                const defaultCategories = this.getDefaultExpenseCategories();
                for (const category of defaultCategories) {
                    await this.add('expenseCategories', category);
                }
                console.log(`✅ Created ${defaultCategories.length} expense categories`);
            }

            // Проверяем и создаем базовые категории доходов
            const incomeCategories = await this.getAll('incomeCategories');
            if (incomeCategories.length === 0) {
                console.log('💰 Creating default income categories...');
                const defaultCategories = this.getDefaultIncomeCategories();
                for (const category of defaultCategories) {
                    await this.add('incomeCategories', category);
                }
                console.log(`✅ Created ${defaultCategories.length} income categories`);
            }

            // Проверяем настройки
            const settings = await this.getAll('settings');
            if (settings.length === 0) {
                console.log('⚙️ Creating default settings...');
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
            { id: 4, name: "Связь", amount: 0, icon: "📱" },
            { id: 5, name: "Одежда", amount: 0, icon: "👕" },
            { id: 6, name: "Здоровье", amount: 0, icon: "🏥" }
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
                savingsGoals
            ] = await Promise.all([
                this.getAll('expenseCategories'),
                this.getAll('expenseOperations'),
                this.getAll('incomeCategories'),
                this.getAll('incomes'),
                this.getAll('debts'),
                this.getAll('savingsGoals')
            ]);

            const settings = await this.get('settings', 1) || {
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            };

            return {
                expenseCategories,
                expenseOperations,
                incomeCategories,
                incomes,
                debts,
                savingsGoals,
                settings
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
                currency: "₽",
                budgetAlerts: true,
                autoProcessRecurring: true
            }
        };
    }

    async saveSettings(settings) {
        return await this.put('settings', { id: 1, ...settings });
    }
}