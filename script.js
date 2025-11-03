// Инициализация базы данных
let db;
const DB_NAME = 'BudgetCalculator';
const DB_VERSION = 1;

class Database {
    static async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилища если их нет
                if (!db.objectStoreNames.contains('incomes')) {
                    db.createObjectStore('incomes', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('debts')) {
                    db.createObjectStore('debts', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                    
                    // Добавляем базовые категории расходов
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
                    
                    basicExpenses.forEach(expense => {
                        expenseStore.add(expense);
                    });
                }
                
                if (!db.objectStoreNames.contains('operations')) {
                    db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    static async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    static async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    static async update(storeName, id, data) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(id);
            
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    const updatedItem = { ...item, ...data };
                    const putRequest = store.put(updatedItem);
                    
                    putRequest.onerror = () => reject(putRequest.error);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                } else {
                    reject(new Error('Item not found'));
                }
            };
        });
    }

    static async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// Основная логика приложения
class BudgetApp {
    constructor() {
        this.currentEditingCategory = null;
        this.init();
    }

    async init() {
        try {
            await Database.init();
            console.log('База данных инициализирована');
            this.setupEventListeners();
            await this.loadData();
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        }
    }

    setupEventListeners() {
        // Настройка вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Настройка модальных окон
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Настройка выбора иконок
        document.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const parentModal = e.target.closest('.modal-content');
                const iconField = parentModal.querySelector('input[type="hidden"]');
                
                parentModal.querySelectorAll('.icon-option').forEach(icon => {
                    icon.classList.remove('selected');
                });
                
                e.target.classList.add('selected');
                iconField.value = e.target.getAttribute('data-icon');
            });
        });

        // Настройка кнопок добавления
        document.getElementById('addIncome').addEventListener('click', () => {
            this.openCategoryModal('income');
        });
        
        document.getElementById('addDebt').addEventListener('click', () => {
            this.openCategoryModal('debt');
        });
        
        document.getElementById('addExpense').addEventListener('click', () => {
            this.openCategoryModal('expense');
        });

        // Настройка форм
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.handleCategorySubmit(e));
        document.getElementById('subcategoryForm').addEventListener('submit', (e) => this.handleSubcategorySubmit(e));
        document.getElementById('debtPaymentForm').addEventListener('submit', (e) => this.handleDebtPaymentSubmit(e));
    }

    switchTab(tabName) {
        // Убираем активный класс у всех вкладок и контента
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранной вкладке и контенту
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Если открыта вкладка операций, загружаем операции
        if (tabName === 'operations') {
            this.loadOperations();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentEditingCategory = null;
    }

    async loadData() {
        try {
            const [incomes, debts, expenses] = await Promise.all([
                Database.getAll('incomes'),
                Database.getAll('debts'),
                Database.getAll('expenses')
            ]);
            
            this.renderCategories('incomeCategories', incomes, 'income');
            this.renderCategories('debtCategories', debts, 'debt');
            this.renderCategories('expenseCategories', expenses, 'expense');
            
            this.updateBalance();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    renderCategories(containerId, categories, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        // Добавляем кнопку создания новой категории (кроме расходов, где есть базовые)
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
                this.openCategoryModal(type);
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
                const paid = category.paidAmount || 0;
                const total = category.amount || 0;
                const progress = total > 0 ? (paid / total * 100) : 0;
                progressBar = `
                    <div class="debt-progress">
                        <div class="debt-progress-bar" style="width: ${progress}%"></div>
                    </div>
                `;
                amountDisplay = `${paid} / ${total} ₽`;
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
                    ${type !== 'debt' ? `<button class="add-subcategory-btn" data-id="${category.id}" data-type="${type}">+</button>` : ''}
                </div>
            `;
            
            // Добавляем обработчики событий для категорий
            if (type === 'debt') {
                categoryCard.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-category-btn')) {
                        this.openDebtPaymentModal(category);
                    }
                });
            } else {
                categoryCard.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-category-btn') && 
                        !e.target.classList.contains('add-subcategory-btn')) {
                        this.openCategoryDetailModal(category, type);
                    }
                });
            }
            
            // Обработчики для кнопок редактирования и добавления подкатегорий
            const editBtn = categoryCard.querySelector('.edit-category-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openCategoryDetailModal(category, type);
            });
            
            if (type !== 'debt') {
                const addSubBtn = categoryCard.querySelector('.add-subcategory-btn');
                addSubBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSubcategoryModal(category, type);
                });
            }
            
            container.appendChild(categoryCard);
        });
    }

    openCategoryModal(type) {
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('categoryForm');
        const typeField = document.getElementById('categoryType');
        
        // Сбрасываем форму
        form.reset();
        document.getElementById('categoryAmount').value = 0;
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
        
        // Устанавливаем заголовок
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
    }

    openCategoryDetailModal(category, type) {
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('modalTitle');
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
        
        // Сохраняем текущую редактируемую категорию
        this.currentEditingCategory = category;
        
        // Устанавливаем заголовок
        title.textContent = `Редактировать ${type === 'income' ? 'доход' : 'расход'}`;
        
        modal.style.display = 'flex';
    }

    openSubcategoryModal(parentCategory, type) {
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
    }

    openDebtPaymentModal(debt) {
        const modal = document.getElementById('debtPaymentModal');
        const remainingField = document.getElementById('debtRemaining');
        const debtIdField = document.getElementById('debtId');
        
        const remaining = debt.amount - (debt.paidAmount || 0);
        remainingField.textContent = remaining;
        debtIdField.value = debt.id;
        
        modal.style.display = 'flex';
    }

    async handleCategorySubmit(event) {
        event.preventDefault();
        
        const name = document.getElementById('categoryName').value;
        const amount = parseFloat(document.getElementById('categoryAmount').value) || 0;
        const customIcon = document.getElementById('customIconInput').value;
        const defaultIcon = document.getElementById('selectedIcon').value;
        const icon = customIcon || defaultIcon || '💰';
        const type = document.getElementById('categoryType').value;
        const id = document.getElementById('categoryId').value;
        
        if (!name.trim()) {
            this.showError('Введите название категории');
            return;
        }
        
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
                    // Сохраняем подкатегории при редактировании
                    if (id && this.currentEditingCategory && this.currentEditingCategory.subcategories) {
                        categoryData.subcategories = this.currentEditingCategory.subcategories;
                    } else {
                        categoryData.subcategories = [];
                    }
                    break;
            }
            
            if (id) {
                // Редактируем существующую категорию
                await Database.update(storeName, parseInt(id), categoryData);
            } else {
                // Создаем новую категорию
                await Database.add(storeName, categoryData);
            }
            
            // Добавляем операцию только если сумма не равна 0
            if (amount > 0) {
                const operation = {
                    type,
                    name,
                    amount,
                    date: new Date().toISOString()
                };
                
                await Database.add('operations', operation);
            }
            
            // Закрываем модальное окно и обновляем данные
            this.closeAllModals();
            await this.loadData();
            this.showSuccess('Категория сохранена');
        } catch (error) {
            console.error('Ошибка сохранения категории:', error);
            this.showError('Ошибка сохранения категории');
        }
    }

    async handleSubcategorySubmit(event) {
        event.preventDefault();
        
        const name = document.getElementById('subcategoryName').value;
        const amount = parseFloat(document.getElementById('subcategoryAmount').value) || 0;
        const customIcon = document.getElementById('customSubIconInput').value;
        const defaultIcon = document.getElementById('selectedSubIcon').value;
        const icon = customIcon || defaultIcon || '🍔';
        const parentId = parseInt(document.getElementById('parentCategoryId').value);
        
        if (!name.trim()) {
            this.showError('Введите название подкатегории');
            return;
        }
        
        try {
            // Получаем родительскую категорию
            const parentCategory = await Database.getAll('expenses').then(expenses => 
                expenses.find(exp => exp.id === parentId)
            );
            
            if (!parentCategory) {
                throw new Error('Родительская категория не найдена');
            }
            
            // Создаем подкатегорию
            const subcategory = {
                id: Date.now(),
                name,
                amount,
                icon
            };
            
            // Добавляем подкатегорию в массив подкатегорий родительской категории
            const updatedSubcategories = [...(parentCategory.subcategories || []), subcategory];
            
            // Обновляем родительскую категорию
            await Database.update('expenses', parentId, {
                subcategories: updatedSubcategories
            });
            
            // Добавляем операцию
            const operation = {
                type: 'expense',
                name: `${parentCategory.name}: ${name}`,
                amount,
                date: new Date().toISOString(),
                parentId
            };
            
            await Database.add('operations', operation);
            
            // Закрываем модальное окно
            this.closeAllModals();
            
            // Обновляем баланс и данные
            await this.loadData();
            this.showSuccess('Подкатегория добавлена');
        } catch (error) {
            console.error('Ошибка добавления подкатегории:', error);
            this.showError('Ошибка добавления подкатегории');
        }
    }

    async handleDebtPaymentSubmit(event) {
        event.preventDefault();
        
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const debtId = parseInt(document.getElementById('debtId').value);
        
        if (!paymentAmount || paymentAmount <= 0) {
            this.showError('Введите корректную сумму выплаты');
            return;
        }
        
        try {
            // Получаем информацию о долге
            const debts = await Database.getAll('debts');
            const debt = debts.find(d => d.id === debtId);
            
            if (!debt) {
                throw new Error('Долг не найден');
            }
            
            const newPaidAmount = (debt.paidAmount || 0) + paymentAmount;
            
            // Проверяем, не превышает ли выплата общую сумму долга
            if (newPaidAmount > debt.amount) {
                this.showError('Сумма выплаты превышает остаток долга!');
                return;
            }
            
            // Обновляем долг
            await Database.update('debts', debtId, { paidAmount: newPaidAmount });
            
            // Добавляем операцию выплаты
            const operation = {
                type: 'debt_payment',
                name: `Выплата по долгу: ${debt.name}`,
                amount: paymentAmount,
                date: new Date().toISOString()
            };
            
            await Database.add('operations', operation);
            
            // Закрываем модальное окно и обновляем данные
            this.closeAllModals();
            await this.loadData();
            this.showSuccess('Выплата внесена');
        } catch (error) {
            console.error('Ошибка выплаты долга:', error);
            this.showError('Ошибка при внесении выплаты');
        }
    }

    async loadOperations() {
        try {
            const operations = await Database.getAll('operations');
            const operationsList = document.getElementById('operationsList');
            operationsList.innerHTML = '';
            
            // Сортируем операции по дате (новые сверху)
            operations.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (operations.length === 0) {
                operationsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">Нет операций</div>
                    </div>
                `;
                return;
            }
            
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
                        <button class="delete-btn" data-id="${operation.id}">🗑️</button>
                    </div>
                `;
                
                // Добавляем обработчики для кнопок удаления
                const deleteBtn = operationItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    this.deleteOperation(operation);
                });
                
                operationsList.appendChild(operationItem);
            });
        } catch (error) {
            console.error('Ошибка загрузки операций:', error);
            this.showError('Ошибка загрузки операций');
        }
    }

    async deleteOperation(operation) {
        if (confirm(`Удалить операцию "${operation.name}"?`)) {
            try {
                await Database.delete('operations', operation.id);
                
                // Если это операция расхода с подкатегорией, удаляем также подкатегорию
                if (operation.parentId) {
                    const expenses = await Database.getAll('expenses');
                    const parentCategory = expenses.find(exp => exp.id === operation.parentId);
                    
                    if (parentCategory && parentCategory.subcategories) {
                        // Находим подкатегорию по имени (часть имени после ": ")
                        const subcategoryName = operation.name.split(': ')[1];
                        const updatedSubcategories = parentCategory.subcategories.filter(
                            sub => sub.name !== subcategoryName
                        );
                        
                        await Database.update('expenses', operation.parentId, {
                            subcategories: updatedSubcategories
                        });
                    }
                }
                
                await this.loadOperations();
                await this.updateBalance();
                this.showSuccess('Операция удалена');
            } catch (error) {
                console.error('Ошибка удаления операции:', error);
                this.showError('Ошибка удаления операции');
            }
        }
    }

    async updateBalance() {
        try {
            const [incomes, expenses, debts] = await Promise.all([
                Database.getAll('incomes'),
                Database.getAll('expenses'),
                Database.getAll('debts')
            ]);
            
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
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем в body
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new BudgetApp();
});