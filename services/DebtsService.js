class DebtsService {
    constructor(storageService) {
        this.storage = storageService;
        this.debts = [];
    }

    load(data) {
        this.debts = data?.debts || [];
    }

    add(debt) {
        const newDebt = {
            id: Date.now(),
            paidAmount: 0,
            paymentHistory: [],
            ...debt,
            date: new Date().toISOString()
        };
        this.debts.push(newDebt);
        return newDebt;
    }

    update(id, updatedDebt) {
        const index = this.debts.findIndex(debt => debt.id === id);
        if (index !== -1) {
            this.debts[index] = { ...this.debts[index], ...updatedDebt };
            return this.debts[index];
        }
        return null;
    }

    delete(id) {
        const index = this.debts.findIndex(debt => debt.id === id);
        if (index !== -1) {
            return this.debts.splice(index, 1)[0];
        }
        return null;
    }

    get(id) {
        return this.debts.find(debt => debt.id === id);
    }

    getAll() {
        return this.debts;
    }

    getTotal() {
        return this.debts.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    getTotalPaid() {
        return this.debts.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    }

    makePayment(debtId, paymentAmount) {
        const debt = this.get(debtId);
        if (!debt) {
            throw new Error("Долг не найден");
        }

        const remaining = debt.amount - (debt.paidAmount || 0);
        
        if (paymentAmount <= 0) {
            throw new Error("Сумма платежа должна быть больше 0");
        }

        if (paymentAmount > remaining) {
            throw new Error("Сумма платежа не может превышать оставшуюся сумму долга");
        }

        debt.paidAmount = (debt.paidAmount || 0) + paymentAmount;
        
        if (!debt.paymentHistory) {
            debt.paymentHistory = [];
        }
        
        debt.paymentHistory.push({
            date: new Date().toISOString(),
            amount: paymentAmount
        });

        return debt;
    }

    updatePayment(debtId, paymentIndex, updatedPayment) {
        const debt = this.get(debtId);
        if (!debt || !debt.paymentHistory || debt.paymentHistory.length <= paymentIndex) {
            throw new Error("Платеж не найден");
        }

        // Вычитаем старую сумму платежа
        const oldPayment = debt.paymentHistory[paymentIndex];
        debt.paidAmount -= oldPayment.amount;

        // Обновляем платеж
        debt.paymentHistory[paymentIndex] = { ...oldPayment, ...updatedPayment };

        // Добавляем новую сумму платежа
        debt.paidAmount += debt.paymentHistory[paymentIndex].amount;

        return debt.paymentHistory[paymentIndex];
    }

    deletePayment(debtId, paymentIndex) {
        const debt = this.get(debtId);
        if (!debt || !debt.paymentHistory || debt.paymentHistory.length <= paymentIndex) {
            throw new Error("Платеж не найден");
        }

        const deletedPayment = debt.paymentHistory.splice(paymentIndex, 1)[0];
        debt.paidAmount -= deletedPayment.amount;

        return deletedPayment;
    }
}