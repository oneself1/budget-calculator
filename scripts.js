// Данные приложения
let appData = {
    incomes: [],
    debts: [], 
    expenseCategories: [
        { id: 1, name: "Еда", amount: 0 },
        { id: 2, name: "Транспорт", amount: 0 },
        { id: 3, name: "Развлечения", amount: 0 },
        { id: 4, name: "Коммуналка", amount: 0 },
        { id: 5, name: "Одежда", amount: 0 },
        { id: 6, name: "Здоровье", amount: 0 }
    ],
    transactions: [],
    settings: { currency: "₽" }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log("App started!");
    loadData();
    updateUI();
    startClock();
});

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('budgetAppData');
');
    if (saved)    if (saved) {
 {
        try {
            const        try {
            const parsed parsed = JSON.parse(saved);
 = JSON.parse(saved);
                       // Сохраня // Сохраняем настройки валютем настройки валюты
            if (parы
            if (parsed.settings) {
               sed.settings) {
                appData.settings = parsed appData.settings = parsed.s.settings;
            }
            //ettings;
            }
            // За Загружаем данныегружаем данные, если они есть, если они есть
            if (parsed.incomes)
            if (parsed.incomes) appData.incomes = parsed.in appData.incomes = parsed.incomes;
            ifcomes;
            if (par (parsed.debts) appData.debts = parsed.debts;
            if (parsed.expenseCategories) appData.expenseCategories = parsed.expenseCategories;
            if (parsed.transactions) appData.transactions = parsed.transactions;
            console.log("Data loaded:", appData);
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('budgetAppData', JSON.stringify(appData));
    updateUI();
}

// Переключение экранов
function switchScreen(screenName) {
    document.querySelectorAllsed.debts) appData.debts = parsed.debts;
            if (parsed.expenseCategories) appData.expenseCategories = parsed.expenseCategories;
            if (parsed.transactions) appData.transactions = parsed.transactions;
            console.log("Data loaded:", appData);
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('budgetAppData', JSON.stringify(appData));
    updateUI();
}

// Переключение экранов
function switchScreen(screen('.nav-item').forEach(item => {
        item.classList.remove('Name) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classListactive');
    });
    document.remove('active');
    });
    document.querySelectorAll('.screen').forEach.querySelectorAll('.screen').forEach(screen => {
        screen(screen => {
        screen.classList.remove('active');
.classList.remove('active');
       });
    
    // На });
    
    // Находим правильный элемент навигации
    const navходим правильный элемент навигации
    const navItems = document.querySelectorAllItems = document.querySelectorAll('.nav('.nav-item');
    navItems-item');
    navItems.forEach(item.forEach(item => {
        const => {
        const onclickAttr onclickAttr = item.getAttribute = item.getAttribute('on('onclick');
        ifclick');
        if (on (onclickAttr && onclickclickAttr && onclickAttrAttr.includes(`switchScreen('.includes(`switchScreen('${screen${screenName}')`Name}')`)) {
)) {
            item.classList.add('active            item.classList.add('active');
        }
    });
    
');
        }
    });
    
    document.getElementById(`${screenName    document.getElementById(`${screenName}-}-screen`).classListscreen`).classList.add('.add('active');
    
   active');
    
    if ( if (screenName === 'operationsscreenName === 'operations') {
        updateOperationsList();
') {
        updateOperationsList();
    }
}

// Получение    }
}

// Получ назение названия типа
function getTypeName(type) {
вания типа
function getTypeName(type) {
    const names = {
        income:    const names = {
        income 'дохода',
        debt: 'дохода',
        debt: 'дол: 'долга', 
        expense: 'расга', 
        expense: 'расхода'
    };
    returnхода'
    };
    return names[type] || 'опера names[type] || 'операции';
}

// Описаниеции';
}

// Описание по умолчанию
 по умолчанию
function getDefaultDescription(type)function getDefaultDescription(type) {
 {
    const defaults = {
           const defaults = {
        income income: 'Доход: 'Доход',
',
        debt        debt:: 'Дол 'Долг', 
       г', 
        expense: 'Расход'
    expense: 'Расход'
    };
    return defaults[type };
    return defaults[type] || 'Операция';
}

// Добавление нового кружка для доходов и долгов
function addNewCircle(type) {
    const amount = prompt(`Введите сумму ${] || 'Операция';
}

// Добавление нового кружка для доходов и долгов
function addNewCircle(type) {
    const amount = prompt(`Введите сумму ${getTypegetTypeName(type)}:`Name(type)}:`);
   );
    if (!amount || if (!amount || isNaN isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Пожалуйста, введите корректную сумму");
        return;
    }
    
    const description = prompt('Введите описание:') || getDefaultDescription(type);
    
   (amount) || parseFloat(amount) <= 0) {
        alert("Пожалуйста, введите корректную сумму");
        return;
    }
    
    const description = prompt('Введите описание:') || getDefaultDescription(type);
    
    const const newItem = {
 newItem = {
        id        id: Date.now(),
: Date.now(),
        amount: parseFloat(amount),
        description: description,
        date: new Date().toISOString().split('T')[0]
    };
    
    if (type === 'income') {
        appData.incomes.push(newItem);
    } else if (type === 'debt') {
        appData.debts.push(newItem);
    }
    
    // Создаем транзакцию
    const transaction = {
        id:        amount: parseFloat(amount),
        description: description,
        date: new Date().toISOString().split('T')[0]
    };
    
    if (type === 'income') {
        appData.incomes.push(newItem);
    } else if (type === 'debt') {
        appData.debts.push(newItem);
    }
    
    // Создаем транзакцию
    const transaction = {
        id: new newItem.id,
        amount: type === 'income' ? newItem.amount : -newItem.amount,
Item.id,
        amount: type === 'income' ? newItem.amount : -newItem.amount,
        description: newItem.description        description: newItem.description,
        date: newItem,
        date: newItem.date,
        type:.date,
        type: type
    };
    
    appData.trans type
    };
    
    appData.transactions.unshift(transaction);
actions.unshift(transaction);
    saveData();
}

//    saveData();
}

// Добавление новой категории Добавление новой категории расходов
function addNew расходов
function addNewExpenseCategory()ExpenseCategory() {
    const categoryName = prompt('В {
    const categoryName = prompt('Введитеведите название катего название категориирии расходов расходов:');
    if (!category:');
    if (!categoryName) return;
    
    const amount = prompt(`Введите сумму для категорииName) return;
    
    const amount = prompt(`Введите сумму для категории "${ "${categoryName}":`);
    if (!amount || iscategoryName}":`);
    if (!amount || isNaNNaN(amount) || parseFloat(amount)(amount) || parseFloat(amount) <=  <= 0) {
       0) {
        alert(" alert("Пожалуйста, вПожалуйста, введите корректнуюведите корректную сумму сумму");
        return;
    }
    
");
        return;
    }
    
    const newCategory =    const new {
        id: Date.now(),
        name: categoryName,
        amountCategory = {
        id: Date.now(),
        name: categoryName,
        amount: parseFloat: parseFloat(amount)
(amount)
    };
    
       };
    
    appData appData.expenseCategories.expenseCategories.push(newCategory.push(newCategory);
    
    //);
    
    // Соз Создаем транзадаем транзакциюкцию
    const transaction
    const transaction = {
        = {
        id: newCategory id: newCategory.id,
       .id,
        amount: amount: -parseFloat -parseFloat(amount),
        description(amount),
        description: category: categoryName,
        dateName,
        date: new Date().: new Date().toISOtoISOString().split('String().split('T')[0],
T')[0],
        type        type: 'expense: 'expense'
   '
    };
    
    app };
    
    appData.transactionsData.transactions.un.unshift(shift(transaction);
    saveData();
}

transaction);
    saveData();
}

//// Редактирование кружка доходов/д Редактирование кружка доходов/долговолгов
function editCircle(type, id) {
   
function editCircle(type, id) {
    let let items;
    if (type === ' items;
    if (type === 'incomeincome') {
        items =') {
        items = appData appData.incomes;
.incomes;
    }    } else if (type === else if (type === ' 'debt') {
        itemsdebt') {
        items = appData.debts;
 = appData.debts;
    }
    
    const item =    }
    
    const item = items.find(i => i.id items.find(i => i.id === id);
    if ( === id);
    if (item) {
        const newAmount = prompt('Изменитьitem) {
        const newAmount = prompt('Изменить сумму:', item. сумму:', item.amount);
amount);
        if (new        if (newAmount &&Amount && !isNaN(new !isNaN(newAmount)Amount) && parse && parseFloat(newAmount) > 0) {
Float(newAmount) > 0) {
                       item.amount = parseFloat item.amount = parseFloat(new(newAmountAmount);
);
            
            const            
            const newDescription newDescription = prompt('Изменить оп = prompt('Изменить описание:', item.description)исание:', item.description) || || item.description;
            item.description = newDescription item.description;
            item.description = newDescription;
;
            
            // Об            
            // Обновляем транзакциюновляем транзакцию
            updateTransaction(type
            updateTransaction(type, id, id, item.amount, item.description, item.amount, item.description);
            
            saveData();
);
            
            saveData();
        }
    }
}

//        }
    }
}

// Реда Редактирование категорииктирование категории расходов расходов
function editExpenseCategory
function editExpenseCategory(category(categoryId) {
   Id) {
    const category const category = appData = appData.expenseCategories.expenseCategories.find(c.find(c => c.id === => c.id === categoryId);
    categoryId);
    if ( if (category) {
        const newName = prompt('Изменить название категории:', category.name);
        if (newName) {
            category.name = newName;
        }
        
        const newAmount = prompt('Изменить сумму:', category.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            category.amount = parseFloat(newAmount);
            
            // Обновляем транзаcategory) {
        const newName = prompt('Изменить название категории:', category.name);
        if (newName) {
            category.name = newName;
        }
        
        const newAmount = prompt('Изменить сумму:', category.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            category.amount = parseFloat(newAmount);
            
            // Обновляем транзакцию
            updateTransaction('кцию
            updateTransaction('expense', categoryIdexpense', categoryId, category.amount,, category.amount, category category.name);
            
           .name);
            
            saveData saveData();
();
        }
    }
}

// Обновление тран        }
    }
}

// Обновление транзакзакции
function updateTransaction(type, id, amount,ции
function updateTransaction(type, id, amount, description) description) {
    // Ищем транзакцию по {
    // Ищем транзакцию по ID
    const transactionIndex ID
    const transactionIndex = app = appData.transactions.findData.transactions.findIndex(tIndex(t => t.id === id);
    
    => t.id === id);
    
    if (transactionIndex !== - if (transactionIndex !== -1)1) {
        // Об {
        // Обновляемновляем существующую тран существующую транзакзакциюцию

        appData.transactions[transactionIndex].amount = type === 'income' ? amount        appData.transactions[transactionIndex].amount = type === 'income' ? amount : : -amount;
        appData.transactions -amount;
        appData.transactions[transactionIndex].description = description[transactionIndex].description = description;
        appData.trans;
        appDataactions[transactionIndex]..transactions[transactionIndex].date = new Date().todate = new Date().toISOISOString().split('T')[String().split('T')[0];
    }
}

0];
    }
}

// Удаление кружка доход// Удаление кружка доходов/долгов
ов/долгов
function deleteCircle(type, idfunction deleteCircle(type, id) {
    if (confirm) {
    if (confirm('('Удалить эту запись?'Удалить эту запись?')) {
        let items;
)) {
        let items;
        if        if ( (type === 'income')type === 'income') {
            items = appData.incomes {
            items = appData.incomes;
        } else if (type === 'debt') {
            items = appData.debts;
        }
        
        const index = items.findIndex(i => i.id;
        } else if (type === 'debt') {
            items = appData.debts;
        }
        
        const index = items.findIndex(i => i.id === id);
        if (index === id);
        if (index !== -1) !== -1) {
 {
            items.splice(index            items.splice(index, 1);
            
            // Удаляем тран, 1);
            
            // Удаляем транзакцию
            const transactionIndex = appData.transзакцию
            const transactionIndex = appData.transactionsactions.findIndex(t => t.id ===.findIndex(t => t.id === id);
            if (transaction id);
            if (transactionIndex !== -1) {
Index !== -1) {
                appData.transactions.s                appData.transactions.spliceplice(transactionIndex, 1(transactionIndex, 1);
);
            }
            
            }
            
                       saveData();
        }
    saveData();
        }
    }
}

// У }
}

// Удалениедаление категории расходов
function категории расходов
function deleteExp deleteExpenseCategory(categoryenseCategory(categoryId)Id) {
    if (confirm {
    if (confirm('('Удалить эту категориУдалить эту категориюю?')) {
        const?')) {
        const index index = appData.expense = appData.expenseCategories.findCategories.findIndex(c => c.idIndex(c => c.id === === categoryId);
        categoryId);
        if ( if (index !== -1)index !== -1) {
 {
            appData.exp            appData.expenseCategoriesenseCategories.splice.splice(index, 1(index, 1);
            
            //);
            
            // Удаляем транзакцию
 Удаляем транзакцию
            const            const transactionIndex = appData.trans transactionIndex = appData.transactions.findactions.findIndex(t => tIndex(t => t.id === category.id === categoryId);
Id);
            if (transactionIndex            if (transactionIndex !== - !== -1) {
               1) {
                appData.transactions.splice(transaction appData.transactions.splice(transactionIndex, 1Index, 1);
           );
            }
            
            save }
            
            saveData();
Data();
        }
    }
}

// Расчет бюджета
function calculate        }
    }
}

// Расчет бюджета
function calculateBudget() {
    const totalBudget() {
    const totalIncome = appData.incomesIncome = appData.incomes.reduce((sum.reduce((sum, item) => sum, item) => sum + item + item.amount, 0);
    const.amount, 0);
    const totalDebts = appData totalDebts = appData.debts.reduce.debts.reduce((((sum,sum, item) => sum + item. item) => sum + item.amountamount, 0);
    const totalExp, 0);
    const totalExpenses =enses = appData.expenseCategories appData.expenseCategories.reduce((sum, category) => sum + category.amount,.reduce((sum, category) => sum + category.amount, 0 0);
    const balance = totalIncome);
    const balance = totalIncome - totalDebts - total - totalDebts - totalExpExpenses;
    
enses;
    
    const resultsHTML = `
    const resultsHTML = `
               <div class="result <div class="result-item">
-item">
            <span>Об            <span>Общийщий доход:</span>
            доход:</span>
            <span class="income">${ <span class="income">${appData.settings.currencyappData.settings.currency}}${totalIncome}</span${totalIncome}</span>
       >
        </div>
        </div>
        < <div class="result-itemdiv class="result-item">
            <">
            <spanspan>Общие долги:</span>
>Общие долги:</span>
            <span class="de            <span class="debtbt">${appData.s">${appData.settingsettings.currency}${total.currency}${totalDebtsDebts}</span}</span>
        </div>
        <div>
        </div>
        <div class="result class="result-item">
            <-item">
            <span>Обspan>Общие расходы:</щие расходы:</span>
span>
            <span class            <span class="exp="expense">${appense">${appData.sData.settings.ettings.currency}${currency}${totalExpensestotalExpenses}</span>
        </div>
        <div}</span>
        </div>
        <div class=" class="result-item total">
            <span>result-item total">
            <span>ИтоговыйИтоговый баланс:</span>
            баланс:</span>
            <span <span class="${balance >= class="${balance >= 0 0 ? 'income' : 'expense'}">${appData.settings.currency} ? 'income' : 'expense'}">${appData.settings.currency}${Math.abs(b${Math.abs(balance)}</span>
       alance)}</span>
        </div </div>
    `;
    
   >
    `;
    
    document.getElementById('results document.getElementById('results-content').innerHTML = results-content').innerHTML = resultsHTML;
HTML;
    document.getElementById('    document.getElementById('results-cardresults-card').style.display =').style.display = 'block';
 'block';
}

// Очи}

// Очистстка всех данных
ка всех данных
function clearfunction clearAllData() {
   AllData() {
    if (confirm('Вы if (confirm('Вы уверены уверены? Все данные будут? Все данные будут удалены.')) удалены.')) {
        {
        appData = {
 appData = {
            incomes:            incomes: [],
            debts [],
            debts: [], 
           : [], 
            expenseCategories expenseCategories: [
: [
                { id:                 { id: 1, name1, name: "Е: "Еда", amount:да", amount: 0 },
 0 },
                {                { id: 2 id: 2, name, name: "Тран: "Транспорт",спорт", amount:  amount: 0 },
                {0 },
                { id: id: 3 3, name: "Раз, name: "Развлечения", amount: влечения", amount: 0 },
               0 },
                { id:  { id: 4, name:4, name: "Ком "Коммуналка",муналка", amount: amount: 0 },
                0 },
                { id { id: 5: 5, name:, name: "Одежда "Одежда", amount", amount: 0 },
: 0 },
                { id                { id: 6: 6, name: ", name: "ЗдоровЗдоровье", amountье", amount: 0: 0 }
            ],
 }
            ],
            transactions: [],
            transactions: [],
            settings            settings: { currency:: { currency: " "₽" }
       ₽" }
        };
        save };
        saveData();
        
       Data();
        
        document document.getElementById('.getElementById('resultsresults-content').innerHTML = '';
       -content').innerHTML = '';
        document.getElementById('results-card').style.display = ' document.getElementById('results-card').style.display = 'none';
        
        alert('Все данныеnone';
        
        alert('Все данные очищены!');
    }
}

// Обновление очищены!');
    }
}

// Обновление интерф интерфейса
functionейса
function updateUI updateUI() {
    updateCir() {
    updateCircles();
   cles();
    updateBalance();
}

 updateBalance();
}

// Об// Обновлениеновление кружков
 кружков
function updatefunction updateCircles() {
Circles() {
    updateCircleSection('income', appData.incomes);
    update    updateCircleSection('income', appData.incomes);
    updateCircleSection('debt',CircleSection('debt', appData appData.debts);
    updateExpenseCategories();
.debts);
    updateExpenseCategories();
}

//}

// Обновление секции Обновление секции с с кружками
 кружками
functionfunction updateCircleSection(type, items) updateCircleSection(type, items) {
    const container = document.getElementById(`${type}- {
    const container = document.getElementById(`${type}-circlescircles`);
    if (!`);
    if (!container)container) return;
    
    return;
    
    if if (items.length === 0) {
 (items.length === 0) {
        container.innerHTML        container.innerHTML = '<div class="empty-state"> = '<div class="empty-state">Нажми +Нажми + чтобы добавить</div>';
        return чтобы добавить</div>';
        return;
   ;
    }
    
    container }
    
    container.innerHTML = items.map.innerHTML = items.map(item =>(item => `
        <div class `
        <div class="="circle-item circle-circle-item circle-${type${type}" onclick="editCircle}" onclick="editCircle('('${type}', ${item${type}', ${item.id}).id})">
            <div class">
            <div class="circle="circle-amount">${appData.settings.currency-amount">${appData.settings.currency}${}${item.amountitem.amount}</div>
}</div>
            <div class="circle            <div class="circle-label-label">${item">${item.description}</div>
           .description}</div>
            < <button class="circlebutton class="circle-delete" onclick="event.stopProp-delete" onclick="event.stopPropagation(); deleteCircle('${agation(); deleteCircle('${type}', ${item.id})type}', ${item.id})">×</button>
       ">×</button>
        </div>
    `). </div>
    `).join('');
}

// Обновлениеjoin('');
}

// Обнов категорий расходление категорий расходов
function updateExpов
function updateExpenseCategories()enseCategories() {
    const container = document {
    const container = document.getElementById('.getElementById('expense-cirexpense-circles');
    if (!container) returncles');
    if (!container) return;
    
    if (;
    
    if (appData.expappData.expenseCategories.length === enseCategories.length === 0) {
        container0) {
        container.innerHTML = '<div.innerHTML = '<div class="empty class="empty-state">На-state">Нажмижми + чтобы добавить</div>';
        + чтобы добавить</div>';
        return;
    }
 return;
    }
    
       
    container.innerHTML = appData.expenseCategories container.innerHTML = appData.expenseCategories.map(category => `
        <div class.map(category => `
        <div class="="circle-item circle-expensecircle-item circle-expense" onclick="editExpenseCategory" onclick="editExpenseCategory(${category.id})">
(${category.id})">
                       <div class="circle <div class="circle-amount-amount">${appData.s">${appData.settingsettings.currency.currency}${}${category.amount}</div>
category.amount}</div>
            <div class="circle-label            <div class="circle-label">">${category.name}</${category.name}</div>
            <button classdiv>
            <button class="circle="circle-delete" onclick-delete" onclick="event="event.stopPropagation(); delete.stopPropagation(); deleteExpExpenseCategory(${category.idenseCategory(${category.id})">×</button>
})">×</button>
        </div>
    `).        </div>
    `).joinjoin('');
}

// Обновление('');
}

// Обновление баланса баланса
function updateBalance() {
    const totalIncome = app
function updateBalance() {
    const totalIncome = appData.incomes.reduceData.incomes.reduce((sum, item((sum, item) => sum) => sum + item. + item.amount, 0amount, 0);
   );
    const totalDebts const totalDebts = app = appData.debtsData.debts.reduce((sum.reduce((sum, item), item) => sum + item => sum + item.amount.amount, , 0);
    const0);
    const totalExp totalExpenses = appDataenses = appData.expenseCategories.reduce((sum.expenseCategories.reduce((sum, category) =>, category) => sum + sum + category.amount category.amount, 0, 0);
    const balance);
    const balance = total = totalIncome - totalDebIncome - totalDebts -ts - totalExpenses;
 totalExpenses;
    
    document.getElementById    
    document.getElementById('balance-('balance-amount').textContent =amount').textContent = appData.settings. appData.settings.currencycurrency + balance;
}

// Обновление списка + balance;
}

// Обновление списка опера операций
function updateOperationsListций
function updateOperationsList()() {
    const container = {
    const container = document.getElementById('operations-list');
    document.getElementById('operations-list');
    if (!container) if (!container) return return;
    
    // Сортиру;
    
    // Сортируем транзакции по даем транзакции по дате (новые сверху)
те (новые сверху)
    const sortedTransactions    const sortedTransactions = [...appData.transactions = [...appData.transactions].sort((a].sort((a, b) => new Date(b, b) => new Date(b.date) -.date) - new Date new Date(a.date));
(a.date));
    
    if    
    if (sortedTransactions.length (sortedTransactions.length ===  === 0) {
       0) {
        container.innerHTML container.innerHTML = '<div class = '<div class="empty-state="empty-state">Нет">Нет операций</div>';
        операций</div>';
        return;
    return;
    }
    
    container.innerHTML = }
    
    container.innerHTML = sortedTransactions.map(transaction => {
        const type sortedTransactions.map(transaction => {
        const typeClass = transaction.amount >Class = transaction.amount > 0 ? ' 0 ? 'income'income' : 'expense : 'expense';
        const type';
        const typeIcon =Icon = transaction.amount > transaction.amount > 0 ? ' 0 ? '💰'💰' : ' : '🛒';
🛒';
        const typeColor =        const typeColor = transaction transaction.amount > .amount > 0 ?0 ? '#34C759 '#34C759' : '#FF3B30';
        
        return `
' : '#FF3B30';
        
        return `
            <div class="operation-item">
                <div class="operation-info">
            <div class="operation                    <div class="-item">
                <div class="operation-info">
                    <div class="operation-icon"operation-icon" style="background: style="background: ${type ${typeColor}">
                        ${Color}">
                        ${typetypeIcon}
                    </div>
Icon}
                    </div>
                    <div class="operation                    <div class="operation-details">
                        <div-details">
                        <div class="operation-title class="operation-title">${">${transaction.description}</divtransaction.description}</div>
>
                        <div class="                        <div class="operation-meta">${formatoperation-meta">${formatDate(transaction.date)}</Date(transaction.date)}</divdiv>
                    </div>
>
                    </div>
                               </div>
 </div>
                               < <divdiv class="operation-amount ${typeClass}">
                    ${transaction class="operation-amount ${typeClass}">
                    ${transaction.amount.amount > 0 ? > 0 ? '+' : '+' : ''} ''}${appData.s${appData.settings.ettings.currency}${Mathcurrency}${Math.abs(.abs(transaction.transaction.amount)}
                </amount)}
                </div>
            </div>
            </div>
        `;
   div>
        `;
    }).join }).join('');
}

// Фор('');
}

// Форматирование датыматирование даты

function formatDate(dateString) {
   function formatDate(dateString) {
    const date = const date = new Date(dateString);
    return date.toLocale new Date(dateString);
    return date.toLocaleDateString('ruDateString('ru-RU-RU');
}

// Ча');
}

// Часы
сы
function startClock()function startClock() {
    {
    function updateTime() function updateTime() {
        {
        const now = new const now = new Date();
 Date();
        const timeElement        const timeElement = document = document.getElementById('current-time');
       .getElementById('current-time');
        if if (timeElement) {
 (timeElement) {
            timeElement.textContent =            timeElement.textContent = 
                
                now.getHours(). now.getHours().toString().padStart(2toString().padStart(2,, '0') + ' '0') + ':' + 
                now.get:' + 
                now.getMinutes().Minutes().toString().padStarttoString().padStart(2(2, '0, '0');
        }
');
        }
    }
    
    }
    
    updateTime    updateTime();
    setInterval(updateTime();
    setInterval(updateTime, 60000);
}

// Настрой, 60000);
}

// Настройки
ки
function showSettingsModal() {
function showSettingsModal() {
    const    const action = confirm(" action = confirm("НастройНастройки:\n\nОК - Очистить все данные\nОтки:\n\nОК - Очистить все данные\nОтмена - Отмена");
    if (action) {
        clearAllмена - Отмена");
    if (action) {
        clearAllData();
Data();
    }
}

//    }
}

// Функ Функция для отладция для отладки -ки - показывает все данные показывает все данные в в кон консоли
function debugData() {
   соли
function debugData() {
    console.log("Incomes:", console.log("Incomes:", appData appData.incomes);
   .incomes);
    console console.log("Debts:",.log("Debts:", appData.debts);
 appData.debts);
       console.log("Expense console.log("Expense Categories:", Categories:", appData appData.expenseCategories);
    console.log.expenseCategories);
    console.log("Transactions:", app("Transactions:", appData.transactions);
}