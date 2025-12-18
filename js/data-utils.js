/**
 * Утилиты для работы с данными - экспорт/импорт JSON
 * Поскольку браузеры не могут напрямую записывать файлы из соображений безопасности,
 * эти функции предоставляют альтернативу localStorage через загрузку/выгрузку файлов
 */

class DataUtils {
    /**
     * Экспортирует данные из localStorage в JSON файл
     * @param {string} filename - имя файла для сохранения
     * @param {string[]} keys - ключи localStorage для экспорта (если не указано - все)
     */
    static exportToJSON(filename = 'agrозаявки-данные.json', keys = null) {
        try {
            const data = {};
            
            // Если ключи не указаны, экспортируем все данные localStorage
            if (!keys) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    data[key] = localStorage.getItem(key);
                }
            } else {
                // Экспортируем только указанные ключи
                keys.forEach(key => {
                    const value = localStorage.getItem(key);
                    if (value !== null) {
                        data[key] = value;
                    }
                });
            }
            
            // Создаем JSON с красивым форматированием
            const jsonString = JSON.stringify(data, null, 2);
            
            // Создаем и загружаем файл
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`Данные экспортированы в файл: ${filename}`);
            return true;
        } catch (error) {
            console.error('Ошибка при экспорте данных:', error);
            return false;
        }
    }
    
    /**
     * Импортирует данные из JSON файла в localStorage
     * @param {File} file - файл для импорта
     * @param {boolean} merge - объединить с существующими данными (true) или заменить (false)
     * @returns {Promise<boolean>} - успешность операции
     */
    static async importFromJSON(file, merge = true) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // Если не объединяем, очищаем localStorage
                        if (!merge) {
                            localStorage.clear();
                        }
                        
                        // Загружаем данные в localStorage
                        Object.keys(data).forEach(key => {
                            localStorage.setItem(key, data[key]);
                        });
                        
                        console.log('Данные успешно импортированы');
                        resolve(true);
                    } catch (parseError) {
                        console.error('Ошибка при разборе JSON:', parseError);
                        reject(false);
                    }
                };
                
                reader.onerror = function() {
                    console.error('Ошибка при чтении файла');
                    reject(false);
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('Ошибка при импорте данных:', error);
                reject(false);
            }
        });
    }
    
    /**
     * Создает элемент для загрузки файла и возвращает выбранный файл
     * @param {string} accept - типы принимаемых файлов
     * @returns {Promise<File>} - выбранный файл
     */
    static selectFile(accept = '.json') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (file) {
                    resolve(file);
                } else {
                    reject(new Error('Файл не выбран'));
                }
            };
            
            input.click();
        });
    }
    
    /**
     * Сохраняет конкретные данные в формате JSON
     * @param {Object} data - данные для сохранения
     * @param {string} filename - имя файла
     */
    static saveDataAsJSON(data, filename = 'данные.json') {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
            return false;
        }
    }
    
    /**
     * Получает размер данных в localStorage
     * @returns {Object} - информация о размере данных
     */
    static getStorageInfo() {
        let totalSize = 0;
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            keys.push(key);
            totalSize += key.length + value.length;
        }
        
        return {
            keysCount: keys.length,
            totalSizeBytes: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            keys: keys
        };
    }
    
    /**
     * Очищает устаревшие данные из localStorage
     * @param {number} daysBefore - количество дней для определения устаревших данных
     */
    static cleanOldData(daysBefore = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBefore);
        
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Проверяем данные с временными метками
            if (key.includes('_timestamp') || key.includes('_date')) {
                try {
                    const value = localStorage.getItem(key);
                    const data = JSON.parse(value);
                    
                    if (data.timestamp && new Date(data.timestamp) < cutoffDate) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    // Если не удается распарсить, пропускаем
                    continue;
                }
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        return keysToRemove.length;
    }
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataUtils;
}

// Делаем доступным глобально в браузере
if (typeof window !== 'undefined') {
    window.DataUtils = DataUtils;
}
