class SavingsGoalsService {
    constructor(storageService) {
        this.storage = storageService;
        this.goals = [];
    }

    async load(data = null) {
        try {
            if (data?.savingsGoals) {
                this.goals = data.savingsGoals;
            } else {
                this.goals = await this.storage.getAll('savingsGoals');
            }
        } catch (error) {
            console.error('Error loading savings goals:', error);
            this.goals = [];
        }
    }

    async createGoal(goalData) {
        const goal = {
            id: Date.now(),
            name: goalData.name,
            targetAmount: goalData.targetAmount,
            currentAmount: goalData.initialAmount || 0,
            deadline: goalData.deadline,
            icon: goalData.icon || '🎯',
            category: goalData.category || 'general',
            color: goalData.color || '#007AFF',
            createdAt: new Date().toISOString(),
            isCompleted: false
        };

        this.goals.push(goal);
        await this.storage.add('savingsGoals', goal);
        return goal;
    }

    async addToGoal(goalId, amount) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return null;

        goal.currentAmount += amount;
        if (goal.currentAmount >= goal.targetAmount) {
            goal.currentAmount = goal.targetAmount;
            goal.isCompleted = true;
            goal.completedAt = new Date().toISOString();
        }
        
        goal.updatedAt = new Date().toISOString();
        await this.storage.put('savingsGoals', goal);
        return goal;
    }

    getGoalProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return 0;
        return (goal.currentAmount / goal.targetAmount) * 100;
    }

    getDaysRemaining(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !goal.deadline) return null;
        
        const today = new Date();
        const deadline = new Date(goal.deadline);
        const diffTime = deadline - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getRecommendedMonthlySave(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !goal.deadline) return null;
        
        const daysRemaining = this.getDaysRemaining(goalId);
        if (daysRemaining <= 0) return goal.targetAmount - goal.currentAmount;
        
        const monthsRemaining = daysRemaining / 30.44;
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        
        return remainingAmount / Math.max(1, Math.ceil(monthsRemaining));
    }

    getTimeToGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return null;
        
        const monthlySave = this.getRecommendedMonthlySave(goalId);
        const remaining = goal.targetAmount - goal.currentAmount;
        
        if (monthlySave <= 0) return null;
        return Math.ceil(remaining / monthlySave);
    }

    getGoals() {
        return this.goals;
    }

    getActiveGoals() {
        return this.goals.filter(goal => !goal.isCompleted);
    }

    getCompletedGoals() {
        return this.goals.filter(goal => goal.isCompleted);
    }

    async updateGoal(goalId, updates) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            Object.assign(goal, updates, {
                updatedAt: new Date().toISOString()
            });
            
            if (goal.currentAmount >= goal.targetAmount) {
                goal.isCompleted = true;
                goal.completedAt = new Date().toISOString();
            } else {
                goal.isCompleted = false;
                goal.completedAt = null;
            }
            
            await this.storage.put('savingsGoals', goal);
            return goal;
        }
        return null;
    }

    async deleteGoal(goalId) {
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            this.goals.splice(index, 1);
            await this.storage.delete('savingsGoals', goalId);
            return true;
        }
        return false;
    }

    getTotalSaved() {
        return this.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    }

    getTotalTarget() {
        return this.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    }

    toJSON() {
        return this.goals;
    }
}