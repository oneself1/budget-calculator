// Редактирование кружка доходов/долгов
function editCircle(type, id) {
    let items;
    if (type === 'income') {
        items = appData.incomes;
    } else if (type === 'debt') {
        items = appData.debts;
    }
    
    const item = items.find(i => i.id === id);
    if (item) {
        // Сначала сумма
        const newAmount = prompt('Изменить сумму:', item.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            const oldAmount = item.amount;
            item.amount = parseFloat(newAmount);
            
            // Потом описание
            const newDescription = prompt('Изменить описание:', item.description) || item.description;
            item.description = newDescription;
            
            // ОБНОВЛЯЕМ ТРАНЗАКЦИЮ В СПИСКЕ ОПЕРАЦИЙ
            const transactionIndex = appData.transactions.findIndex(t => 
                t.id === id && t.type === type
            );
            
            if (transactionIndex !== -1) {
                // Обновляем сумму транзакции
                appData.transactions[transactionIndex].amount = type === 'income' ? item.amount : -item.amount;
                appData.transactions[transactionIndex].description = item.description;
            }
            
            saveData();
        }
    }
}

// Добавление нового кружка для доходов и долгов (исправленная версия)
function addNewCircle(type) {
    console.log("Adding circle:", type);
    
    const amount = prompt(`Введите сумму ${getTypeName(type)}:`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Пожалуйста, введите корректную сумму");
        return;
    }
    
    const description = prompt('Введите описание:') || getDefaultDescription(type);
    
    const newItem = {
        id: Date.now(),
        amount: parseFloat(amount),
        description: description,
        date: new Date().toISOString().split('T')[0]
    };
    
    if (type === 'income') {
        appData.incomes.push(newItem);
    } else if (type === 'debt') {
        appData.debts.push(newItem);
    }
    
    // Добавляем транзакцию с правильным ID
    appData.transactions.unshift({
        id: newItem.id, // Используем тот же ID что и у кружка
        amount: type === 'income' ? newItem.amount : -newItem.amount,
        description: newItem.description,
        date: newItem.date,
        type: type
    });
    
    saveData();
}

// Обновление категорий расходов (исправленная версия)
function updateExpenseCategories() {
    const container = document.getElementById('expense-circles');
    if (!container) return;
    
    if (appData.expenseCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">Нажми + чтобы добавить</div>';
        return;
    }
    
    container.innerHTML = appData.expenseCategories.map(category => `
        <div class="circle-item circle-expense" onclick="editExpenseCategory(${category.id})">
            <div class="circle-amount">${appData.settings.currency}${category.amount}</div>
            <div class="circle-label">${category.name}</div>
            <button class="circle-delete" onclick="event.stopPropagation(); deleteExpenseCategory(${category.id})">×</button>
        </div>
    `).join('');
}

// Редактирование категории расходов (исправленная версия)
function editExpenseCategory(categoryId) {
    const category = appData.expenseCategories.find(c => c.id === categoryId);
    if (category) {
        // Сначала новое название
        const newName = prompt('Изменить название категории:', category.name);
        if (newName) {
            category.name = newName;
        }
        
        // Потом новая сумма
        const newAmount = prompt('Изменить сумму:', category.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            const oldAmount = category.amount;
            category.amount = parseFloat(newAmount);
            
            // ОБНОВЛЯЕМ ТРАНЗАКЦИЮ В СПИСКЕ ОПЕРАЦИЙ
            const transactionIndex = appData.transactions.findIndex(t => 
                t.id === categoryId && t.type === 'expense'
            );
            
            if (transactionIndex !== -1) {
                // Обновляем сумму транзакции
                appData.transactions[transactionIndex].amount = -category.amount;
                appData.transactions[transactionIndex].description = category.name;
            }
            
            saveData();
        }
    }
}

// Удаление категории расходов (исправленная версия)
function deleteExpenseCategory(categoryId) {
    if (confirm('Удалить эту категорию?')) {
        const index = appData.expenseCategories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            appData.expenseCategories.splice(index, 1);
            
            // УДАЛЯЕМ СООТВЕТСТВУЮЩУЮ ТРАНЗАКЦИЮ
            const transactionIndex = appData.transactions.findIndex(t => 
                t.id === categoryId && t.type === 'expense'
            );
            
            if (transactionIndex !== -1) {
                appData.transactions.splice(transactionIndex, 1);
            }
            
            saveData();
        }
    }
}