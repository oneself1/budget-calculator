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
                
                // Проверяем и добавляем данные по умолчанию если нужно
                this.ensureDefaultData().then(resolve).catch(reject);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    async ensureDefaultData() {
        try {
            const categories = await this.getAll('categories');
            if (categories.length === 0) {
                await this.addDefaultData();
            }
            
            const settings = await this.get('settings', 1);
            if (!settings) {
                await this.addDefaultSettings();
            }
        } catch (error) {
            console.error('Error ensuring default data:', error);
        }
    }

    createStores(db) {
        const stores = [
            'categories', 'transactions', 'debts', 'goals', 'settings'
        ];

        for (const storeName of stores) {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Создаем индексы для категорий
                if (storeName === 'categories') {
                    store.createIndex('type', 'type', { unique: false });
                }
                // Создаем индексы для транзакций
                if (storeName === 'transactions') {
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                }
                
                console.log(`✅ Created store: ${storeName}`);
            }
        }
    }

    async addDefaultData() {
        try {
            const defaultCategories = [
                // Income Categories
                { id: 1, name: 'Зарплата', icon: '💰', type: 'income', subcategories: [] },
                { id: 2, name: 'Стипендия', icon: '🎓', type: 'income', subcategories: [] },
                { id: 3, name: 'Инвестиции', icon: '📈', type: 'income', subcategories: [] },
                { id: 4, name: 'Подарки', icon: '🎁', type: 'income', subcategories: [] },
                
                // Expense Categories
                { id: 5, name: 'Продукты', icon: '🛒', type: 'expense', subcategories: [] },
                { id: 6, name: 'Транспорт', icon: '🚗', type: 'expense', subcategories: [] },
                { id: 7, name: 'Жилье', icon: '🏠', type: 'expense', subcategories: [] },
                { id: 8, name: 'Развлечения', icon: '🎬', type: 'expense', subcategories: [] }
            ];

            for (const category of defaultCategories) {
                await this.add('categories', category);
            }

            await this.addDefaultSettings();
            
        } catch (error) {
            console.error('Error adding default data:', error);
        }
    }

    async addDefaultSettings() {
        const defaultSettings = {
            id: 1,
            currency: '₽',
            budgetAlerts: true,
            autoProcessRecurring: true
        };
        await this.put('settings', defaultSettings);
    }

    // Упрощенные методы работы с базой данных
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
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
            
            // Убедимся, что у данных есть ID
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

    // Специфичные методы
    async getCategoriesByType(type) {
        const allCategories = await this.getAll('categories');
        return allCategories.filter(category => category.type === type);
    }

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

    async clearAllData() {
        const stores = ['categories', 'transactions', 'debts', 'goals'];
        for (const store of stores) {
            await this.clear(store);
        }
        // Восстанавливаем настройки и категории по умолчанию
        await this.addDefaultData();
    }
}
