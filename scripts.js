// Структуры данных
let categories = JSON.parse(localStorage.getItem('categories')) || [
    {
        id: '1',
        name: 'Еда',
        emoji: '🍕',
        subcategories: [
            { id: '1-1', name: 'Супермаркет', emoji: '🛒' },
            { id: '1-2', name: 'Рестораны', emoji: '🍽️' }
        ]
    },
    {
        id: '2',
        name: 'Транспорт',
        emoji: '🚗',
        subcategories: [
            { id: '2-1', name: 'Бензин', emoji: '⛽' },
            { id: '2-2', name: 'Такси', emoji: '🚕' }
        ]
    },
    {
        id: '3',
        name: 'Развлечения',
        emoji: '🎬',
        subcategories: []
    }
];

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Текущее состояние
let currentState = {
    editingCategoryId: null,
    selectedCategoryId: null,
    selectedSubcategoryId: null,
    editingSubcategory: null
};

// Инициализация приложения
function init() {
    updateCategoriesList();
    updateTotalExpenses();
}

// Обновление списка категорий
function updateCategoriesList() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    categories.forEach(category => {
        const total = calculateCategoryTotal(category.id);
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.onclick = () => openEditCategoryModal(category.id);
        
        categoryElement.innerHTML = `
            <div class="category-left">
                <div class="category-emoji">${category.emoji}</div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    ${category.subcategories.length > 0 ? 
                        `<div class="subcategories-count">${category.subcategories.length} подкатегорий</div>` : 
                        ''
                    }
                </div>
            </div>
            <div class="category-amount">${total} ₽</div>
        `;
        
        categoriesList.appendChild(categoryElement);
    });
}

// Подсчет общей суммы по категории
function calculateCategoryTotal(categoryId) {
    let total = 0;
    
    // Сумма расходов без подкатегорий
    total += expenses
        .filter(expense => expense.categoryId === categoryId && !expense.subcategoryId)
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Сумма расходов по подкатегориям
    const category = categories.find(cat => cat.id === categoryId);
    if (category && category.subcategories) {
        category.subcategories.forEach(subcategory => {
            total += expenses
                .filter(expense => expense.subcategoryId === subcategory.id)
                .reduce((sum, expense) => sum + expense.amount, 0);
        });
    }
    
    return total;
}

// Обновление общей суммы расходов
function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalExpenses').textContent = total + ' ₽';
}

// Модальные окны - расходы
function openAddExpenseModal() {
    currentState.selectedCategoryId = null;
    currentState.selectedSubcategoryId = null;
    
    document.getElementById('expenseStep1').style.display = 'block';
    document.getElementById('expenseStep2').style.display = 'none';
    document.getElementById('expenseStep3').style.display = 'none';
    
    // Заполняем варианты категорий
    const categoryOptions = document.getElementById('categoryOptions');
    categoryOptions.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('div');
        option.className = 'subcategory-option';
        option.onclick = () => selectCategoryForExpense(category.id);
        option.innerHTML = `
            <span class="category-emoji">${category.emoji}</span>
            <span>${category.name}</span>
            ${category.subcategories.length > 0 ? 
                `<span style="margin-left: auto; color: #7f8c8d; font-size: 0.9em;">${category.subcategories.length} подкат.</span>` : 
                ''
            }
        `;
        categoryOptions.appendChild(option);
    });
    
    document.getElementById('addExpenseModal').style.display = 'block';
}

function selectCategoryForExpense(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    currentState.selectedCategoryId = categoryId;
    
    if (category.subcategories && category.subcategories.length > 0) {
        // Показываем выбор подкатегории
        document.getElementById('expenseStep1').style.display = 'none';
        document.getElementById('expenseStep2').style.display = 'block';
        
        const subcategoryOptions = document.getElementById('subcategoryOptions');
        subcategoryOptions.innerHTML = '';
        
        document.getElementById('subcategoryLabel').textContent = `Выберите подкатегорию для ${category.emoji} ${category.name}:`;
        
        // Добавляем вариант "Без подкатегории"
        const noSubcategoryOption = document.createElement('div');
        noSubcategoryOption.className = 'subcategory-option';
        noSubcategoryOption.onclick = () => selectSubcategoryForExpense(null);
        noSubcategoryOption.innerHTML = `
            <span>📁 Без подкатегории</span>
        `;
        subcategoryOptions.appendChild(noSubcategoryOption);
        
        // Добавляем подкатегории
        category.subcategories.forEach(subcategory => {
            const option = document.createElement('div');
            option.className = 'subcategory-option';
            option.onclick = () => selectSubcategoryForExpense(subcategory.id);
            option.innerHTML = `
                <span class="category-emoji">${subcategory.emoji}</span>
                <span>${subcategory.name}</span>
            `;
            subcategoryOptions.appendChild(option);
        });
    } else {
        // Переходим сразу к вводу суммы
        selectSubcategoryForExpense(null);
    }
}

function selectSubcategoryForExpense(subcategoryId) {
    currentState.selectedSubcategoryId = subcategoryId;
    
    const category = categories.find(cat => cat.id === currentState.selectedCategoryId);
    let displayText = `${category.emoji} ${category.name}`;
    
    if (subcategoryId) {
        const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
        displayText += ` → ${subcategory.emoji} ${subcategory.name}`;
    }
    
    document.getElementById('selectedCategoryDisplay').textContent = displayText;
    
    document.getElementById('expenseStep2').style.display = 'none';
    document.getElementById('expenseStep3').style.display = 'block';
    
    // Очищаем поля
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').focus();
}

function backToCategorySelection() {
    document.getElementById('expenseStep2').style.display = 'none';
    document.getElementById('expenseStep1').style.display = 'block';
}

function backToSubcategorySelection() {
    document.getElementById('expenseStep3').style.display = 'none';
    document.getElementById('expenseStep2').style.display = 'block';
}

function addExpense() {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value.trim();
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
    }
    
    if (!currentState.selectedCategoryId) {
        alert('Выберите категорию');
        return;
    }
    
    const newExpense = {
        id: Date.now().toString(),
        amount: amount,
        categoryId: currentState.selectedCategoryId,
        subcategoryId: currentState.selectedSubcategoryId,
        date: new Date().toISOString(),
        description: description || undefined
    };
    
    expenses.push(newExpense);
    saveData();
    updateCategoriesList();
    updateTotalExpenses();
    closeAddExpenseModal();
    
    alert('Расход успешно добавлен!');
}

function closeAddExpenseModal() {
    document.getElementById('addExpenseModal').style.display = 'none';
}

// Модальные окна - категории
function openAddCategoryModal() {
    currentState.editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = '📁 Добавить категорию';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryEmoji').value = '';
    document.getElementById('subcategoriesList').innerHTML = '';
    
    document.getElementById('categoryModal').style.display = 'block';
}

function openEditCategoryModal(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    currentState.editingCategoryId = categoryId;
    document.getElementById('categoryModalTitle').textContent = '✏️ Редактировать категорию';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryEmoji').value = category.emoji;
    
    // Обновляем список подкатегорий
    updateSubcategoriesList();
    
    document.getElementById('categoryModal').style.display = 'block';
}

function updateSubcategoriesList() {
    const subcategoriesList = document.getElementById('subcategoriesList');
    subcategoriesList.innerHTML = '';
    
    const category = categories.find(cat => cat.id === currentState.editingCategoryId);
    if (!category) return;
    
    category.subcategories.forEach(subcategory => {
        const item = document.createElement('div');
        item.className = 'subcategory-item';
        item.innerHTML = `
            <div class="subcategory-info">
                <span class="category-emoji">${subcategory.emoji}</span>
                <span>${subcategory.name}</span>
            </div>
            <div>
                <button class="btn-danger" onclick="editSubcategory('${subcategory.id}')">✏️</button>
                <button class="btn-danger" onclick="deleteSubcategory('${subcategory.id}')">🗑️</button>
            </div>
        `;
        subcategoriesList.appendChild(item);
    });
    
    if (category.subcategories.length === 0) {
        subcategoriesList.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">Нет подкатегорий</div>';
    }
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const emoji = document.getElementById('categoryEmoji').value.trim();
    
    if (!name || !emoji) {
        alert('Заполните название и смайлик');
        return;
    }
    
    if (currentState.editingCategoryId) {
        // Редактирование существующей категории
        const categoryIndex = categories.findIndex(cat => cat.id === currentState.editingCategoryId);
        if (categoryIndex !== -1) {
            categories[categoryIndex].name = name;
            categories[categoryIndex].emoji = emoji;
        }
    } else {
        // Добавление новой категории
        const newCategory = {
            id: Date.now().toString(),
            name: name,
            emoji: emoji,
            subcategories: []
        };
        categories.push(newCategory);
    }
    
    saveData();
    updateCategoriesList();
    closeCategoryModal();
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// Модальные окна - подкатегории
function openAddSubcategoryModal() {
    currentState.editingSubcategory = null;
    document.getElementById('subcategoryModalTitle').textContent = '📝 Добавить подкатегорию';
    document.getElementById('subcategoryName').value = '';
    document.getElementById('subcategoryEmoji').value = '';
    
    document.getElementById('subcategoryModal').style.display = 'block';
}

function editSubcategory(subcategoryId) {
    const category = categories.find(cat => cat.id === currentState.editingCategoryId);
    if (!category) return;
    
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (!subcategory) return;
    
    currentState.editingSubcategory = subcategoryId;
    document.getElementById('subcategoryModalTitle').textContent = '✏️ Редактировать подкатегорию';
    document.getElementById('subcategoryName').value = subcategory.name;
    document.getElementById('subcategoryEmoji').value = subcategory.emoji;
    
    document.getElementById('subcategoryModal').style.display = 'block';
}

function saveSubcategory() {
    const name = document.getElementById('subcategoryName').value.trim();
    const emoji = document.getElementById('subcategoryEmoji').value.trim();
    
    if (!name || !emoji) {
        alert('Заполните название и смайлик');
        return;
    }
    
    const category = categories.find(cat => cat.id === currentState.editingCategoryId);
    if (!category) return;
    
    if (currentState.editingSubcategory) {
        // Редактирование существующей подкатегории
        const subcategoryIndex = category.subcategories.findIndex(sub => sub.id === currentState.editingSubcategory);
        if (subcategoryIndex !== -1) {
            category.subcategories[subcategoryIndex].name = name;
            category.subcategories[subcategoryIndex].emoji = emoji;
        }
    } else {
        // Добавление новой подкатегории
        const newSubcategory = {
            id: `${currentState.editingCategoryId}-${Date.now()}`,
            name: name,
            emoji: emoji
        };
        category.subcategories.push(newSubcategory);
    }
    
    updateSubcategoriesList();
    closeSubcategoryModal();
}

function deleteSubcategory(subcategoryId) {
    if (!confirm('Вы уверены, что хотите удалить эту подкатегорию?')) {
        return;
    }
    
    const category = categories.find(cat => cat.id === currentState.editingCategoryId);
    if (!category) return;
    
    category.subcategories = category.subcategories.filter(sub => sub.id !== subcategoryId);
    updateSubcategoriesList();
}

function closeSubcategoryModal() {
    document.getElementById('subcategoryModal').style.display = 'none';
}

// Сохранение данных
function saveData() {
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', init);

// Закрытие модальных окон при клике вне их
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}