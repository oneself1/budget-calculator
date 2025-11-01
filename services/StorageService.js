class StorageService {
    constructor() {
        this.key = 'budgetAppData';
    }

    load() {
        try {
            const saved = localStorage.getItem(this.key);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('StorageService: Error loading data', e);
            return null;
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('StorageService: Error saving data', e);
            return false;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.key);
            return true;
        } catch (e) {
            console.error('StorageService: Error clearing data', e);
            return false;
        }
    }
}