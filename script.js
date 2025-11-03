// Инициализация базы данных
let db;
const DB_NAME = 'BudgetCalculator';
const DB_VERSION = 1;

// Открытие/создание базы данных
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Создание хранилищ для категорий
            if (!db.objectStoreNames.contains('incomes')) {
                const incomeStore = db.createObjectStore('incomes', { keyPath: 'id', autoIncrement: true });
                incomeStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('debts')) {
                const debtStore = db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                debtStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('expenses')) {
                const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                expenseStore.createIndex('name', 'name', { unique: false });
                
                // Добавление базовых категорий расходов
                const basicExpenses = [
                    { name: 'Продукты', amount: 0, icon: '🛒' },
                    { name: 'Транспорт', amount: 0, icon: '🚗' },
                    { name: 'Жилье', amount: 0, icon: '🏠' },
                    { name: 'Коммуналка', amount: 0, icon: '💡' },
                    { name: 'Одежда', amount: 0, icon: '👕' },
                    { name: 'Развлечения', amount: 0, icon: '🎬' },
                    { name: 'Здоровье', amount: 0, icon: '💊' },
                    { name: 'Образование', amount: 0, icon: '📚' },
                    { name: 'Рестораны', amount: 0, icon: '🍔' },
                    { name: 'Подарки', amount: 0, icon: '🎁' },
                    { name: 'Путешествия', amount: 0, icon: '✈️' },
                    { name: 'Прочее', amount: 0, icon: '📦' }
                ];
                
                const transaction = event.target.transaction;
                const store = transaction.objectStore('expenses');
                
                basicExpenses.forEach(expense => {
                    store.add(expense);
                });
            }
            
            if (!db.objectStoreNames.contains('subcategories')) {
                const subcategoryStore = db.createObjectStore('subcategories', { keyPath: 'id', autoIncrement: true });
                subcategoryStore.createIndex('parentId', 'parentId', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('operations')) {
                const operationStore = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
                operationStore.createIndex('date', 'date', { unique: false });
                operationStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
};

// Функции для работы с хранилищами
const addItem = (storeName, item) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

const getAllItems = (storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

const updateItem = (storeName, id, updates) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);
        
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            Object.assign(item, updates);
            const putRequest = store.put(item);
            
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve(putRequest.result);
        };
    });
};

const deleteItem = (storeName, id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

// Основная логика приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация базы данных
    try {
        await initDB();
        console.log('База данных инициализирована');
        loadData();
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
    }
    
    // Настройка вкладок
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Убираем активный класс у всех вкладок и контента
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Добавляем активный класс к выбранной вкладке и контенту
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Если открыта вкладка операций, загружаем операции
            if (tabName === 'operations') {
                loadOperations();
            }
        });
    });
    
    // Настройка модальных окон
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Настройка выбора иконок
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            const parentModal = option.closest('.modal-content');
            const iconField = parentModal.querySelector('input[type="hidden"]');
            
            // Убираем выделение у всех иконок в этом модальном окне
            parentModal.querySelectorAll('.icon-option').forEach(icon => {
                icon.classList.remove('selected');
            });
            
            // Выделяем выбранную иконку
            option.classList.add('selected');
            iconField.value = option.getAttribute('data-icon');
        });
    });
    
    // Настройка кнопок добавления
    document.getElementById('addIncome').addEventListener('click', () => {
        openCategoryModal('income');
    });
    
    document.getElementById('addDebt').addEventListener('click', () => {
        openCategoryModal('debt');
    });
    
    document.getElementById('addExpense').addEventListener('click', () => {
        openCategoryModal('expense');
    });
    
    // Настройка форм
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('subcategoryForm').addEventListener('submit', handleSubcategorySubmit);
    document.getElementById('debtPaymentForm').addEventListener('submit', handleDebtPaymentSubmit);
});

// Функции для работы с данными
const loadData = async () => {
    try {
        // Загрузка категорий доходов
        const incomes = await getAllItems('incomes');
        renderCategories('incomeCategories', incomes, 'income');
        
        // Загрузка долгов
        const debts = await getAllItems('debts');
        renderCategories('debtCategories', debts, 'debt');
        
        // Загрузка расходов
        const expenses = await getAllItems('expenses');
        renderCategories('expenseCategories', expenses, 'expense');
        
        // Обновление баланса
        updateBalance();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
};

const renderCategories = (containerId, categories, type) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Добавляем кнопку создания новой категории
    if (type !== 'expense') {
        const addCard = document.createElement('div');
        addCard.className = 'category-card';
        addCard.innerHTML = `
            <div class="category-icon" style="background-color: #c7c7cc;">
                <span>+</span>
            </div>
            <div class="category-name">Добавить</div>
        `;
        addCard.addEventListener('click', () => {
            openCategoryModal(type);
        });
        container.appendChild(addCard);
    }
    
    // Отображаем категории
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        let amountDisplay = `${category.amount} ₽`;
        let progressBar = '';
        
        if (type === 'debt') {
            const progress = category.paidAmount / category.amount * 100;
            progressBar = `
                <div class="debt-progress">
                    <div class="debt-progress-bar" style="width: ${progress}%"></div>
                </div>
            `;
            amountDisplay = `${category.paidAmount} / ${category.amount} ₽`;
        }
        
        categoryCard.innerHTML = `
            <div class="category-icon">
                <span>${category.icon}</span>
            </div>
            <div class="category-amount">${amountDisplay}</div>
            <div class="category-name">${category.name}</div>
            ${progressBar}
        `;
        
        // Добавляем обработчики событий для категорий
        if (type === 'debt') {
            categoryCard.addEventListener('click', () => {
                openDebtPaymentModal(category);
            });
        } else {
            categoryCard.addEventListener('click', () => {
                openSubcategoryModal(category, type);
            });
        }
        
        container.appendChild(categoryCard);
    });
};

const openCategoryModal = (type) => {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    const typeField = document.getElementById('categoryType');
    
    // Сбрасываем форму
    form.reset();
    
    // Устанавливаем тип категории
    typeField.value = type;
    
    // Устанавливаем заголовок в зависимости от типа
    switch(type) {
        case 'income':
            title.textContent = 'Добавить доход';
            break;
        case 'debt':
            title.textContent = 'Добавить долг';
            break;
        case 'expense':
            title.textContent = 'Добавить расход';
            break;
    }
    
    modal.style.display = 'flex';
};

const openSubcategoryModal = (parentCategory, type) => {
    const modal = document.getElementById('subcategoryModal');
    const title = document.getElementById('subcategoryModalTitle');
    const parentIdField = document.getElementById('parentCategoryId');
    
    title.textContent = `Добавить подкатегорию для ${parentCategory.name}`;
    parentIdField.value = parentCategory.id;
    
    modal.style.display = 'flex';
};

const openDebtPaymentModal = (debt) => {
    const modal = document.getElementById('debtPaymentModal');
    const remainingField = document.getElementById('debtRemaining');
    const debtIdField = document.getElementById('debtId');
    
    const remaining = debt.amount - debt.paidAmount;
    remainingField.textContent = remaining;
    debtIdField.value = debt.id;
    
    modal.style.display = 'flex';
};

const handleCategorySubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const name = document.getElementById('categoryName').value;
    const amount = parseFloat(document.getElementById('categoryAmount').value);
    const icon = document.getElementById('selectedIcon').value;
    const type = document.getElementById('categoryType').value;
    
    try {
        let storeName;
        let categoryData = { name, amount, icon };
        
        switch(type) {
            case 'income':
                storeName = 'incomes';
                break;
            case 'debt':
                storeName = 'debts';
                categoryData.paidAmount = 0;
                break;
            case 'expense':
                storeName = 'expenses';
                break;
        }
        
        await addItem(storeName, categoryData);
        
        // Добавляем операцию
        const operation = {
            type,
            name,
            amount,
            date: new Date().toISOString()
        };
        
        await addItem('operations', operation);
        
        // Закрываем модальное окно и обновляем данные
        document.getElementById('categoryModal').style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Ошибка добавления категории:', error);
    }
};

const handleSubcategorySubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const name = document.getElementById('subcategoryName').value;
    const amount = parseFloat(document.getElementById('subcategoryAmount').value);
    const icon = document.getElementById('selectedSubIcon').value;
    const parentId = parseInt(document.getElementById('parentCategoryId').value);
    
    try {
        const subcategory = {
            name,
            amount,
            icon,
            parentId
        };
        
        await addItem('subcategories', subcategory);
        
        // Добавляем операцию
        const operation = {
            type: 'subcategory',
            name,
            amount,
            date: new Date().toISOString(),
            parentId
        };
        
        await addItem('operations', operation);
        
        // Закрываем модальное окно
        document.getElementById('subcategoryModal').style.display = 'none';
        
        // Обновляем баланс
        updateBalance();
    } catch (error) {
        console.error('Ошибка добавления подкатегории:', error);
    }
};

const handleDebtPaymentSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const debtId = parseInt(document.getElementById('debtId').value);
    
    try {
        // Получаем информацию о долге
        const transaction = db.transaction(['debts'], 'readwrite');
        const debtStore = transaction.objectStore('debts');
        const getRequest = debtStore.get(debtId);
        
        getRequest.onsuccess = () => {
            const debt = getRequest.result;
            const newPaidAmount = debt.paidAmount + paymentAmount;
            
            // Обновляем долг
            debt.paidAmount = newPaidAmount;
            const putRequest = debtStore.put(debt);
            
            putRequest.onsuccess = () => {
                // Добавляем операцию выплаты
                const operation = {
                    type: 'debt_payment',
                    name: `Выплата по долгу: ${debt.name}`,
                    amount: paymentAmount,
                    date: new Date().toISOString()
                };
                
                addItem('operations', operation);
                
                // Закрываем модальное окно и обновляем данные
                document.getElementById('debtPaymentModal').style.display = 'none';
                loadData();
            };
        };
    } catch (error) {
        console.error('Ошибка выплаты долга:', error);
    }
};

const loadOperations = async () => {
    try {
        const operations = await getAllItems('operations');
        const operationsList = document.getElementById('operationsList');
        operationsList.innerHTML = '';
        
        // Сортируем операции по дате (новые сверху)
        operations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        operations.forEach(operation => {
            const operationItem = document.createElement('div');
            operationItem.className = 'operation-item';
            
            const date = new Date(operation.date);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            operationItem.innerHTML = `
                <div class="operation-info">
                    <div class="operation-name">${operation.name}</div>
                    <div class="operation-date">${formattedDate}</div>
                </div>
                <div class="operation-amount">${operation.amount} ₽</div>
                <div class="operation-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            
            // Добавляем обработчики для кнопок редактирования и удаления
            const editBtn = operationItem.querySelector('.edit-btn');
            const deleteBtn = operationItem.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => {
                editOperation(operation);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteOperation(operation);
            });
            
            operationsList.appendChild(operationItem);
        });
    } catch (error) {
        console.error('Ошибка загрузки операций:', error);
    }
};

const editOperation = (operation) => {
    // Реализация редактирования операции
    alert(`Редактирование операции: ${operation.name}`);
};

const deleteOperation = async (operation) => {
    if (confirm(`Удалить операцию "${operation.name}"?`)) {
        try {
            await deleteItem('operations', operation.id);
            loadOperations();
            updateBalance();
        } catch (error) {
            console.error('Ошибка удаления операции:', error);
        }
    }
};

const updateBalance = async () => {
    try {
        const incomes = await getAllItems('incomes');
        const expenses = await getAllItems('expenses');
        const subcategories = await getAllItems('subcategories');
        const debtPayments = await getAllItems('operations').then(ops => 
            ops.filter(op => op.type === 'debt_payment')
        );
        
        // Суммируем доходы
        const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0) +
                           subcategories.reduce((sum, sub) => sum + sub.amount, 0);
        
        // Суммируем расходы
        const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0) +
                            debtPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Рассчитываем баланс
        const balance = totalIncome - totalExpense;
        
        // Обновляем отображение баланса
        document.getElementById('balanceAmount').textContent = `${balance} ₽`;
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
    }
};