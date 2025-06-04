// Скрипты из products-api.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Класс ProductAPI для работы с backend API
class ProductAPI {
    constructor() {
        this.products = [];
        this.sets = [];
        this.init();
    }

    async init() {
        this.initTabs();
        await this.renderProducts();
        await this.renderSets();
        await this.renderProductSelectors();
        this.updateApiMethod();
    }

    // Инициализация табов
    initTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
            });
        });
        const apiMethod = document.getElementById('apiMethod');
        if (apiMethod) {
            apiMethod.addEventListener('change', () => this.updateApiMethod());
        }
    }

    // Загрузка товаров с API
    async loadProducts() {
        const token = localStorage.getItem('token') || 'demo_token';
        try {
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });
            if (response.status === 401) {
                this.showNotification('productNotification', 'Требуется авторизация', 'error');
                return [];
            }
            if (response.status === 403) {
                this.showNotification('productNotification', 'Доступ запрещён', 'error');
                return [];
            }
            return await response.json();
        } catch (e) {
            this.showNotification('productNotification', 'Ошибка загрузки товаров', 'error');
            return [];
        }
    }

    // Загрузка наборов с API
    async loadSets() {
        const token = localStorage.getItem('token') || 'demo_token';
        try {
            const response = await fetch('/api/sets', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });
            if (response.status === 401) {
                this.showNotification('setNotification', 'Требуется авторизация', 'error');
                return [];
            }
            if (response.status === 403) {
                this.showNotification('setNotification', 'Доступ запрещён', 'error');
                return [];
            }
            return await response.json();
        } catch (e) {
            this.showNotification('setNotification', 'Ошибка загрузки наборов', 'error');
            return [];
        }
    }

    // Добавление товара через API
    async addProduct() {
        const product = {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value,
            storage_temp: parseInt(document.getElementById('storageTemp').value) || 0,
            storage_humidity: parseInt(document.getElementById('storageHumidity').value) || 0,
            shelf_life: parseInt(document.getElementById('shelfLife').value) || 0,
            seasonality: document.getElementById('seasonality').value,
            packaging: document.getElementById('packaging').value,
            special_care: document.getElementById('specialCare').value,
            description: document.getElementById('productDescription').value.trim(),
        };
        if (!product.name || !product.category) {
            this.showNotification('productNotification', 'Заполните обязательные поля: название и категория', 'error');
            return;
        }
        const token = localStorage.getItem('token') || 'demo_token';
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(product)
            });
            if (response.status === 401) {
                this.showNotification('productNotification', 'Требуется авторизация', 'error');
                return;
            }
            if (response.status === 403) {
                this.showNotification('productNotification', 'Доступ запрещён', 'error');
                return;
            }
            if (!response.ok) {
                const data = await response.json();
                this.showNotification('productNotification', data.error || 'Ошибка при добавлении товара', 'error');
                return;
            }
            this.clearProductForm();
            this.showNotification('productNotification', 'Товар успешно добавлен', 'success');
            await this.renderProducts();
            await this.renderProductSelectors();
        } catch (e) {
            this.showNotification('productNotification', 'Ошибка сети при добавлении товара', 'error');
        }
    }

    // Очистка формы товара
    clearProductForm() {
        document.getElementById('productName').value = '';
        document.getElementById('productCategory').value = '';
        document.getElementById('storageTemp').value = '';
        document.getElementById('storageHumidity').value = '';
        document.getElementById('shelfLife').value = '';
        document.getElementById('seasonality').value = '';
        document.getElementById('packaging').value = '';
        document.getElementById('specialCare').value = '';
        document.getElementById('productDescription').value = '';
    }

    // Отображение товаров
    async renderProducts() {
        const container = document.getElementById('productsContainer');
        this.products = await this.loadProducts();
        if (!this.products || this.products.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h4>Товары не найдены</h4><p>Добавьте первый товар для начала работы</p></div>`;
        } else {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Категория</th>
                            <th>Хранение</th>
                            <th>Срок годности</th>
                            <th>Сезонность</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products.map(product => `
                            <tr>
                                <td><strong>${product.name || product['name']}</strong></td>
                                <td>${this.getCategoryName(product.category || product['category'])}</td>
                                <td>${(product.storage_temp ?? product.storageTemp) || 0}°C, ${(product.storage_humidity ?? product.storageHumidity) || 0}%</td>
                                <td>${(product.shelf_life ?? product.shelfLife) || 0} дней</td>
                                <td>${this.getSeasonName(product.seasonality || product['seasonality'])}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Удаление товара
    async deleteProduct(productId) {
        if (!confirm('Вы действительно хотите удалить этот товар?')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            if (response.status === 403) {
                this.showNotification('productNotification', 'Доступ запрещён', 'error');
                return;
            }
            if (!response.ok) {
                const data = await response.json();
                this.showNotification('productNotification', data.message || 'Ошибка при удалении товара', 'error');
                return;
            }
            this.showNotification('productNotification', 'Товар удалён', 'success');
            await this.renderProducts();
            await this.renderProductSelectors();
        } catch (e) {
            this.showNotification('productNotification', 'Ошибка сети при удалении товара', 'error');
        }
    }

    // Создание набора
    async createSet() {
        const selectedProducts = Array.from(document.querySelectorAll('#setProductsSelector input[type="checkbox"]:checked')).map(cb => cb.value);
        const set = {
            name: document.getElementById('setName').value.trim(),
            type: document.getElementById('setType').value,
            description: document.getElementById('setDescription').value.trim(),
            products: selectedProducts
        };
        if (!set.name || !set.type || selectedProducts.length === 0) {
            this.showNotification('setNotification', 'Заполните все поля и выберите товары', 'error');
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/sets', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(set)
            });
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            if (response.status === 403) {
                this.showNotification('setNotification', 'Доступ запрещён', 'error');
                return;
            }
            const data = await response.json();
            if (data.issues && data.issues.length > 0) {
                const confirmed = confirm(`Обнаружены проблемы совместимости:\n${data.issues.join('\n')}\n\nПродолжить создание набора?`);
                if (!confirmed) return;
            }
            this.clearSetForm();
            this.showNotification('setNotification', 'Набор товаров создан', 'success');
            await this.renderSets();
        } catch (e) {
            this.showNotification('setNotification', 'Ошибка сети при создании набора', 'error');
        }
    }

    // Очистка формы набора
    clearSetForm() {
        document.getElementById('setName').value = '';
        document.getElementById('setType').value = '';
        document.getElementById('setDescription').value = '';
        document.querySelectorAll('#setProductsSelector input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    // Удаление набора
    async deleteSet(setId) {
        if (!confirm('Вы действительно хотите удалить этот набор?')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/sets/${setId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                }
            });
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            if (response.status === 403) {
                this.showNotification('setNotification', 'Доступ запрещён', 'error');
                return;
            }
            if (!response.ok) {
                const data = await response.json();
                this.showNotification('setNotification', data.message || 'Ошибка при удалении набора', 'error');
                return;
            }
            this.showNotification('setNotification', 'Набор удалён', 'success');
            await this.renderSets();
        } catch (e) {
            this.showNotification('setNotification', 'Ошибка сети при удалении набора', 'error');
        }
    }

    // Отображение наборов
    async renderSets() {
        const container = document.getElementById('setsContainer');
        this.sets = await this.loadSets();
        if (!this.sets || this.sets.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="icon">🧩</div><h4>Наборы не найдены</h4><p>Создайте первый набор для начала работы</p></div>`;
        } else {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Описание</th>
                            <th>Товары</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.sets.map(set => `
                            <tr>
                                <td><strong>${set.name || set['name']}</strong></td>
                                <td>${this.getSetTypeName(set.type || set['type'])}</td>
                                <td>${set.description || set['description'] || ''}</td>
                                <td>${(set.products || set['products'] || []).map(pid => {
                                    const p = this.products.find(pr => pr.id == pid || pr.id == Number(pid));
                                    return p ? `<span class='badge'>${p.name || p['name']}</span>` : '';
                                }).join(' ')}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="productAPI.deleteSet('${set.id || set['id']}')">Удалить</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Отображение селекторов товаров
    async renderProductSelectors() {
        const setSelector = document.getElementById('setProductsSelector');
        this.products = await this.loadProducts();
        if (setSelector) {
            if (!this.products || this.products.length === 0) {
                setSelector.innerHTML = '<p style="color: var(--gray-medium);">Нет доступных товаров</p>';
            } else {
                setSelector.innerHTML = this.products.map(product => `
                    <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" value="${product.id}" style="margin-right: 0.5rem;">
                        <span>${product.name} (${this.getCategoryName(product.category)})</span>
                    </label>
                `).join('');
            }
        }
        const compatibilitySelector = document.getElementById('compatibilitySelector');
        if (compatibilitySelector) {
            if (!this.products || this.products.length === 0) {
                compatibilitySelector.innerHTML = '<p style="color: var(--gray-medium);">Нет доступных товаров</p>';
            } else {
                compatibilitySelector.innerHTML = this.products.map(product => `
                    <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" value="${product.id}" style="margin-right: 0.5rem;">
                        <span>${product.name} (${this.getCategoryName(product.category)})</span>
                    </label>
                `).join('');
            }
        }
    }

    // Проверка совместимости (локальная логика)
    checkCompatibility() {
        const selectedProducts = Array.from(document.querySelectorAll('#compatibilitySelector input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selectedProducts.length < 2) {
            this.showNotification('compatibilityResults', 'Выберите минимум 2 товара для проверки', 'error', true);
            return;
        }
        const result = this.checkProductsCompatibility(selectedProducts);
        this.displayCompatibilityResults(result);
    }

    // Проверка совместимости товаров (локальная логика)
    checkProductsCompatibility(productIds) {
        const products = this.products.filter(p => productIds.includes(p.id));
        const issues = [];
        const warnings = [];
        const tempRanges = products.map(p => p.storageTemp);
        const humidityRanges = products.map(p => p.storageHumidity);
        if (Math.max(...tempRanges) - Math.min(...tempRanges) > 10) {
            issues.push('Разные требования к температуре хранения (разница > 10°C)');
        }
        if (Math.max(...humidityRanges) - Math.min(...humidityRanges) > 20) {
            issues.push('Разные требования к влажности (разница > 20%)');
        }
        const packagingTypes = [...new Set(products.map(p => p.packaging).filter(Boolean))];
        const incompatiblePackaging = [ ['glass', 'metal'], ['plastic', 'glass'] ];
        incompatiblePackaging.forEach(([type1, type2]) => {
            if (packagingTypes.includes(type1) && packagingTypes.includes(type2)) {
                warnings.push(`Несовместимые типы упаковки: ${type1} и ${type2}`);
            }
        });
        const seasons = [...new Set(products.map(p => p.seasonality).filter(Boolean))];
        if (seasons.length > 1 && !seasons.includes('year-round')) {
            warnings.push('Товары предназначены для разных сезонов');
        }
        const specialCares = [...new Set(products.map(p => p.specialCare).filter(Boolean))];
        const conflictingCares = [ ['refrigerated', 'dry'], ['dark', 'ventilated'] ];
        conflictingCares.forEach(([care1, care2]) => {
            if (specialCares.includes(care1) && specialCares.includes(care2)) {
                issues.push(`Конфликтующие особые условия: ${care1} и ${care2}`);
            }
        });
        return {
            compatible: issues.length === 0,
            issues,
            warnings,
            products
        };
    }

    // Отображение результатов совместимости
    displayCompatibilityResults(result) {
        const container = document.getElementById('compatibilityResults');
        let html = '<div style="margin-top: 2rem;">';
        html += '<h4>Результаты проверки совместимости</h4>';
        if (result.compatible && result.warnings.length === 0) {
            html += '<div class="notification success">✅ Все товары полностью совместимы</div>';
        } else {
            if (result.issues.length > 0) {
                html += '<div class="notification error">';
                html += '<strong>❌ Критические проблемы совместимости:</strong><ul>';
                result.issues.forEach(issue => html += `<li>${issue}</li>`);
                html += '</ul></div>';
            }
            if (result.warnings.length > 0) {
                html += '<div class="notification warning">';
                html += '<strong>⚠️ Предупреждения:</strong><ul>';
                result.warnings.forEach(warning => html += `<li>${warning}</li>`);
                html += '</ul></div>';
            }
        }
        html += '<h5>Проверенные товары:</h5>';
        html += '<div class="compatibility-grid">';
        result.products.forEach(product => {
            html += `
                <div class="compatibility-card">
                    <h6>${product.name}</h6>
                    <p>Температура: ${product.storageTemp}°C</p>
                    <p>Влажность: ${product.storageHumidity}%</p>
                    <p>Упаковка: ${this.getPackagingName(product.packaging)}</p>
                    <p>Сезон: ${this.getSeasonName(product.seasonality)}</p>
                </div>
            `;
        });
        html += '</div></div>';
        container.innerHTML = html;
    }

    // Обновление метода API (демо)
    updateApiMethod() {
        const method = document.getElementById('apiMethod')?.value;
        const endpoint = document.getElementById('apiEndpoint');
        const body = document.getElementById('apiBody');
        if (!method || !endpoint || !body) return;
        switch (method) {
            case 'GET':
                endpoint.value = '/api/products';
                body.value = '';
                body.disabled = true;
                break;
            case 'POST':
                endpoint.value = '/api/products';
                body.disabled = false;
                body.value = JSON.stringify({
                    name: "Семена пшеницы",
                    category: "seeds",
                    storageTemp: 15,
                    storageHumidity: 50,
                    shelfLife: 365,
                    seasonality: "spring",
                    packaging: "paper",
                    description: "Высококачественные семена озимой пшеницы"
                }, null, 2);
                break;
            case 'PUT':
                endpoint.value = '/api/products/{id}';
                body.disabled = false;
                body.value = JSON.stringify({
                    name: "Семена пшеницы (обновленные)",
                    storageTemp: 18
                }, null, 2);
                break;
            case 'DELETE':
                endpoint.value = '/api/products/{id}';
                body.value = '';
                body.disabled = true;
                break;
        }
    }

    // Тестирование API (только визуализация)
    testAPI() {
        const method = document.getElementById('apiMethod').value;
        const endpoint = document.getElementById('apiEndpoint').value;
        const body = document.getElementById('apiBody').value;
        let response;
        let status;
        switch (method) {
            case 'GET':
                status = 200;
                response = {
                    success: true,
                    data: this.products,
                    total: this.products.length
                };
                break;
            case 'POST':
                try {
                    const newProduct = JSON.parse(body);
                    status = 201;
                    response = {
                        success: true,
                        message: "Товар успешно создан",
                        data: { ...newProduct, id: this.generateId() }
                    };
                } catch (e) {
                    status = 400;
                    response = {
                        success: false,
                        error: "Некорректный JSON"
                    };
                }
                break;
            case 'PUT':
                status = 200;
                response = {
                    success: true,
                    message: "Товар успешно обновлен"
                };
                break;
            case 'DELETE':
                status = 200;
                response = {
                    success: true,
                    message: "Товар успешно удален"
                };
                break;
        }
        this.displayAPIResponse(method, endpoint, status, response);
    }

    // Отображение ответа API (только визуализация)
    displayAPIResponse(method, endpoint, status, response) {
        const container = document.getElementById('apiResponse');
        const statusColor = status < 300 ? '#4CAF50' : status < 500 ? '#FF9800' : '#F44336';
        container.innerHTML = `
            <div class="api-response">
                <div style="margin-bottom: 1rem; color: #ffeb3b;">
                    <strong>${method} ${endpoint}</strong>
                </div>
                <div style="margin-bottom: 1rem; color: ${statusColor};">
                    Status: ${status}
                </div>
                <div style="color: #f8f8f2;">
                    <strong>Response:</strong><br>
                    <pre>${JSON.stringify(response, null, 2)}</pre>
                </div>
            </div>
        `;
    }

    // Утилиты
    generateId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    getCategoryName(category) {
        const categories = {
            'seeds': 'Семена',
            'fertilizers': 'Удобрения',
            'pesticides': 'Пестициды',
            'equipment': 'Оборудование',
            'feeds': 'Корма'
        };
        return categories[category] || category;
    }
    getSeasonName(season) {
        const seasons = {
            'spring': 'Весна',
            'summer': 'Лето',
            'autumn': 'Осень',
            'winter': 'Зима',
            'year-round': 'Круглый год'
        };
        return seasons[season] || season;
    }
    getPackagingName(packaging) {
        const packagings = {
            'plastic': 'Пластик',
            'glass': 'Стекло',
            'metal': 'Металл',
            'paper': 'Бумага',
            'fabric': 'Ткань'
        };
        return packagings[packaging] || packaging;
    }
    getSetTypeName(type) {
        const types = {
            'seasonal': 'Сезонный',
            'functional': 'Функциональный',
            'promotional': 'Промо-набор',
            'starter': 'Стартовый'
        };
        return types[type] || type;
    }
    showNotification(containerId, message, type, useContainer = false) {
        const container = document.getElementById(containerId);
        const notification = `<div class="notification ${type}">${message}</div>`;
        if (useContainer) {
            container.innerHTML = notification;
        } else {
            container.innerHTML = notification;
            setTimeout(() => { container.innerHTML = ''; }, 5000);
        }
    }
}

// Глобальные функции для products-api.html
let productAPI;
document.addEventListener('DOMContentLoaded', () => {
    productAPI = new ProductAPI();
    window.addProduct = () => productAPI.addProduct();
    window.clearProductForm = () => productAPI.clearProductForm();
    window.createSet = () => productAPI.createSet();
    window.clearSetForm = () => productAPI.clearSetForm();
    window.checkCompatibility = () => productAPI.checkCompatibility();
    window.testAPI = () => productAPI.testAPI();
});
