class CacheService {
    constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 минут по умолчанию
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }

    set(key, value, ttl = this.defaultTTL) {
        // Очистка устаревших записей
        this.cleanup();
        
        // Если достигли максимума, удаляем самую старую запись
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl,
            createdAt: Date.now()
        });
        
        return true;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Проверяем не устарела ли запись
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    getSize() {
        return this.cache.size;
    }

    getStats() {
        const now = Date.now();
        let expired = 0;
        let active = 0;

        for (const item of this.cache.values()) {
            if (now > item.expiry) {
                expired++;
            } else {
                active++;
            }
        }

        return {
            total: this.cache.size,
            active,
            expired,
            hitRate: this.calculateHitRate()
        };
    }

    calculateHitRate() {
        // Простая реализация - в реальном приложении нужно отслеживать запросы
        return this.cache.size / this.maxSize;
    }
}