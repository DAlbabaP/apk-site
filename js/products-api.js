// Скрипты из products-api.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система управления товарами и API
        class ProductAPI {
            constructor() {
                this.products = this.loadProducts();
                this.sets = this.loadSets();
                this.init();
            }

            init() {
                this.initTabs();
                this.renderProducts();
                this.renderSets();
                this.renderProductSelectors();
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

                document.getElementById('apiMethod').addEventListener('change', () => {
                    this.updateApiMethod();
                });
            }

            // Загрузка товаров
            loadProducts() {
                try {
                    return JSON.parse(localStorage.getItem('agro_products') || '[]');
                } catch {
                    return [];
                }
            }

            // Загрузка наборов
            loadSets() {
                try {
                    return JSON.parse(localStorage.getItem('agro_sets') || '[]');
                } catch {
                    return [];
                }
            }

            // Сохранение товаров
            saveProducts() {
                localStorage.setItem('agro_products', JSON.stringify(this.products));
            }

            // Сохранение наборов
            saveSets() {
                localStorage.setItem('agro_sets', JSON.stringify(this.sets));
            }

            // Добавление товара
            addProduct() {
                const product = {
                    id: this.generateId(),
                    name: document.getElementById('productName').value.trim(),
                    category: document.getElementById('productCategory').value,
                    storageTemp: parseInt(document.getElementById('storageTemp').value) || 0,
                    storageHumidity: parseInt(document.getElementById('storageHumidity').value) || 0,
                    shelfLife: parseInt(document.getElementById('shelfLife').value) || 0,
                    seasonality: document.getElementById('seasonality').value,
                    packaging: document.getElementById('packaging').value,
                    specialCare: document.getElementById('specialCare').value,
                    description: document.getElementById('productDescription').value.trim(),
                    createdAt: new Date().toISOString()
                };

                // Валидация
                if (!product.name || !product.category) {
                    this.showNotification('productNotification', 'Заполните обязательные поля: название и категория', 'error');
                    return;
                }

                // Проверка уникальности
                if (this.products.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
                    this.showNotification('productNotification', 'Товар с таким названием уже существует', 'error');
                    return;
                }

                this.products.push(product);
                this.saveProducts();
                this.renderProducts();
                this.renderProductSelectors();
                this.clearProductForm();
                this.showNotification('productNotification', 'Товар успешно добавлен', 'success');
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
            renderProducts() {
                const container = document.getElementById('productsContainer');
                
                if (this.products.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📦</div>
                            <h4>Товары не найдены</h4>
                            <p>Добавьте первый товар для начала работы</p>
                        </div>
                    `;
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
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.products.map(product => `
                                    <tr>
                                        <td><strong>${product.name}</strong></td>
                                        <td>${this.getCategoryName(product.category)}</td>
                                        <td>${product.storageTemp}°C, ${product.storageHumidity}%</td>
                                        <td>${product.shelfLife} дней</td>
                                        <td>${this.getSeasonName(product.seasonality)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="productAPI.editProduct('${product.id}')">
                                                Редактировать
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="productAPI.deleteProduct('${product.id}')">
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }
            }

            // Удаление товара
            deleteProduct(productId) {
                if (confirm('Вы действительно хотите удалить этот товар?')) {
                    this.products = this.products.filter(p => p.id !== productId);
                    this.saveProducts();
                    this.renderProducts();
                    this.renderProductSelectors();
                    this.showNotification('productNotification', 'Товар удален', 'success');
                }
            }

            // Создание набора
            createSet() {
                const selectedProducts = Array.from(document.querySelectorAll('#setProductsSelector input[type="checkbox"]:checked'))
                    .map(checkbox => checkbox.value);

                const set = {
                    id: this.generateId(),
                    name: document.getElementById('setName').value.trim(),
                    type: document.getElementById('setType').value,
                    description: document.getElementById('setDescription').value.trim(),
                    products: selectedProducts,
                    createdAt: new Date().toISOString()
                };

                // Валидация
                if (!set.name || !set.type || selectedProducts.length === 0) {
                    this.showNotification('setNotification', 'Заполните все поля и выберите товары', 'error');
                    return;
                }

                // Проверка совместимости
                const compatibilityCheck = this.checkProductsCompatibility(selectedProducts);
                if (compatibilityCheck.issues.length > 0) {
                    const confirmed = confirm(`Обнаружены проблемы совместимости:\n${compatibilityCheck.issues.join('\n')}\n\nПродолжить создание набора?`);
                    if (!confirmed) return;
                }

                this.sets.push(set);
                this.saveSets();
                this.renderSets();
                this.clearSetForm();
                this.showNotification('setNotification', 'Набор товаров создан', 'success');
            }

            // Очистка формы набора
            clearSetForm() {
                document.getElementById('setName').value = '';
                document.getElementById('setType').value = '';
                document.getElementById('setDescription').value = '';
                document.querySelectorAll('#setProductsSelector input[type="checkbox"]').forEach(cb => cb.checked = false);
            }

            // Отображение наборов
            renderSets() {
                const container = document.getElementById('setsContainer');
                
                if (this.sets.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📋</div>
                            <h4>Наборы не найдены</h4>
                            <p>Создайте первый набор товаров</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Тип</th>
                                    <th>Товаров</th>
                                    <th>Описание</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.sets.map(set => `
                                    <tr>
                                        <td><strong>${set.name}</strong></td>
                                        <td>${this.getSetTypeName(set.type)}</td>
                                        <td>${set.products.length}</td>
                                        <td>${set.description.substring(0, 50)}${set.description.length > 50 ? '...' : ''}</td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="productAPI.editSet('${set.id}')">
                                                Редактировать
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="productAPI.deleteSet('${set.id}')">
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }
            }

            // Удаление набора
            deleteSet(setId) {
                if (confirm('Вы действительно хотите удалить этот набор?')) {
                    this.sets = this.sets.filter(s => s.id !== setId);
                    this.saveSets();
                    this.renderSets();
                    this.showNotification('setNotification', 'Набор удален', 'success');
                }
            }

            // Отображение селекторов товаров
            renderProductSelectors() {
                // Для создания наборов
                const setSelector = document.getElementById('setProductsSelector');
                if (setSelector) {
                    if (this.products.length === 0) {
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

                // Для проверки совместимости
                const compatibilitySelector = document.getElementById('compatibilitySelector');
                if (compatibilitySelector) {
                    if (this.products.length === 0) {
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

            // Проверка совместимости
            checkCompatibility() {
                const selectedProducts = Array.from(document.querySelectorAll('#compatibilitySelector input[type="checkbox"]:checked'))
                    .map(checkbox => checkbox.value);

                if (selectedProducts.length < 2) {
                    this.showNotification('compatibilityResults', 'Выберите минимум 2 товара для проверки', 'error', true);
                    return;
                }

                const result = this.checkProductsCompatibility(selectedProducts);
                this.displayCompatibilityResults(result);
            }

            // Проверка совместимости товаров
            checkProductsCompatibility(productIds) {
                const products = this.products.filter(p => productIds.includes(p.id));
                const issues = [];
                const warnings = [];

                // Проверка условий хранения
                const tempRanges = products.map(p => p.storageTemp);
                const humidityRanges = products.map(p => p.storageHumidity);
                
                if (Math.max(...tempRanges) - Math.min(...tempRanges) > 10) {
                    issues.push('Разные требования к температуре хранения (разница > 10°C)');
                }

                if (Math.max(...humidityRanges) - Math.min(...humidityRanges) > 20) {
                    issues.push('Разные требования к влажности (разница > 20%)');
                }

                // Проверка упаковки
                const packagingTypes = [...new Set(products.map(p => p.packaging).filter(Boolean))];
                const incompatiblePackaging = [
                    ['glass', 'metal'],
                    ['plastic', 'glass']
                ];

                incompatiblePackaging.forEach(([type1, type2]) => {
                    if (packagingTypes.includes(type1) && packagingTypes.includes(type2)) {
                        warnings.push(`Несовместимые типы упаковки: ${type1} и ${type2}`);
                    }
                });

                // Проверка сезонности
                const seasons = [...new Set(products.map(p => p.seasonality).filter(Boolean))];
                if (seasons.length > 1 && !seasons.includes('year-round')) {
                    warnings.push('Товары предназначены для разных сезонов');
                }

                // Проверка особых условий
                const specialCares = [...new Set(products.map(p => p.specialCare).filter(Boolean))];
                const conflictingCares = [
                    ['refrigerated', 'dry'],
                    ['dark', 'ventilated']
                ];

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

            // Обновление метода API
            updateApiMethod() {
                const method = document.getElementById('apiMethod').value;
                const endpoint = document.getElementById('apiEndpoint');
                const body = document.getElementById('apiBody');

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

            // Тестирование API
            testAPI() {
                const method = document.getElementById('apiMethod').value;
                const endpoint = document.getElementById('apiEndpoint').value;
                const body = document.getElementById('apiBody').value;

                // Симуляция API ответа
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

            // Отображение ответа API
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

            // Генерация тестовых данных
            generateSampleData() {
                const sampleProducts = [
                    {
                        id: this.generateId(),
                        name: "Семена подсолнечника",
                        category: "seeds",
                        storageTemp: 15,
                        storageHumidity: 45,
                        shelfLife: 365,
                        seasonality: "spring",
                        packaging: "paper",
                        specialCare: "dry",
                        description: "Высокоурожайный сорт подсолнечника",
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        name: "Комплексное удобрение NPK",
                        category: "fertilizers",
                        storageTemp: 20,
                        storageHumidity: 40,
                        shelfLife: 730,
                        seasonality: "year-round",
                        packaging: "plastic",
                        specialCare: "dry",
                        description: "Универсальное минеральное удобрение",
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: this.generateId(),
                        name: "Гербицид широкого спектра",
                        category: "pesticides",
                        storageTemp: 10,
                        storageHumidity: 60,
                        shelfLife: 1095,
                        seasonality: "spring",
                        packaging: "plastic",
                        specialCare: "dark",
                        description: "Эффективное средство против сорняков",
                        createdAt: new Date().toISOString()
                    }
                ];

                this.products = [...this.products, ...sampleProducts];
                this.saveProducts();
                this.renderProducts();
                this.renderProductSelectors();
                this.showNotification('productNotification', 'Тестовые данные добавлены', 'success');
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
                    setTimeout(() => {
                        container.innerHTML = '';
                    }, 5000);
                }
            }
        }

        // Глобальные функции
        function addProduct() {
            productAPI.addProduct();
        }

        function clearProductForm() {
            productAPI.clearProductForm();
        }

        function createSet() {
            productAPI.createSet();
        }

        function clearSetForm() {
            productAPI.clearSetForm();
        }

        function checkCompatibility() {
            productAPI.checkCompatibility();
        }

        function testAPI() {
            productAPI.testAPI();
        }

        function generateSampleData() {
            productAPI.generateSampleData();
        }

        // Инициализация
        let productAPI;
        document.addEventListener('DOMContentLoaded', () => {
            productAPI = new ProductAPI();
        });
