const addButton = document.getElementById('add-expense');
const expensesContainer = document.getElementById('expenses-container');

addButton.addEventListener('click',function(){

     const firstExpense = document.querySelector('.expense-item');
    
    // Клонируем её
    const newExpense = firstExpense.cloneNode(true);
    
    // Очищаем поля в новой категории
    newExpense.querySelector('.category').value = '';
    newExpense.querySelector('.amount').value = '';
    
    // Добавляем в контейнер
    expensesContainer.appendChild(newExpense);
});

const calculateButton = document.getElementById('calculate');

calculateButton.addEventListener('click', function() {
    // Получаем доход
    const income = document.getElementById('income').value;
    console.log('Доход:', income);
    
    // Получаем все категории расходов
    const expenseItems = document.querySelectorAll('.expense-item');
    console.log('Найдено категорий:', expenseItems.length);
});

document.getElementById('calculate').addEventListener('click', function() {
    // 1. Получаем доход
    const income = Number(document.getElementById('income').value);
    
    // 2. Собираем все категории расходов
    const expenseItems = document.querySelectorAll('.expense-item');
    let expenses = [];
    let totalExpenses = 0;

    // 3. Проходим по всем категориям и собираем данные
    expenseItems.forEach(function(item) {
        const category = item.querySelector('.category').value;
        const amount = Number(item.querySelector('.amount').value);
        
        // Добавляем только если заполнены оба поля
        if (category && amount > 0) {
            expenses.push({ category, amount });
            totalExpenses += amount;
        }
    });

    // 4. Рассчитываем баланс
    const balance = income - totalExpenses;

    // 5. Показываем блок результатов
    document.getElementById('results').style.display = 'block';
    
    // 6. Формируем отчет
    let reportHTML = `
        <p><strong>💰 Доход:</strong> ${income} руб.</p>
        <p><strong>💸 Общие расходы:</strong> ${totalExpenses} руб.</p>
        <p><strong>✅ Баланс:</strong> ${balance} руб.</p>
    `;

    // 7. Добавляем детализацию по категориям
    if (expenses.length > 0) {
        reportHTML += `<h3>📊 Детализация расходов:</h3>`;
        expenses.forEach(function(expense) {
            const percent = ((expense.amount / income) * 100).toFixed(1);
            reportHTML += `<p>• ${expense.category}: ${expense.amount} руб. (${percent}%)</p>`;
        });
    }

    // 8. Выводим отчет
    document.getElementById('report').innerHTML = reportHTML;
});