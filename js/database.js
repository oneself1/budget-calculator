class Database {
    constructor() {
        this.dbName = 'FinanceAppDB';
        this.version = 4;
        this.db = null;
        this.isInitialized = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Initializing database...');
            
            if (!window.indexedDB) {
                const error = 'IndexedDB is not supported in this browser';
                console.error('❌', error);
                reject(new Error(error));
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('❌ Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                console.log('✅ Database initialized successfully');
                
                // Проверяем и добавляем данные по умолчанию
                this.ensureDefaultData().then(resolve).catch(reject);
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed');
                const db = event.target.result;
                this.createStores(db);
            };

            request.onblocked = () => {
                console.warn('⚠️ Database opening blocked');
            };
        });
    }

    createStores(db) {
        console.log('🔄 Creating database stores...');
        
        // Удаляем старые хранилища если они существуют
        if (db.objectStoreNames.contains('categories')) {
            db.deleteObjectStore('categories');
        }
        if (db.objectStoreNames.contains('transactions')) {
            db.deleteObjectStore('transactions');
        }
        if (db.objectStoreNames.contains('debts')) {
            db.deleteObjectStore('debts');
        }
        if (db.objectStoreNames.contains('goals')) {
            db.deleteObjectStore('goals');
        }
        if (db.objectStoreNames.contains('settings')) {
            db.deleteObjectStore('settings');
        }

        // Создаем новые хранилища
        const categoriesStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        categoriesStore.createIndex('type', 'type', { unique: false });

        const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transactionsStore.createIndex('type', 'type', { unique: false });
        transactionsStore.createIndex('date', 'date', { unique: false });

        db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('settings', { keyPath: 'id' });
        
        console.log('✅ Database stores created successfully');
    }

    async ensureDefaultData() {
        try {
            console.log('🔄 Ensuring default data...');
            
            // Проверяем наличие категорий
            const categories = await this.getAll('categories');
            if (categories.length === 0) {
                console.log('📥 Adding default categories...');
                await this.addDefaultCategories();
            }
            
            // Проверяем наличие настроек
            const settings = await this.get('settings', 1);
            if (!settings) {
                console.log('📥 Adding default settings...');
                await this.addDefaultSettings();
            }
            
            console.log('✅ Default data ensured');
        } catch (error) {
            console.error('❌ Error ensuring default data:', error);
            throw error;
        }
    }

    async addDefaultCategories() {
        const defaultCategories = [
            // Income Categories
            { name: 'Зарплата', icon: '💰', type: 'income' },
            { name: 'Стипендия', icon: '🎓', type: 'income' },
            { name: 'Инвестиции', icon: '📈', type: 'income' },
            { name: 'Подарки', icon: '🎁', type: 'income' },
            
            // Expense Categories
            { name: 'Продукты', icon: '🛒', type: 'expense' },
            { name: 'Транспорт', icon: '🚗', type: 'expense' },
            { name: 'Жилье', icon: '🏠', type: 'expense' },
            { name: 'Развлечения', icon: '🎬', type: 'expense' }
        ];

        for (const category of defaultCategories) {
            await this.add('categories', category);
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

    // Basic CRUD operations
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

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

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
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

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
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Убедимся, что у данных есть временная метка
                const itemWithTimestamp = {
                    ...data,
                    createdAt: data.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                const request = store.add(itemWithTimestamp);

                request.onsuccess = () => {
                    console.log(`✅ Added to ${storeName}:`, itemWithTimestamp);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`Error adding to ${storeName}:`, request.error);
                    reject(request.error);
                };

                transaction.oncomplete = () => {
                    console.log(`✅ Transaction completed for adding to ${storeName}`);
                };

            } catch (error) {
                console.error(`Error in add for ${storeName}:`, error);
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
                
                const itemWithTimestamp = {
                    ...data,
                    updatedAt: new Date().toISOString()
                };
                
                const request = store.put(itemWithTimestamp);

                request.onsuccess = () => {
                    console.log(`✅ Updated in ${storeName}:`, itemWithTimestamp);
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error(`Error updating in ${storeName}:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error(`Error in put for ${storeName}:`, error);
                reject(error);
            }
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

    // Specific methods
    async getCategoriesByType(type) {
        try {
            const allCategories = await this.getAll('categories');
            return allCategories.filter(category => category.type === type);
        } catch (error) {
            console.error('Error getting categories by type:', error);
            return [];
        }
    }

    async getSettings() {
        try {
            const settings = await this.get('settings', 1);
            return settings || {
                id: 1,
                currency: '₽',
                budgetAlerts: true,
                autoProcessRecurring: true
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                id: 1,
                currency: '₽',
                budgetAlerts: true,
                autoProcessRecurring: true
            };
        }
    }

    async saveSettings(settings) {
        return await this.put('settings', { id: 1, ...settings });
    }

    async clearAllData() {
        try {
            console.log('🔄 Clearing all data...');
            const stores = ['categories', 'transactions', 'debts', 'goals'];
            
            for (const store of stores) {
                await this.clear(store);
            }
            
            // Восстанавливаем настройки и категории по умолчанию
            await this.addDefaultCategories();
            await this.addDefaultSettings();
            
            console.log('✅ All data cleared and defaults restored');
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            throw error;
        }
    }

    async exportData() {
        try {
            const data = {
                categories: await this.getAll('categories'),
                transactions: await this.getAll('transactions'),
                debts: await this.getAll('debts'),
                goals: await this.getAll('goals'),
                settings: await this.getSettings(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Проверка состояния базы данных
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            dbName: this.dbName,
            version: this.version
        };
    }
}