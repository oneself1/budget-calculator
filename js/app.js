class FinanceApp {
    constructor() {
        this.db = new Database();
        this.settings = {};
        this.categories = { income: [], expense: [] };
        this.transactions = [];
        this.debts = [];
        this.goals = [];
        this.currentModal = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing Finance App...');
            
            if (this.isInitialized) {
                console.log('⚠️ App already initialized');
                return;
            }

            // Проверяем поддержку IndexedDB
            if (!window.indexedDB) {
                throw new Error('Ваш браузер не поддерживает IndexedDB. Приложение не может работать.');
            }

            // Инициализируем базу данных
            await this.db.init();
            
            // Загружаем данные
            await this.loadData();
            
            // Инициализируем UI
            this.initUI();
            
            // Запускаем часы
            this.startClock();
            
            this.isInitialized = true;
            console.log('✅ Finance App initialized successfully');
            Toast.success('Приложение загружено');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            Toast.error('Ошибка загрузки приложения: ' + error.message);
            
            // Показываем запасной интерфейс если база данных не работает
            this.showFallbackUI();
        }
    }

    async loadData() {
        try {
            console.log('📥 Loading data...');
            
            // Загружаем настройки
            this.settings = await this.db.getSettings();
            console.log('Settings loaded:', this.settings);
            
            // Загружаем категории
            this.categories.income = await this.db.getCategoriesByType('income');
            this.categories.expense = await this.db.getCategoriesByType('expense');
            console.log('Categories loaded:', this.categories);
            
            // Загружаем транзакции
            this.transactions = await this.db.getAll('transactions');
            console.log('Transactions loaded:', this.transactions.length);
            
            // Загружаем долги
            this.debts = await this.db.getAll('debts');
            console.log('Debts loaded:', this.debts.length);
            
            // Загружаем цели
            this.goals = await this.db.getAll('goals');
            console.log('Goals loaded:', this.goals.length);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw new Error('Не удалось загрузить данные: ' + error.message);
        }
    }

    showFallbackUI() {
        // Показываем сообщение об ошибке
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            mainScreen.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h2>Ошибка загрузки</h2>
                    <p>Не удалось загрузить приложение. Пожалуйста, обновите страницу.</p>
                    <button onclick="location.reload()" class="btn primary">Обновить</button>
                </div>
            `;
        }
    }

    // ... остальные методы остаются без изменений
}
