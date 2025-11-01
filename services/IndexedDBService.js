class IndexedDBService {
    constructor() {
        this.dbName = 'BudgetAppDB';
        this.version = 2; // Увеличиваем версию для новых хранилищ
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилища для всех типов данных
                if (!db.objectStoreNames.contains('incomes')) {
                    const incomeStore = db.createObjectStore('incomes', { keyPath: 'id', autoIncrement: true });
                    incomeStore.createIndex('categoryId', 'categoryId', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('incomeCategories')) {
                    const categoryStore = db.createObjectStore('incomeCategories', { keyPath: 'id', autoIncrement: true });
                    categoryStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('debts')) {
                    db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('expenseCategories')) {
                    const expenseStore = db.createObjectStore('expenseCategories', { keyPath: 'id', autoIncrement: true });
                    expenseStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('expenseOperations')) {
                    const expenseOpStore = db.createObjectStore('expenseOperations', { keyPath: 'id', autoIncrement: true });
                    expenseOpStore.createIndex('categoryId', 'categoryId', { unique: false });
                    expenseOpStore.createIndex('subcategoryId', 'subcategoryId', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
                
                // Новые хранилища для версии 2
                if (!db.objectStoreNames.contains('budgets')) {
                    db.createObjectStore('budgets', { keyPath: 'categoryId' });
                }
                
                if (!db.objectStoreNames.contains('recurringTransactions')) {
                    const recurringStore = db.createObjectStore('recurringTransactions', { keyPath: 'id', autoIncrement: true });
                    recurringStore.createIndex('isActive', 'isActive', { unique: false });
                    recurringStore.createIndex('nextDate', 'nextDate', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('savingsGoals')) {
                    const goalsStore = db.createObjectStore('savingsGoals', { keyPath: 'id', autoIncrement: true });
                    goalsStore.createIndex('isCompleted', 'isCompleted', { unique: false });
                }
            };
        });
    }

    // Общие методы для работы с данными
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
            const request = store.add(data);

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
                this.getAll('incomes'),
                this.getAll('incomeCategories'),
                this.getAll('debts'),
                this.getAll('expenseCategories'),
                this.getAll('expenseOperations'),
                this.getSettings(),
                this.getAll('budgets'),
                this.getAll('recurringTransactions'),
                this.getAll('savingsGoals')
            ]);

            return {
                incomes,
                incomeCategories,
                incomeOperations: incomes, // для совместимости
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
            return null;
        }
    }

    // Очистка всех данных (кроме базовых категорий расходов)
    async clearAllData() {
        try {
            await Promise.all([
                this.clear('incomes'),
                this.clear('incomeCategories'),
                this.clear('debts'),
                this.clear('expenseOperations'),
                this.clear('budgets'),
                this.clear('recurringTransactions'),
                this.clear('savingsGoals')
            ]);
            
            // Восстанавливаем базовые категории расходов
            const basicCategories = this.getDefaultExpenseCategories();
            for (const category of basicCategories) {
                await this.put('expenseCategories', category);
            }
            
            // Восстанавливаем базовые категории доходов
            const basicIncomeCategories = this.getDefaultIncomeCategories();
            for (const category of basicIncomeCategories) {
                await this.put('incomeCategories', category);
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
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
                    { id: 101, name: "Супермаркет", icon: "🛒", amount: 0 },
                    { id: 102, name: "Рынок", icon: "🥦", amount: 0 },
                    { id: 103, name: "Молочные", icon: "🥛", amount: 0 },
                    { id: 104, name: "Мясо и рыба", icon: "🍖", amount: 0 },
                    { id: 105, name: "Фрукты и овощи", icon: "🍎", amount: 0 }
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
                    { id: 203, name: "Общественный", icon: "🚌", amount: 0 },
                    { id: 204, name: "Парковка", icon: "🅿️", amount: 0 }
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
                    { id: 303, name: "Ремонт", icon: "🛠️", amount: 0 },
                    { id: 304, name: "Мебель", icon: "🛋️", amount: 0 }
                ]
            },
            { 
                id: 4, 
                name: "Связь/интернет", 
                amount: 0, 
                icon: "📱",
                subcategories: [
                    { id: 401, name: "Мобильная связь", icon: "📱", amount: 0 },
                    { id: 402, name: "Интернет", icon: "🌐", amount: 0 },
                    { id: 403, name: "Телевидение", icon: "📺", amount: 0 }
                ]
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
            },
            { 
                id: 6, 
                name: "Здоровье", 
                amount: 0, 
                icon: "🏥",
                subcategories: [
                    { id: 601, name: "Лекарства", icon: "💊", amount: 0 },
                    { id: 602, name: "Врачи", icon: "👨‍⚕️", amount: 0 },
                    { id: 603, name: "Стоматолог", icon: "🦷", amount: 0 }
                ]
            },
            { 
                id: 7, 
                name: "Развлечения", 
                amount: 0, 
                icon: "🎮",
                subcategories: [
                    { id: 701, name: "Кино", icon: "🎬", amount: 0 },
                    { id: 702, name: "Рестораны", icon: "🍽️", amount: 0 },
                    { id: 703, name: "Кафе", icon: "☕", amount: 0 }
                ]
            },
            { 
                id: 8, 
                name: "Образование", 
                amount: 0, 
                icon: "📚",
                subcategories: [
                    { id: 801, name: "Книги", icon: "📖", amount: 0 },
                    { id: 802, name: "Курсы", icon: "🎓", amount: 0 },
                    { id: 803, name: "Семинары", icon: "💡", amount: 0 }
                ]
            },
            { 
                id: 9, 
                name: "Красота", 
                amount: 0, 
                icon: "💅",
                subcategories: [
                    { id: 901, name: "Парикмахерская", icon: "💇", amount: 0 },
                    { id: 902, name: "Косметика", icon: "💄", amount: 0 },
                    { id: 903, name: "Спа", icon: "🧖", amount: 0 }
                ]
            },
            { 
                id: 10, 
                name: "Подарки", 
                amount: 0, 
                icon: "🎁",
                subcategories: [
                    { id: 1001, name: "Дни рождения", icon: "🎂", amount: 0 },
                    { id: 1002, name: "Праздники", icon: "🎄", amount: 0 },
                    { id: 1003, name: "Цветы", icon: "💐", amount: 0 }
                ]
            },
            { 
                id: 11, 
                name: "Путешествия", 
                amount: 0, 
                icon: "✈️",
                subcategories: [
                    { id: 1101, name: "Авиабилеты", icon: "✈️", amount: 0 },
                    { id: 1102, name: "Отели", icon: "🏨", amount: 0 },
                    { id: 1103, name: "Туры", icon: "🗺️", amount: 0 }
                ]
            },
            { 
                id: 12, 
                name: "Автомобиль", 
                amount: 0, 
                icon: "🚙",
                subcategories: [
                    { id: 1201, name: "Страховка", icon: "📋", amount: 0 },
                    { id: 1202, name: "Техобслуживание", icon: "🔧", amount: 0 },
                    { id: 1203, name: "Шиномонтаж", icon: "🌀", amount: 0 }
                ]
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
}