// Инициализация базы данных
let db;
const DB_NAME = 'BudgetCalculator';
const DB_VERSION = 1; // Возвращаем к версии 1

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
            
            // Создание хранилищ для категорий, если они не существуют
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
            }
            
            if (!db.objectStoreNames.contains('operations')) {
                const operationStore = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
                operationStore.createIndex('date', 'date', { unique: false });
                operationStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
};

// Функция для инициализации базовых категорий расходов
const initializeDefaultExpenses = async () => {
    try {
        const existingExpenses = await getAllItems('expenses');
        
        // Если категории расходов уже есть, не добавляем базовые
        if (existingExpenses.length > 0) {
            return;
        }
        
        // Базовые категории расходов
        const basicExpenses = [
            { name: 'Продукты', amount: 0, icon: '🛒', subcategories: [] },
            { name: 'Транспорт', amount: 0, icon: '🚗', subcategories: [] },
            { name: 'Жилье', amount: 0, icon: '🏠', subcategories: [] },
            { name: 'Коммуналка', amount: 0, icon: '💡', subcategories: [] },
            { name: 'Одежда', amount: 0, icon: '👕', subcategories: [] },
            { name: 'Развлечения', amount: 0, icon: '🎬', subcategories: [] },
            { name: 'Здоровье', amount: 0, icon: '💊', subcategories: [] },
            { name: 'Образование', amount: 0, icon: '📚', subcategories: [] },
            { name: 'Рестораны', amount: 0, icon: '🍔', subcategories: [] },
            { name: 'Подарки', amount: 0, icon: '🎁', subcategories: [] },
            { name: 'Путешествия', amount: 0, icon: '✈️', subcategories: [] },
            { name: 'Прочее', amount: 0, icon: '📦', subcategories: [] }
        ];
        
        // Добавляем все базовые категории
        for (const expense of basicExpenses) {
            await addItem('expenses', expense);
        }
        
        console.log('Базовые категории расходов инициализированы');
    } catch (error) {
        console.error('Ошибка инициализации базовых категорий:', error);
    }
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
            if (item) {
                Object.assign(item, updates);
                const putRequest = store.put(item);
                
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(putRequest.result);
            } else {
                reject(new Error('Элемент не найден'));
            }
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
        
        // Инициализируем базовые категории расходов
        await initializeDefaultExpenses();
        
        // Загружаем данные
        await loadData();
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
    
    // Добавляем поля для ввода произвольных иконок
    const categoryModal = document.getElementById('categoryModal');
    const subcategoryModal = document.getElementById('subcategoryModal');
    
    // Создаем поле для ввода иконки в модальном окне категории
    const customIconInput = document.createElement('input');
    customIconInput.type = 'text';
    customIconInput.id = 'customIconInput';
    customIconInput.placeholder = 'Или введите эмодзи с клавиатуры';
    customIconInput.maxLength = 2;
    categoryModal.querySelector('form').insertBefore(customIconInput, categoryModal.querySelector('button'));
    
    // Создаем поле для ввода иконки в модальном окне подкатегории
    const customSubIconInput = document.createElement('input');
    customSubIconInput.type = 'text';
    customSubIconInput.id = 'customSubIconInput';
    customSubIconInput.placeholder = 'Или введите эмодзи с клавиатуры';
    customSubIconInput.maxLength = 2;
    subcategoryModal.querySelector('form').insertBefore(customSubIconInput, subcategoryModal.querySelector('button'));
    
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
        
        // Вычисляем общую сумму категории (основная + подкатегории)
        let totalAmount = category.amount || 0;
        if (category.subcategories && category.subcategories.length > 0) {
            totalAmount += category.subcategories.reduce((sum, sub) => sum + (sub.amount || 0), 0);
        }
        
        let amountDisplay = `${totalAmount} ₽`;
        let progressBar = '';
        
        if (type === 'debt') {
            const progress = (category.paidAmount || 0) / category.amount * 100;
            progressBar = `
                <div class="debt-progress">
                    <div class="debt-progress-bar" style="width: ${progress}%"></div>
                </div>
            `;
            amountDisplay = `${category.paidAmount || 0} / ${category.amount} ₽`;
        }
        
        categoryCard.innerHTML = `
            <div class="category-icon">
                <span>${category.icon || '💰'}</span>
            </div>
            <div class="category-amount">${amountDisplay}</div>
            <div class="category-name">${category.name}</div>
            ${progressBar}
            <div class="category-actions">
                <button class="edit-category-btn" data-id="${category.id}" data-type="${type}">✏️</button>
                <button class="add-subcategory-btn" data-id="${category.id}" data-type="${type}">+</button>
            </div>
        `;
        
        // Добавляем обработчики событий для категорий
        if (type === 'debt') {
            categoryCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-category-btn')) {
                    openDebtPaymentModal(category);
                }
            });
        } else {
            categoryCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('edit-category-btn') && 
                    !e.target.classList.contains('add-subcategory-btn')) {
                    openCategoryDetailModal(category, type);
                }
            });
        }
        
        // Обработчики для кнопок редактирования и добавления подкатегорий
        const editBtn = categoryCard.querySelector('.edit-category-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCategoryDetailModal(category, type);
        });
        
        if (type !== 'debt') {
            const addSubBtn = categoryCard.querySelector('.add-subcategory-btn');
            addSubBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubcategoryModal(category, type);
            });
        }
        
        container.appendChild(categoryCard);
    });
};

// Функция для открытия детального просмотра категории
const openCategoryDetailModal = (category, type) => {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    const typeField = document.getElementById('categoryType');
    const idField = document.getElementById('categoryId');
    
    // Заполняем форму данными категории
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryAmount').value = category.amount || 0;
    
    // Устанавливаем иконку
    const icon = category.icon || '💰';
    document.getElementById('selectedIcon').value = icon;
    document.getElementById('customIconInput').value = icon;
    
    // Сбрасываем выделение иконок
    modal.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-icon') === icon) {
            option.classList.add('selected');
        }
    });
    
    // Устанавливаем тип категории и ID
    typeField.value = type;
    idField.value = category.id;
    
    // Устанавливаем заголовок
    title.textContent = `Редактировать ${type === 'income' ? 'доход' : 'расход'}`;
    
    modal.style.display = 'flex';
};

const openCategoryModal = (type) => {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    const typeField = document.getElementById('categoryType');
    
    // Сбрасываем форму
    form.reset();
    document.getElementById('categoryAmount').value = 0; // По умолчанию 0
    document.getElementById('categoryId').value = '';
    
    // Сбрасываем выделение иконок
    modal.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем первую иконку по умолчанию
    const firstIcon = modal.querySelector('.icon-option');
    if (firstIcon) {
        firstIcon.classList.add('selected');
        document.getElementById('selectedIcon').value = firstIcon.getAttribute('data-icon');
    }
    
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
    
    // Сбрасываем форму
    modal.querySelector('form').reset();
    
    // Сбрасываем выделение иконок
    modal.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем первую иконку по умолчанию
    const firstIcon = modal.querySelector('.icon-option');
    if (firstIcon) {
        firstIcon.classList.add('selected');
        document.getElementById('selectedSubIcon').value = firstIcon.getAttribute('data-icon');
    }
    
    title.textContent = `Добавить подкатегорию для ${parentCategory.name}`;
    parentIdField.value = parentCategory.id;
    
    modal.style.display = 'flex';
};

const openDebtPaymentModal = (debt) => {
    const modal = document.getElementById('debtPaymentModal');
    const remainingField = document.getElementById('debtRemaining');
    const debtIdField = document.getElementById('debtId');
    
    const remaining = debt.amount - (debt.paidAmount || 0);
    remainingField.textContent = remaining;
    debtIdField.value = debt.id;
    
    modal.style.display = 'flex';
};

const handleCategorySubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const name = document.getElementById('categoryName').value;
    const amount = parseFloat(document.getElementById('categoryAmount').value) || 0;
    const customIcon = document.getElementById('customIconInput').value;
    const defaultIcon = document.getElementById('selectedIcon').value;
    const icon = customIcon || defaultIcon || '💰';
    const type = document.getElementById('categoryType').value;
    const id = document.getElementById('categoryId').value;
    
    try {
        let storeName;
        let categoryData = { name, amount, icon };
        
        // Для расходов добавляем массив подкатегорий, если его нет
        if (type === 'expense' && !id) {
            categoryData.subcategories = [];
        }
        
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
        
        if (id) {
            // Редактируем существующую категорию
            await updateItem(storeName, parseInt(id), categoryData);
        } else {
            // Создаем новую категорию
            await addItem(storeName, categoryData);
        }
        
        // Добавляем операцию только если сумма не равна 0
        if (amount > 0) {
            const operation = {
                type,
                name,
                amount,
                date: new Date().toISOString()
            };
            
            await addItem('operations', operation);
        }
        
        // Закрываем модальное окно и обновляем данные
        document.getElementById('categoryModal').style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Ошибка добавления/редактирования категории:', error);
        alert('Ошибка при сохранении категории. Проверьте консоль для подробностей.');
    }
};

const handleSubcategorySubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const name = document.getElementById('subcategoryName').value;
    const amount = parseFloat(document.getElementById('subcategoryAmount').value) || 0;
    const customIcon = document.getElementById('customSubIconInput').value;
    const defaultIcon = document.getElementById('selectedSubIcon').value;
    const icon = customIcon || defaultIcon || '🍔';
    const parentId = parseInt(document.getElementById('parentCategoryId').value);
    
    try {
        // Получаем родительскую категорию
        const parentCategory = await new Promise((resolve, reject) => {
            const transaction = db.transaction(['expenses'], 'readwrite');
            const expenseStore = transaction.objectStore('expenses');
            const getRequest = expenseStore.get(parentId);
            
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => resolve(getRequest.result);
        });
        
        if (!parentCategory) {
            throw new Error('Родительская категория не найдена');
        }
        
        // Создаем подкатегорию
        const subcategory = {
            id: Date.now(), // Простой ID на основе времени
            name,
            amount,
            icon
        };
        
        // Добавляем подкатегорию в массив подкатегорий родительской категории
        if (!parentCategory.subcategories) {
            parentCategory.subcategories = [];
        }
        
        parentCategory.subcategories.push(subcategory);
        
        // Обновляем родительскую категорию
        await updateItem('expenses', parentId, parentCategory);
        
        // Добавляем операцию
        const operation = {
            type: 'expense',
            name: `${parentCategory.name}: ${name}`,
            amount,
            date: new Date().toISOString(),
            parentId
        };
        
        await addItem('operations', operation);
        
        // Закрываем модальное окно
        document.getElementById('subcategoryModal').style.display = 'none';
        
        // Обновляем баланс и данные
        loadData();
    } catch (error) {
        console.error('Ошибка добавления подкатегории:', error);
        alert('Ошибка при добавлении подкатегории. Проверьте консоль для подробностей.');
    }
};

const handleDebtPaymentSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const debtId = parseInt(document.getElementById('debtId').value);
    
    try {
        // Получаем информацию о долге
        const debt = await new Promise((resolve, reject) => {
            const transaction = db.transaction(['debts'], 'readwrite');
            const debtStore = transaction.objectStore('debts');
            const getRequest = debtStore.get(debtId);
            
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => resolve(getRequest.result);
        });
        
        if (!debt) {
            throw new Error('Долг не найден');
        }
        
        const newPaidAmount = (debt.paidAmount || 0) + paymentAmount;
        
        // Проверяем, не превышает ли выплата общую сумму долга
        if (newPaidAmount > debt.amount) {
            alert('Сумма выплаты превышает остаток долга!');
            return;
        }
        
        // Обновляем долг
        await updateItem('debts', debtId, { paidAmount: newPaidAmount });
        
        // Добавляем операцию выплаты
        const operation = {
            type: 'debt_payment',
            name: `Выплата по долгу: ${debt.name}`,
            amount: paymentAmount,
            date: new Date().toISOString()
        };
        
        await addItem('operations', operation);
        
        // Закрываем модальное окно и обновляем данные
        document.getElementById('debtPaymentModal').style.display = 'none';
        loadData();
    } catch (error) {
        console.error('Ошибка выплаты долга:', error);
        alert('Ошибка при выплате долга. Проверьте консоль для подробностей.');
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
            
            // Определяем класс для суммы в зависимости от типа операции
            let amountClass = 'operation-amount';
            if (operation.type === 'income') {
                amountClass += ' income-amount';
            } else if (operation.type === 'expense' || operation.type === 'debt_payment') {
                amountClass += ' expense-amount';
            }
            
            operationItem.innerHTML = `
                <div class="operation-info">
                    <div class="operation-name">${operation.name}</div>
                    <div class="operation-date">${formattedDate}</div>
                </div>
                <div class="${amountClass}">${operation.type === 'income' ? '+' : '-'}${operation.amount} ₽</div>
                <div class="operation-actions">
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            
            // Добавляем обработчики для кнопок удаления
            const deleteBtn = operationItem.querySelector('.delete-btn');
            
            deleteBtn.addEventListener('click', () => {
                deleteOperation(operation);
            });
            
            operationsList.appendChild(operationItem);
        });
    } catch (error) {
        console.error('Ошибка загрузки операций:', error);
    }
};

const deleteOperation = async (operation) => {
    if (confirm(`Удалить операцию "${operation.name}"?`)) {
        try {
            await deleteItem('operations', operation.id);
            
            // Если это операция расхода с подкатегорией, удаляем также подкатегорию
            if (operation.parentId) {
                const parentCategory = await new Promise((resolve, reject) => {
                    const transaction = db.transaction(['expenses'], 'readwrite');
                    const expenseStore = transaction.objectStore('expenses');
                    const getRequest = expenseStore.get(operation.parentId);
                    
                    getRequest.onerror = () => reject(getRequest.error);
                    getRequest.onsuccess = () => resolve(getRequest.result);
                });
                
                if (parentCategory && parentCategory.subcategories) {
                    // Находим подкатегорию по имени (часть имени после ": ")
                    const subcategoryName = operation.name.split(': ')[1];
                    parentCategory.subcategories = parentCategory.subcategories.filter(
                        sub => sub.name !== subcategoryName
                    );
                    
                    await updateItem('expenses', operation.parentId, parentCategory);
                }
            }
            
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
        const debts = await getAllItems('debts');
        
        // Суммируем доходы (только с ненулевой суммой)
        const totalIncome = incomes.reduce((sum, income) => {
            return sum + (income.amount > 0 ? income.amount : 0);
        }, 0);
        
        // Суммируем расходы (основные + подкатегории)
        const totalExpense = expenses.reduce((sum, expense) => {
            let categoryTotal = expense.amount || 0;
            
            // Добавляем суммы подкатегорий
            if (expense.subcategories && expense.subcategories.length > 0) {
                categoryTotal += expense.subcategories.reduce((subSum, sub) => {
                    return subSum + (sub.amount || 0);
                }, 0);
            }
            
            return sum + categoryTotal;
        }, 0);
        
        // Суммируем выплаты по долгам
        const totalDebtPayments = debts.reduce((sum, debt) => sum + (debt.paidAmount || 0), 0);
        
        // Рассчитываем баланс: доходы - расходы - выплаты по долгам
        const balance = totalIncome - totalExpense - totalDebtPayments;
        
        // Обновляем отображение баланса
        const balanceElement = document.getElementById('balanceAmount');
        balanceElement.textContent = `${balance} ₽`;
        
        // Добавляем класс для цвета в зависимости от баланса
        balanceElement.className = 'balance-amount';
        if (balance > 0) {
            balanceElement.classList.add('positive');
        } else if (balance < 0) {
            balanceElement.classList.add('negative');
        }
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
    }
};