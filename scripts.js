// Базовые данные приложения с подкатегориями
let appData = {
    incomes: [],
    debts: [], 
    expenseCategories: [],
    expenseOperations: [],
    settings: { currency: "₽" }
};

// Предустановленные категории с подкатегориями
const defaultExpenseCategories = [
    { 
        id: 1, 
        name: "Продукты", 
        amount: 0, 
        icon: "🛒",
        subcategories: [
            { id: 101, name: "Супермаркет", icon: "🛒", amount: 0 },
            { id: 102, name: "Рынок", icon: "🥦", amount: 0 },
            { id: 103, name: "Молочные", icon: "🥛", amount: 0 }
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
            { id: 203, name: "Общественный", icon: "🚌", amount: 0 }
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
            { id: 303, name: "Ремонт", icon: "🛠️", amount: 0 }
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
        subcategories: [
            { id: 501, name: "Одежда", icon: "👕", amount: 0 },
            { id: 502, name: "Обувь", icon: "👟", amount: 0 },
            { id: 503, name: "Аксессуары", icon: "🕶️", amount: 0 }
        ]
    }
];

// Текущее состояние для редактирования
let currentState = {
    editingCategoryId: null,
    editingSubcategory: null,
    selectedCategoryId: null
};

// Основная функция инициализации
function initApp() {
    console.log("Budget App: Initializing...");
    try {
        loadData();
        updateUI();
        startClock();
        console.log("Budget App: Initialized successfully");
    } catch (error) {
        console.error("Budget App: Initialization error:", error);
        resetToDefaults();
    }
}

// Загрузка данных
function loadData() {
    try {
        const saved = localStorage.getItem('budgetAppData');
        if (saved) {
            const parsedData = JSON.parse(saved);
            
            appData = {
                ...appData,
                ...parsedData,
                incomes: parsedData.incomes || [],
                debts: parsedData.debts || [],
                expenseCategories: parsedData.expenseCategories || [],
                expenseOperations: parsedData.expenseOperations || [],
                settings: parsedData.settings || { currency: "₽" }
            };
            
            console.log("Budget App: Data loaded", {
                incomes: appData.incomes.length,
                debts: appData.debts.length, 
                expenses: appData.expenseCategories.length,
                expenseOperations: appData.expenseOperations.length
            });
            
            migrateExpenseCategories();
            updateExpenseCategoriesFromOperations();
        } else {
            appData.expenseCategories = JSON.parse(JSON.stringify(defaultExpenseCategories));
            saveData();
            console.log("Budget App: First run, default categories set");
        }
    } catch (e) {
        console.error("Budget App: Error loading data, resetting", e);
        resetToDefaults();
    }
}

// Функция миграции категорий расходов
function migrateExpenseCategories() {
    let migrated = false;
    
    defaultExpenseCategories.forEach(defaultCategory => {
        const categoryExists = appData.expenseCategories.some(
            category => category.id === defaultCategory.id
        );
        
        if (!categoryExists) {
            appData.expenseCategories.push({
                ...defaultCategory
            });
            migrated = true;
            console.log(`Budget App: Added missing category: ${defaultCategory.name}`);
        } else {
            // Обновляем существующую категорию, добавляя недостающие подкатегории
            const existingCategory = appData.expenseCategories.find(c => c.id === defaultCategory.id);
            if (existingCategory && !existingCategory.subcategories) {
                existingCategory.subcategories = defaultCategory.subcategories || [];
                migrated = true;
            }
        }
    });

    if (migrated) {
        saveData();
        console.log("Budget App: Data migrated successfully");
    }
}

// Обновление сумм категорий расходов на основе операций
function updateExpenseCategoriesFromOperations() {
    if (!appData.expenseOperations || appData.expenseOperations.length === 0) return;
    
    // Сбрасываем суммы всех категорий и подкатегорий
    appData.expenseCategories.forEach(category => {
        category.amount = 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                subcategory.amount = 0;
            });
        }
    });
    
    // Пересчитываем суммы на основе операций
    appData.expenseOperations.forEach(operation => {
        const category = appData.expenseCategories.find(c => c.id === operation.categoryId);
        if (category) {
            if (operation.subcategoryId) {
                // Операция для подкатегории
                const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                if (subcategory) {
                    subcategory.amount += operation.amount;
                }
            } else {
                // Операция для основной категории
                category.amount += operation.amount;
            }
        }
    });
    
    saveData();
}

// Сохранение данных
function saveData() {
    try {
        localStorage.setItem('budgetAppData', JSON.stringify(appData));
        updateUI();
    } catch (e) {
        console.error("Budget App: Error saving data", e);
    }
}

// Сброс к настройкам по умолчанию
function resetToDefaults() {
    appData = {
        incomes: [],
        debts: [], 
        expenseCategories: JSON.parse(JSON.stringify(defaultExpenseCategories)),
        expenseOperations: [],
        settings: { currency: "₽" }
    };
    saveData();
}

// Обновление интерфейса
function updateUI() {
    updateCircles();
    updateBalance();
    updateReport();
}

// Обновление баланса
function updateBalance() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaidDebts = appData.debts.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    
    // Суммируем расходы из всех категорий и подкатегорий
    let totalExpenses = 0;
    appData.expenseCategories.forEach(category => {
        totalExpenses += category.amount || 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                totalExpenses += subcategory.amount || 0;
            });
        }
    });
    
    const balance = totalIncome - totalPaidDebts - totalExpenses;
    
    const balanceElement = document.getElementById('balance-amount');
    if (balanceElement) {
        balanceElement.textContent = appData.settings.currency + balance.toFixed(2);
    }
}

// Обновление отчета
function updateReport() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaidDebts = appData.debts.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    
    let totalExpenses = 0;
    appData.expenseCategories.forEach(category => {
        totalExpenses += category.amount || 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                totalExpenses += subcategory.amount || 0;
            });
        }
    });
    
    const balance = totalIncome - totalPaidDebts - totalExpenses;
    
    const reportIncome = document.getElementById('report-income');
    const reportExpense = document.getElementById('report-expense');
    const reportDebt = document.getElementById('report-debt');
    const reportBalance = document.getElementById('report-balance');
    
    if (reportIncome) reportIncome.textContent = appData.settings.currency + totalIncome.toFixed(2);
    if (reportExpense) reportExpense.textContent = appData.settings.currency + totalExpenses.toFixed(2);
    if (reportDebt) reportDebt.textContent = appData.settings.currency + totalPaidDebts.toFixed(2);
    if (reportBalance) reportBalance.textContent = appData.settings.currency + balance.toFixed(2);
    
    const reportDetails = document.getElementById('report-details');
    if (reportDetails) {
        reportDetails.innerHTML = `
            <div class="result-item">
                <span>Общий доход:</span>
                <span class="income">${appData.settings.currency}${totalIncome.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Оплаченные долги:</span>
                <span class="debt">${appData.settings.currency}${totalPaidDebts.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>Общие расходы:</span>
                <span class="expense">${appData.settings.currency}${totalExpenses.toFixed(2)}</span>
            </div>
            <div class="result-item total">
                <span>Итоговый баланс:</span>
                <span class="${balance >= 0 ? 'balance-positive' : 'balance-negative'}">${appData.settings.currency}${Math.abs(balance).toFixed(2)}</span>
            </div>
        `;
    }
}

// Обновление кружков
function updateCircles() {
    updateIncomeCategories();
    updateCircleSection('debt', appData.debts);
    updateExpenseCategories();
}

// Обновление категорий доходов
function updateIncomeCategories() {
    const container = document.getElementById('income-circles');
    if (!container) return;
    
    if (!appData.incomes || appData.incomes.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = appData.incomes.map(income => {
        const showAmount = income.amount > 0;
        const icon = income.icon || '💰';
        
        return `
            <div class="circle-item circle-income" onclick="editIncomeCategory(${income.id})">
                <div class="circle-actions">
                    <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteIncomeCategory(${income.id})">×</button>
                </div>
                <div class="circle-icon">${icon}</div>
                ${showAmount ? `<div class="circle-amount">${appData.settings.currency}${income.amount}</div>` : ''}
                <div class="circle-label">${income.name}</div>
            </div>
        `;
    }).join('');
}

// Обновление секции с кружками (для долгов)
function updateCircleSection(type, items) {
    const container = document.getElementById(`${type}-circles`);
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    if (type === 'debt') {
        container.innerHTML = items.map(item => {
            const remainingAmount = (item.amount || 0) - (item.paidAmount || 0);
            const isPaid = remainingAmount <= 0;
            const progressPercent = item.amount > 0 ? ((item.paidAmount || 0) / item.amount * 100) : 0;
            const icon = item.icon || '💳';
            
            return `
                <div class="circle-item circle-${type} ${isPaid ? 'paid' : ''}" onclick="editCircle('${type}', ${item.id})">
                    <div class="circle-actions">
                        <button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteCircle('${type}', ${item.id})">×</button>
                        ${!isPaid ? `<button class="circle-action-btn circle-check" onclick="event.stopPropagation(); makeDebtPayment(${item.id})">✓</button>` : ''}
                    </div>
                    <div class="circle-icon">${icon}</div>
                    <div class="circle-amount">${appData.settings.currency}${remainingAmount.toFixed(2)}</div>
                    <div class="circle-label">${item.description}</div>
                    ${!isPaid ? `<div class="debt-progress">
                        <div class="debt-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>` : ''}
                </div>
            `;
        }).join('');
    }
}

// Обновление категорий расходов
function updateExpenseCategories() {
    const container = document.getElementById('expense-circles');
    if (!container) return;
    
    if (!appData.expenseCategories || appData.expenseCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = appData.expenseCategories.map(category => {
        const isDefaultCategory = defaultExpenseCategories.some(cat => cat.id === category.id);
        const showAmount = category.amount > 0;
        const icon = category.icon || '🛒';
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        
        let deleteButton = '';
        if (!isDefaultCategory) {
            deleteButton = `<button class="circle-action-btn circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>`;
        }
        
        return `
            <div class="circle-item circle-expense" onclick="editExpenseCategory(${category.id})">
                <div class="circle-actions">${deleteButton}</div>
                <div class="circle-icon">${icon}</div>
                ${showAmount ? `<div class="circle-amount">${appData.settings.currency}${category.amount}</div>` : ''}
                <div class="circle-label">${category.name} ${hasSubcategories ? '📁' : ''}</div>
            </div>
        `;
    }).join('');
}

// Переключение экранов
function switchScreen(screenName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    if (screenName === 'overview') {
        if (navItems[0]) navItems[0].classList.add('active');
    } else if (screenName === 'operations') {
        if (navItems[1]) navItems[1].classList.add('active');
    } else if (screenName === 'report') {
        if (navItems[2]) navItems[2].classList.add('active');
    }
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    if (screenName === 'operations') {
        updateOperationsList();
    } else if (screenName === 'report') {
        updateReport();
    }
}

// Показать выбор категории для добавления расхода
function showCategorySelection() {
    const modal = document.getElementById('category-modal');
    const categoryList = document.getElementById('category-list');
    
    if (!appData.expenseCategories || appData.expenseCategories.length === 0) {
        alert('Сначала добавьте категории расходов!');
        return;
    }
    
    categoryList.innerHTML = appData.expenseCategories.map(category => {
        const totalAmount = calculateCategoryTotal(category);
        return `
            <button class="category-option" onclick="selectExpenseCategory(${category.id})">
                <div class="category-option-icon">${category.icon}</div>
                <div class="category-option-name">${category.name}</div>
                <div class="category-option-amount">${appData.settings.currency}${totalAmount}</div>
            </button>
        `;
    }).join('');
    
    modal.classList.add('active');
}

// Скрыть выбор категории
function hideCategorySelection() {
    const modal = document.getElementById('category-modal');
    modal.classList.remove('active');
}

// Выбрать категорию и показать подкатегории
function selectExpenseCategory(categoryId) {
    const category = appData.expenseCategories.find(c => c.id === categoryId);
    if (category) {
        currentState.selectedCategoryId = categoryId;
        
        // Если у категории есть подкатегории, показываем их выбор
        if (category.subcategories && category.subcategories.length > 0) {
            showSubcategorySelection(category);
        } else {
            // Иначе сразу запрашиваем сумму для категории
            hideCategorySelection();
            addExpenseToCategory(categoryId, null);
        }
    }
}

// Показать выбор подкатегории
function showSubcategorySelection(category) {
    const modal = document.getElementById('subcategory-modal');
    const subcategoryList = document.getElementById('subcategory-list');
    const title = document.getElementById('subcategory-modal-title');
    
    title.textContent = `Выберите подкатегорию для ${category.name}`;
    
    let optionsHTML = '';
    
    // Добавляем вариант для добавления расхода в основную категорию
    optionsHTML += `
        <button class="category-option" onclick="selectSubcategory(null)">
            <div class="category-option-icon">${category.icon}</div>
            <div class="category-option-name">${category.name} (основная)</div>
            <div class="category-option-amount">${appData.settings.currency}${category.amount || 0}</div>
        </button>
    `;
    
    // Добавляем подкатегории
    if (category.subcategories) {
        category.subcategories.forEach(subcategory => {
            optionsHTML += `
                <button class="category-option" onclick="selectSubcategory(${subcategory.id})">
                    <div class="category-option-icon">${subcategory.icon}</div>
                    <div class="category-option-name">${subcategory.name}</div>
                    <div class="category-option-amount">${appData.settings.currency}${subcategory.amount || 0}</div>
                </button>
            `;
        });
    }
    
    subcategoryList.innerHTML = optionsHTML;
    
    // Скрываем выбор категорий и показываем выбор подкатегорий
    hideCategorySelection();
    modal.classList.add('active');
}

// Скрыть выбор подкатегории
function hideSubcategorySelection() {
    const modal = document.getElementById('subcategory-modal');
    modal.classList.remove('active');
    showCategorySelection(); // Возвращаемся к выбору категории
}

// Выбрать подкатегорию и добавить расход
function selectSubcategory(subcategoryId) {
    hideSubcategorySelection();
    addExpenseToCategory(currentState.selectedCategoryId, subcategoryId);
}

// Добавить расход в категорию или подкатегорию
function addExpenseToCategory(categoryId, subcategoryId) {
    const category = appData.expenseCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    let targetName = category.name;
    let targetIcon = category.icon;
    
    if (subcategoryId) {
        const subcategory = category.subcategories.find(s => s.id === subcategoryId);
        if (subcategory) {
            targetName = subcategory.name;
            targetIcon = subcategory.icon;
        }
    }
    
    const amountStr = prompt(`Введите сумму расхода для "${targetName}":`, "0");
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) {
        alert("Пожалуйста, введите корректную сумму (больше 0)");
        return;
    }
    
    // Создаем операцию расхода
    const expenseOperation = {
        id: Date.now(),
        categoryId: category.id,
        subcategoryId: subcategoryId,
        categoryName: category.name,
        subcategoryName: subcategoryId ? targetName : null,
        amount: amount,
        description: `${category.name}${subcategoryId ? ` - ${targetName}` : ''}`,
        date: new Date().toISOString(),
        icon: targetIcon
    };
    
    // Добавляем операцию в массив операций
    if (!appData.expenseOperations) {
        appData.expenseOperations = [];
    }
    appData.expenseOperations.push(expenseOperation);
    
    // Обновляем сумму в категории или подкатегории
    if (subcategoryId) {
        const subcategory = category.subcategories.find(s => s.id === subcategoryId);
        if (subcategory) {
            subcategory.amount = (subcategory.amount || 0) + amount;
        }
    } else {
        category.amount = (category.amount || 0) + amount;
    }
    
    saveData();
    
    alert(`Расход ${appData.settings.currency}${amount.toFixed(2)} добавлен в "${targetName}"`);
}

// Показать модальное окно редактирования категории
function showEditCategoryModal(categoryId) {
    const category = appData.expenseCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    currentState.editingCategoryId = categoryId;
    
    document.getElementById('edit-category-title').textContent = `Редактировать ${category.name}`;
    document.getElementById('edit-category-name').value = category.name;
    document.getElementById('edit-category-icon').value = category.icon;
    
    updateSubcategoriesList();
    
    document.getElementById('edit-category-modal').classList.add('active');
}

// Скрыть модальное окно редактирования категории
function hideEditCategoryModal() {
    document.getElementById('edit-category-modal').classList.remove('active');
    currentState.editingCategoryId = null;
}

// Обновить список подкатегорий в модальном окне
function updateSubcategoriesList() {
    const container = document.getElementById('subcategories-list');
    const category = appData.expenseCategories.find(c => c.id === currentState.editingCategoryId);
    
    if (!category) return;
    
    if (!category.subcategories || category.subcategories.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет подкатегорий</div>';
        return;
    }
    
    container.innerHTML = category.subcategories.map(subcategory => `
        <div class="subcategory-item">
            <div class="subcategory-info">
                <div class="category-option-icon">${subcategory.icon}</div>
                <div class="category-option-name">${subcategory.name}</div>
                <div class="category-option-amount">${appData.settings.currency}${subcategory.amount || 0}</div>
            </div>
            <div class="subcategory-actions">
                <button class="subcategory-action-btn subcategory-edit" onclick="editSubcategory(${subcategory.id})">✏️</button>
                <button class="subcategory-action-btn subcategory-delete" onclick="deleteSubcategory(${subcategory.id})">×</button>
            </div>
        </div>
    `).join('');
}

// Сохранить изменения категории
function saveCategoryChanges() {
    const category = appData.expenseCategories.find(c => c.id === currentState.editingCategoryId);
    if (!category) return;
    
    const newName = document.getElementById('edit-category-name').value.trim();
    const newIcon = document.getElementById('edit-category-icon').value.trim();
    
    if (!newName) {
        alert("Введите название категории");
        return;
    }
    
    category.name = newName;
    category.icon = newIcon;
    
    saveData();
    hideEditCategoryModal();
}

// Добавить новую подкатегорию
function addNewSubcategory() {
    const category = appData.expenseCategories.find(c => c.id === currentState.editingCategoryId);
    if (!category) return;
    
    if (!category.subcategories) {
        category.subcategories = [];
    }
    
    const newSubcategory = {
        id: Date.now(),
        name: "Новая подкатегория",
        icon: "📁",
        amount: 0
    };
    
    category.subcategories.push(newSubcategory);
    updateSubcategoriesList();
}

// Редактировать подкатегорию
function editSubcategory(subcategoryId) {
    const category = appData.expenseCategories.find(c => c.id === currentState.editingCategoryId);
    if (!category || !category.subcategories) return;
    
    const subcategory = category.subcategories.find(s => s.id === subcategoryId);
    if (!subcategory) return;
    
    currentState.editingSubcategory = subcategory;
    
    document.getElementById('edit-subcategory-title').textContent = `Редактировать ${subcategory.name}`;
    document.getElementById('edit-subcategory-name').value = subcategory.name;
    document.getElementById('edit-subcategory-icon').value = subcategory.icon;
    
    hideEditCategoryModal();
    document.getElementById('edit-subcategory-modal').classList.add('active');
}

// Скрыть модальное окно редактирования подкатегории
function hideEditSubcategoryModal() {
    document.getElementById('edit-subcategory-modal').classList.remove('active');
    currentState.editingSubcategory = null;
    showEditCategoryModal(currentState.editingCategoryId);
}

// Сохранить изменения подкатегории
function saveSubcategoryChanges() {
    if (!currentState.editingSubcategory) return;
    
    const newName = document.getElementById('edit-subcategory-name').value.trim();
    const newIcon = document.getElementById('edit-subcategory-icon').value.trim();
    
    if (!newName) {
        alert("Введите название подкатегории");
        return;
    }
    
    currentState.editingSubcategory.name = newName;
    currentState.editingSubcategory.icon = newIcon;
    
    saveData();
    hideEditSubcategoryModal();
}

// Удалить подкатегорию
function deleteSubcategory(subcategoryId) {
    if (!confirm("Удалить эту подкатегорию? Все связанные расходы будут перемещены в основную категорию.")) {
        return;
    }
    
    const category = appData.expenseCategories.find(c => c.id === currentState.editingCategoryId);
    if (!category || !category.subcategories) return;
    
    const subcategoryIndex = category.subcategories.findIndex(s => s.id === subcategoryId);
    if (subcategoryIndex === -1) return;
    
    const subcategory = category.subcategories[subcategoryIndex];
    
    // Перемещаем расходы из подкатегории в основную категорию
    if (appData.expenseOperations) {
        appData.expenseOperations.forEach(operation => {
            if (operation.subcategoryId === subcategoryId) {
                operation.subcategoryId = null;
                operation.description = category.name;
                operation.icon = category.icon;
            }
        });
    }
    
    // Добавляем сумму подкатегории к основной категории
    category.amount = (category.amount || 0) + (subcategory.amount || 0);
    
    // Удаляем подкатегорию
    category.subcategories.splice(subcategoryIndex, 1);
    
    saveData();
    updateSubcategoriesList();
}

// Подсчитать общую сумму категории (основная + подкатегории)
function calculateCategoryTotal(category) {
    let total = category.amount || 0;
    
    if (category.subcategories) {
        category.subcategories.forEach(subcategory => {
            total += subcategory.amount || 0;
        });
    }
    
    return total;
}

// Добавление новой категории доходов
function addNewIncomeCategory() {
    const categoryName = prompt('Введите название категории доходов:');
    if (!categoryName) return;
    
    const amountStr = prompt(`Введите сумму для категории "${categoryName}":`, "0");
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount < 0) {
        alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
        return;
    }
    
    const icon = prompt('Введите смайлик (иконку) для категории (например: 💰, 💵, 💳):', '💰') || '💰';
    
    const newCategory = {
        id: Date.now(),
        name: categoryName,
        amount: amount,
        icon: icon,
        date: new Date().toISOString()
    };
    
    appData.incomes.push(newCategory);
    saveData();
}

// Добавление нового кружка для долгов
function addNewCircle(type) {
    const amountStr = prompt(`Введите сумму ${getTypeName(type)}:`, "0");
    if (amountStr === null) return;
    
    const amount = parseFloat(amountStr) || 0;
    if (amount < 0) {
        alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
        return;
    }
    
    const description = prompt('Введите описание:') || getDefaultDescription(type);
    
    let defaultIcon = '💰';
    if (type === 'debt') defaultIcon = '💳';
    
    const icon = prompt('Введите смайлик (иконку):', defaultIcon) || defaultIcon;
    
    const newItem = {
        id: Date.now(),
        amount: amount,
        description: description,
        icon: icon,
        date: new Date().toISOString(),
        paidAmount: 0,
        paymentHistory: []
    };
    
    if (type === 'debt') {
        appData.debts.push(newItem);
    }
    
    saveData();
}

// Добавление новой категории расходов
function addNewExpenseCategory() {
    const categoryName = prompt('Введите название категории расходов:');
    if (!categoryName) return;
    
    const icon = prompt('Введите смайлик (иконку) для категории (например: 🍔, 🚗, 🎮):', '🛒') || '🛒';
    
    const newCategory = {
        id: Date.now(),
        name: categoryName,
        amount: 0,
        icon: icon,
        subcategories: [],
        date: new Date().toISOString()
    };
    
    appData.expenseCategories.push(newCategory);
    saveData();
}

// Редактирование категории доходов
function editIncomeCategory(categoryId) {
    const category = appData.incomes.find(c => c.id === categoryId);
    if (category) {
        const newName = prompt('Изменить название категории:', category.name);
        if (newName) {
            category.name = newName;
        }
        
        const newAmountStr = prompt('Изменить сумму:', category.amount);
        if (newAmountStr !== null) {
            const newAmount = parseFloat(newAmountStr) || 0;
            if (newAmount >= 0) {
                category.amount = newAmount;
            } else {
                alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
            }
        }
        
        const newIcon = prompt('Изменить иконку (смайлик):', category.icon);
        if (newIcon) {
            category.icon = newIcon;
        }
        
        saveData();
    }
}

// Редактирование категории расходов (теперь с подкатегориями)
function editExpenseCategory(categoryId) {
    showEditCategoryModal(categoryId);
}

// Редактирование кружка долгов
function editCircle(type, id) {
    let items;
    if (type === 'debt') {
        items = appData.debts;
    } else {
        return;
    }
    
    const item = items.find(i => i.id === id);
    if (item) {
        const newAmountStr = prompt('Изменить общую сумму долга:', item.amount);
        if (newAmountStr !== null) {
            const newAmount = parseFloat(newAmountStr) || 0;
            if (newAmount >= 0) {
                if (newAmount < item.paidAmount) {
                    item.paidAmount = newAmount;
                }
                item.amount = newAmount;
            } else {
                alert("Пожалуйста, введите корректную сумму (неотрицательное число)");
                return;
            }
        }
        
        const newDescription = prompt('Изменить описание:', item.description) || item.description;
        item.description = newDescription;
        
        const newIcon = prompt('Изменить иконку (смайлик):', item.icon) || item.icon;
        item.icon = newIcon;
        
        saveData();
    }
}

// Удаление категории доходов
function deleteIncomeCategory(categoryId) {
    if (confirm('Удалить эту категорию доходов?')) {
        const index = appData.incomes.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            appData.incomes.splice(index, 1);
            saveData();
        }
    }
}

// Удаление кружка долгов
function deleteCircle(type, id) {
    if (confirm('Удалить эту запись?')) {
        let items;
        if (type === 'debt') {
            items = appData.debts;
        } else {
            return;
        }
        
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            saveData();
        }
    }
}

// Удаление категории расходов
function deleteExpenseCategory(categoryId) {
    const isDefaultCategory = defaultExpenseCategories.some(cat => cat.id === categoryId);
    if (isDefaultCategory) {
        alert("Предустановленные категории нельзя удалить. Вы можете изменить сумму на 0.");
        return;
    }
    
    if (confirm('Удалить эту категорию?')) {
        if (appData.expenseOperations) {
            appData.expenseOperations = appData.expenseOperations.filter(op => op.categoryId !== categoryId);
        }
        
        const index = appData.expenseCategories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            appData.expenseCategories.splice(index, 1);
            saveData();
        }
    }
}

// Внесение платежа по долгу
function makeDebtPayment(debtId) {
    const debt = appData.debts.find(d => d.id === debtId);
    if (debt) {
        const remaining = debt.amount - (debt.paidAmount || 0);
        
        if (remaining <= 0) {
            alert("Долг уже полностью погашен!");
            return;
        }
        
        const paymentStr = prompt(
            `Введите сумму платежа по долгу "${debt.description}"\nОсталось погасить: ${appData.settings.currency}${remaining.toFixed(2)}`,
            remaining.toString()
        );
        
        if (paymentStr === null) return;
        
        const payment = parseFloat(paymentStr) || 0;
        
        if (payment <= 0) {
            alert("Сумма платежа должна быть больше 0");
            return;
        }
        
        if (payment > remaining) {
            alert("Сумма платежа не может превышать оставшуюся сумму долга");
            return;
        }
        
        debt.paidAmount = (debt.paidAmount || 0) + payment;
        
        if (!debt.paymentHistory) {
            debt.paymentHistory = [];
        }
        
        debt.paymentHistory.push({
            date: new Date().toISOString(),
            amount: payment
        });
        
        saveData();
        
        if (debt.paidAmount >= debt.amount) {
            alert("Долг полностью погашен!");
        }
    }
}

// Получение названия типа
function getTypeName(type) {
    const names = {
        income: 'дохода',
        debt: 'долга', 
        expense: 'расхода'
    };
    return names[type] || 'операции';
}

// Описание по умолчанию
function getDefaultDescription(type) {
    const defaults = {
        income: 'Доход',
        debt: 'Долг', 
        expense: 'Расход'
    };
    return defaults[type] || 'Операция';
}

// Очистка всех данных
function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены.')) {
        resetToDefaults();
        alert('Все данные очищены! Суммы в категориях обнулены.');
    }
}

// Обновление списка операций
function updateOperationsList() {
    const container = document.getElementById('operations-list');
    if (!container) return;
    
    const incomeOperations = [];
    const expenseOperations = [];
    const debtOperations = [];
    
    if (appData.incomes) {
        appData.incomes.forEach(income => {
            if (income.amount > 0) {
                incomeOperations.push({
                    id: income.id,
                    amount: income.amount,
                    description: income.name,
                    date: income.date,
                    type: 'income',
                    icon: income.icon,
                    isEditable: true
                });
            }
        });
    }
    
    if (appData.debts) {
        appData.debts.forEach(debt => {
            debtOperations.push({
                id: debt.id,
                amount: -debt.amount,
                description: debt.description,
                date: debt.date,
                type: 'debt',
                icon: debt.icon,
                isEditable: true
            });
            
            if (debt.paymentHistory && debt.paymentHistory.length > 0) {
                debt.paymentHistory.forEach((payment, index) => {
                    debtOperations.push({
                        id: debt.id + '_payment_' + index,
                        amount: payment.amount,
                        description: `Погашение: ${debt.description}`,
                        date: payment.date,
                        type: 'debt-payment',
                        icon: '✅',
                        isEditable: true,
                        debtId: debt.id,
                        paymentIndex: index
                    });
                });
            }
        });
    }
    
    if (appData.expenseOperations) {
        appData.expenseOperations.forEach(operation => {
            expenseOperations.push({
                id: operation.id,
                amount: -operation.amount,
                description: operation.description,
                date: operation.date,
                type: 'expense',
                icon: operation.icon,
                isEditable: true
            });
        });
    }
    
    incomeOperations.sort((a, b) => new Date(b.date) - new Date(a.date));
    expenseOperations.sort((a, b) => new Date(b.date) - new Date(a.date));
    debtOperations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let operationsHTML = '';
    
    if (incomeOperations.length > 0) {
        operationsHTML += `
            <div class="operations-group">
                <div class="operations-group-title">Доходы</div>
                ${incomeOperations.map(operation => createOperationHTML(operation)).join('')}
            </div>
        `;
    }
    
    if (expenseOperations.length > 0) {
        operationsHTML += `
            <div class="operations-group">
                <div class="operations-group-title">Расходы</div>
                ${expenseOperations.map(operation => createOperationHTML(operation)).join('')}
            </div>
        `;
    }
    
    if (debtOperations.length > 0) {
        operationsHTML += `
            <div class="operations-group">
                <div class="operations-group-title">Долги</div>
                ${debtOperations.map(operation => createOperationHTML(operation)).join('')}
            </div>
        `;
    }
    
    if (operationsHTML === '') {
        container.innerHTML = '<div class="empty-state">Нет операций</div>';
        return;
    }
    
    container.innerHTML = operationsHTML;
}

// Создание HTML для одной операции
function createOperationHTML(operation) {
    let typeClass = operation.type;
    let typeIcon, typeColor;
    let amountSign = '';
    let displayAmount = Math.abs(operation.amount);
    
    switch(operation.type) {
        case 'income':
            typeIcon = operation.icon || '💰';
            typeColor = '#34C759';
            amountSign = '+';
            break;
        case 'expense':
            typeIcon = operation.icon || '🛒';
            typeColor = '#FF3B30';
            amountSign = '-';
            break;
        case 'debt':
            typeIcon = operation.icon || '💳';
            typeColor = '#FF9500';
            amountSign = '-';
            break;
        case 'debt-payment':
            typeIcon = operation.icon || '✅';
            typeColor = '#34C759';
            amountSign = '+';
            break;
        default:
            typeIcon = operation.icon || '🛒';
            typeColor = '#8E8E93';
            amountSign = '';
    }
    
    let actionButtons = '';
    if (operation.isEditable) {
        if (operation.type === 'expense') {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="editExpenseOperation(${operation.id})">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="deleteExpenseOperation(${operation.id})">×</button>
                </div>
            `;
        } else if (operation.type === 'income') {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="editIncomeOperation(${operation.id})">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="deleteIncomeOperation(${operation.id})">×</button>
                </div>
            `;
        } else if (operation.type === 'debt') {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="editDebtOperation(${operation.id})">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="deleteDebtOperation(${operation.id})">×</button>
                </div>
            `;
        } else if (operation.type === 'debt-payment') {
            actionButtons = `
                <div class="operation-actions">
                    <button class="operation-action-btn operation-edit" onclick="editDebtPayment(${operation.debtId}, ${operation.paymentIndex})">✏️</button>
                    <button class="operation-action-btn operation-delete" onclick="deleteDebtPayment(${operation.debtId}, ${operation.paymentIndex})">×</button>
                </div>
            `;
        }
    }
    
    return `
        <div class="operation-item">
            <div class="operation-info">
                <div class="operation-icon" style="background: ${typeColor}">
                    ${typeIcon}
                </div>
                <div class="operation-details">
                    <div class="operation-title">${operation.description}</div>
                    <div class="operation-meta">
                        <span>${formatDate(operation.date)}</span>
                        <span class="operation-time">${formatTime(operation.date)}</span>
                    </div>
                </div>
            </div>
            <div class="operation-amount ${typeClass}">
                ${amountSign}${appData.settings.currency}${displayAmount.toFixed(2)}
            </div>
            ${actionButtons}
        </div>
    `;
}

// Форматирование даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return '--.--.----';
    }
}

// Форматирование времени
function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '--:--';
    }
}

// Часы и дата
function startClock() {
    function updateTime() {
        try {
            const now = new Date();
            const timeElement = document.getElementById('current-time');
            const dateElement = document.getElementById('current-date');
            
            if (timeElement) {
                timeElement.textContent = 
                    now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0');
            }
            
            if (dateElement) {
                dateElement.textContent = 
                    now.getDate().toString().padStart(2, '0') + '.' + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                    now.getFullYear();
            }
        } catch (e) {
            console.error("Error updating time:", e);
        }
    }
    
    updateTime();
    setInterval(updateTime, 60000);
}

// Настройки
function showSettingsModal() {
    const totalIncome = appData.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaidDebts = appData.debts.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    
    let totalExpenses = 0;
    appData.expenseCategories.forEach(category => {
        totalExpenses += category.amount || 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                totalExpenses += subcategory.amount || 0;
            });
        }
    });
    
    const balance = totalIncome - totalPaidDebts - totalExpenses;
    
    const debugInfo = `
=== ИНФОРМАЦИЯ О ПРИЛОЖЕНИИ ===

Доходы: ${appData.incomes ? appData.incomes.length : 0} категорий
Долги: ${appData.debts ? appData.debts.length : 0} записей
Категории расходов: ${appData.expenseCategories ? appData.expenseCategories.length : 0}
Операции расходов: ${appData.expenseOperations ? appData.expenseOperations.length : 0}

ОБЩАЯ СТАТИСТИКА:
- Доходы: ${appData.settings.currency}${totalIncome.toFixed(2)}
- Оплаченные долги: ${appData.settings.currency}${totalPaidDebts.toFixed(2)}
- Расходы: ${appData.settings.currency}${totalExpenses.toFixed(2)}
- Баланс: ${appData.settings.currency}${balance.toFixed(2)}
    `.trim();
    
    const userChoice = confirm(debugInfo + "\n\nНажмите OK для очистки всех данных или Отмена для закрытия");
    
    if (userChoice) {
        clearAllData();
    }
}

// Заглушки для отсутствующих функций
function editExpenseOperation(id) {
    alert('Редактирование операции расхода - в разработке');
}

function deleteExpenseOperation(id) {
    if (confirm('Удалить эту операцию расхода?')) {
        const operation = appData.expenseOperations.find(op => op.id === id);
        if (operation) {
            // Вычитаем сумму из категории/подкатегории
            const category = appData.expenseCategories.find(c => c.id === operation.categoryId);
            if (category) {
                if (operation.subcategoryId) {
                    const subcategory = category.subcategories?.find(s => s.id === operation.subcategoryId);
                    if (subcategory) {
                        subcategory.amount = Math.max(0, (subcategory.amount || 0) - operation.amount);
                    }
                } else {
                    category.amount = Math.max(0, (category.amount || 0) - operation.amount);
                }
            }
            
            // Удаляем операцию
            appData.expenseOperations = appData.expenseOperations.filter(op => op.id !== id);
            saveData();
        }
    }
}

function editIncomeOperation(id) {
    alert('Редактирование операции дохода - в разработке');
}

function deleteIncomeOperation(id) {
    alert('Удаление операции дохода - в разработке');
}

function editDebtOperation(id) {
    alert('Редактирование операции долга - в разработке');
}

function deleteDebtOperation(id) {
    alert('Удаление операции долга - в разработке');
}

function editDebtPayment(debtId, paymentIndex) {
    alert('Редактирование платежа по долгу - в разработке');
}

function deleteDebtPayment(debtId, paymentIndex) {
    alert('Удаление платежа по долгу - в разработке');
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Budget App: DOM loaded, starting app...");
    initApp();
});

// Резервная инициализация
window.addEventListener('load', function() {
    console.log("Budget App: Window loaded");
    setTimeout(function() {
        const balanceElement = document.getElementById('balance-amount');
        if (balanceElement && balanceElement.textContent === '₽0') {
            console.log("Budget App: Backup initialization");
            initApp();
        }
    }, 100);
});

// Запрет масштабирования на iOS
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Запрет двойного тапа для масштабирования
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);