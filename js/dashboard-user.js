// Пользовательский дашборд с интеграцией API
// Обновлено для работы с базой данных - 2025-06-16

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.userApplications = [];
        this.init();
    }    async init() {
        this.checkAuth();
        await this.loadUserData();
        await this.loadApplications();
        this.updateStats();
        this.initNavigation();
        this.initForms();
        this.renderApplications();
        this.renderProfile();
        this.showSection('dashboard'); // Показываем дашборд по умолчанию
    }// Проверка авторизации
    checkAuth() {
        if (!window.AuthManager || !AuthManager.isAuthenticated()) {
            console.log('❌ User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = AuthManager.getCurrentUser();
        
        if (!this.currentUser) {
            console.log('❌ No user data found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        if (this.currentUser.role !== 'user') {
            console.log('❌ User role mismatch, redirecting to appropriate dashboard');
            // Перенаправляем на соответствующий дашборд
            const dashboards = {
                'manager': 'dashboard-manager.html',
                'admin': 'dashboard-admin.html'
            };
            if (dashboards[this.currentUser.role]) {
                window.location.href = dashboards[this.currentUser.role];
            }
            return;
        }

        console.log('✅ User authenticated:', this.currentUser.username);
    }    // Загрузка данных пользователя
    async loadUserData() {
        if (!this.currentUser) return;

        let user = this.currentUser;
        console.log('📋 Loading user data:', user);

        // Загружаем полные данные пользователя через API профиля
        try {
            if (window.api && window.api.users && window.api.users.getProfile) {
                console.log('🔄 Loading user profile via API...');
                const profileResponse = await window.api.users.getProfile();
                if (profileResponse.success && profileResponse.user) {
                    console.log('📋 Full user profile loaded:', profileResponse.user);
                    Object.assign(this.currentUser, profileResponse.user);
                    user = this.currentUser;
                }
            }
        } catch (error) {
            console.warn('Could not load user profile:', error);
        }

        // Обновляем интерфейс с данными пользователя
        const displayName = user.full_name || (user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : user.username) || 'Пользователь';

        const setElementText = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`✅ Updated ${id} = "${value}"`);
            }
        };

        setElementText('userName', displayName);
        setElementText('userRole', 'Пользователь');
        
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement) {
            avatarElement.textContent = displayName.charAt(0).toUpperCase();
        }
    }    // Загрузка заявок пользователя
    async loadApplications() {
        try {
            console.log('🔄 Loading user applications via API...');
            
            if (!window.api || !window.api.applications) {
                console.error('❌ API not available');
                this.userApplications = [];
                return;
            }

            const response = await window.api.applications.getAll();
            
            if (response.success && response.applications) {
                // Пользователь видит только свои заявки
                this.userApplications = response.applications.filter(app => 
                    app.user_id == this.currentUser.id
                );
                console.log('✅ User applications loaded:', this.userApplications.length);
            } else {
                console.error('❌ Failed to load applications:', response.error);
                this.userApplications = [];
            }
        } catch (error) {
            console.error('❌ Error loading applications:', error);
            this.showNotification('Ошибка загрузки заявок: ' + error.message, 'error');
            this.userApplications = [];
        }
    }    // Обновление статистики
    updateStats() {
        const stats = {
            total: this.userApplications.length,
            pending: this.userApplications.filter(app => app.status === 'pending').length,
            inProgress: this.userApplications.filter(app => app.status === 'in_progress').length,
            completed: this.userApplications.filter(app => app.status === 'completed').length
        };

        const setStatValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setStatValue('totalRequests', stats.total);
        setStatValue('pendingRequests', stats.pending);
        setStatValue('activeRequests', stats.inProgress);
        setStatValue('completedRequests', stats.completed);
    }    // Инициализация навигации
    initNavigation() {
        // Навигация по секциям - обработка всех элементов с data-page
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.showSection(page);
                }
            });
        });

        // Навигация по секциям в сайдбаре
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.showSection(page);
                }
            });
        });

        // Кнопка выхода
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }// Показать секцию
    showSection(sectionId) {
        console.log('🔄 Switching to section:', sectionId);
        
        // Скрываем все секции
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('✅ Section activated:', sectionId);
        } else {
            console.warn('❌ Section not found:', sectionId);
        }

        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-link').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${sectionId}"]`);
        if (activeLink && activeLink.classList.contains('nav-link')) {
            activeLink.classList.add('active');
        }        // Обновляем контент секции
        if (sectionId === 'requests') {
            this.renderApplications();
        } else if (sectionId === 'profile') {
            this.renderProfile();
        } else if (sectionId === 'create-request') {
            this.resetCreateForm();
        }
    }    // Инициализация форм
    initForms() {
        // Форма создания заявки
        const createForm = document.getElementById('createRequestForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateRequest(e));
        }

        // Форма профиля
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
        }

        // Кнопка создания заявки
        const createBtn = document.getElementById('createRequestBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showSection('create-request'));
        }

        // Все ссылки на создание заявки
        document.querySelectorAll('[data-page="create-request"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('create-request');
            });
        });
    }    // Отрисовка профиля
    renderProfile() {
        if (!this.currentUser) return;

        const user = this.currentUser;
        
        // Заполняем поля формы профиля
        const setFieldValue = (id, value) => {
            const field = document.getElementById(id);
            if (field) {
                field.value = value || '';
            }
        };

        setFieldValue('profileFullName', user.full_name || '');
        setFieldValue('profileLogin', user.username || '');
        setFieldValue('profilePhone', user.phone || '');
        setFieldValue('profileEmail', user.email || '');

        console.log('✅ Profile form populated with user data');
    }

    // Обработка обновления профиля
    async handleUpdateProfile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = {
            full_name: formData.get('profileFullName') || formData.get('full_name'),
            phone: formData.get('profilePhone') || formData.get('phone'),
            email: formData.get('profileEmail') || formData.get('email')
        };

        console.log('📝 Updating profile:', profileData);

        try {
            if (!window.api || !window.api.users) {
                throw new Error('API недоступен');
            }

            const response = await window.api.users.updateProfile(profileData);
            
            if (response.success) {
                this.showNotification('Профиль успешно обновлен', 'success');
                
                // Обновляем локальные данные пользователя
                Object.assign(this.currentUser, profileData);
                
                // Обновляем отображение имени в шапке
                await this.loadUserData();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Failed to update profile:', error);
            this.showNotification('Ошибка обновления профиля: ' + error.message, 'error');
        }
    }

    // Сброс формы создания заявки
    resetCreateForm() {
        const form = document.getElementById('createRequestForm');
        if (form) {
            form.reset();
        }
    }

    // Обработка создания заявки (обновленная версия)
    async handleCreateRequest(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const applicationData = {
            title: formData.get('requestTitle') || formData.get('title'),
            description: formData.get('requestDescription') || formData.get('description'),
            category: formData.get('requestCategory') || formData.get('category'),
            priority: formData.get('requestPriority') || formData.get('priority') || 'medium'
        };

        console.log('📝 Creating application:', applicationData);

        try {
            if (!window.api || !window.api.applications) {
                throw new Error('API недоступен');
            }

            const response = await window.api.applications.create(applicationData);
            
            if (response.success) {
                this.showNotification('Заявка успешно создана', 'success');
                this.resetCreateForm();
                await this.loadApplications();
                this.updateStats();
                this.renderApplications();
                // Переходим на страницу заявок
                this.showSection('requests');
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Failed to create application:', error);
            this.showNotification('Ошибка создания заявки: ' + error.message, 'error');
        }    }

    // Отрисовка заявок
    renderApplications() {
        // Обновляем контейнер на странице заявок
        const requestsContainer = document.getElementById('requestsContainer');
        if (requestsContainer) {
            if (this.userApplications.length === 0) {
                requestsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <h4>У вас пока нет заявок</h4>
                        <p>Создайте первую заявку, нажав кнопку "Создать заявку"</p>
                        <button class="btn btn-primary" onclick="dashboard.showSection('create-request')">Создать заявку</button>
                    </div>
                `;
            } else {
                requestsContainer.innerHTML = this.userApplications.map(app => `
                    <div class="application-card" data-id="${app.id}">
                        <div class="application-header">
                            <h3>${app.title}</h3>
                            <span class="status-badge status-${app.status}">${this.getStatusText(app.status)}</span>
                        </div>
                        <div class="application-details">
                            <p><strong>Категория:</strong> ${this.getCategoryText(app.category)}</p>
                            <p><strong>Приоритет:</strong> ${this.getPriorityText(app.priority)}</p>
                            <p><strong>Описание:</strong> ${app.description}</p>
                            ${app.quantity ? `<p><strong>Количество:</strong> ${app.quantity} ${app.unit || ''}</p>` : ''}
                            ${app.budget ? `<p><strong>Бюджет:</strong> ${this.formatCurrency(app.budget)}</p>` : ''}
                            ${app.delivery_date ? `<p><strong>Дата поставки:</strong> ${this.formatDate(app.delivery_date)}</p>` : ''}
                            ${app.delivery_address ? `<p><strong>Адрес доставки:</strong> ${app.delivery_address}</p>` : ''}
                            ${app.manager_first_name ? `<p><strong>Менеджер:</strong> ${app.manager_first_name} ${app.manager_last_name}</p>` : ''}
                        </div>
                        <div class="application-footer">
                            <small>Создана: ${this.formatDate(app.created_at)}</small>
                            <div class="application-actions">
                                ${app.status === 'pending' ? `
                                    <button class="btn btn-sm btn-secondary" onclick="dashboard.editApplication(${app.id})">Редактировать</button>
                                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteApplication(${app.id})">Удалить</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Обновляем контейнер последних заявок на главной странице
        const recentContainer = document.getElementById('recentRequestsContainer');
        if (recentContainer) {
            if (this.userApplications.length === 0) {
                recentContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📭</div>
                        <h4>Заявок пока нет</h4>
                        <p>Создайте первую заявку, чтобы начать работу</p>
                        <button class="btn btn-primary" onclick="dashboard.showSection('create-request')">Создать заявку</button>
                    </div>
                `;
            } else {
                // Показываем последние 3 заявки
                const recentApps = this.userApplications.slice(0, 3);
                recentContainer.innerHTML = recentApps.map(app => `
                    <div class="request-item">
                        <div class="request-info">
                            <h4>${app.title}</h4>
                            <p>${app.description.substring(0, 100)}${app.description.length > 100 ? '...' : ''}</p>
                            <span class="status-badge status-${app.status}">${this.getStatusText(app.status)}</span>
                        </div>
                        <div class="request-date">
                            ${this.formatDate(app.created_at)}
                        </div>
                    </div>
                `).join('');
            }
        }
    }    // Редактирование заявки
    async editApplication(id) {
        const application = this.userApplications.find(app => app.id === id);
        if (!application) return;

        // Переходим на страницу создания заявки
        this.showSection('create-request');

        // Заполняем форму данными заявки
        setTimeout(() => {
            const form = document.getElementById('createRequestForm');
            if (form) {
                form.requestTitle.value = application.title;
                form.requestDescription.value = application.description;
                form.requestCategory.value = application.category;
                form.requestPriority.value = application.priority;

                // Меняем обработчик формы на редактирование
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    await this.handleUpdateApplication(e, id);
                };

                // Меняем заголовок
                const header = document.querySelector('#create-request .content-header h2');
                if (header) header.textContent = 'Редактирование заявки';
            }
        }, 100);
    }

    // Обработка обновления заявки
    async handleUpdateApplication(e, id) {
        const formData = new FormData(e.target);
        const applicationData = {
            title: formData.get('requestTitle') || formData.get('title'),
            description: formData.get('requestDescription') || formData.get('description'),
            category: formData.get('requestCategory') || formData.get('category'),
            priority: formData.get('requestPriority') || formData.get('priority')
        };

        try {
            if (!window.api || !window.api.applications) {
                throw new Error('API недоступен');
            }

            const response = await window.api.applications.update(id, applicationData);
            
            if (response.success) {
                this.showNotification('Заявка успешно обновлена', 'success');
                
                // Возвращаем обычный обработчик
                document.getElementById('createRequestForm').onsubmit = (e) => this.handleCreateRequest(e);
                const header = document.querySelector('#create-request .content-header h2');
                if (header) header.textContent = 'Создание заявки';
                
                await this.loadApplications();
                this.updateStats();
                this.renderApplications();
                
                // Переходим на страницу заявок
                this.showSection('requests');
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Failed to update application:', error);
            this.showNotification('Ошибка обновления заявки: ' + error.message, 'error');        }
    }

    // Удаление заявки
    async deleteApplication(id) {
        if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
            return;
        }

        try {
            if (!window.api || !window.api.applications) {
                throw new Error('API недоступен');
            }

            const response = await window.api.applications.delete(id);
            
            if (response.success) {
                this.showNotification('Заявка успешно удалена', 'success');
                await this.loadApplications();
                this.updateStats();
                this.renderApplications();
            } else {
                throw new Error(response.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('❌ Failed to delete application:', error);
            this.showNotification('Ошибка удаления заявки: ' + error.message, 'error');
        }
    }

    // Вспомогательные функции
    getStatusText(status) {
        const statuses = {
            'pending': 'Ожидает',
            'in_progress': 'В работе',
            'completed': 'Выполнена',
            'cancelled': 'Отменена'
        };
        return statuses[status] || status;
    }    getCategoryText(category) {
        const categories = {
            'seeds': 'Семена',
            'fertilizers': 'Удобрения',
            'equipment': 'Оборудование',
            'consultation': 'Консультация',
            'other': 'Прочее',
            // Поддержка старых значений для совместимости
            'maintenance': 'Техническое обслуживание',
            'repair': 'Ремонт оборудования',
            'supply': 'Поставка материалов'
        };
        return categories[category] || 'Не указано';
    }    getPriorityText(priority) {
        const priorities = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'urgent': 'Срочный'
        };
        return priorities[priority] || priority;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '2rem';
        notification.style.right = '2rem';
        notification.style.padding = '1rem 1.5rem';
        notification.style.borderRadius = '8px';
        notification.style.color = 'white';
        notification.style.fontWeight = '500';
        notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        notification.style.background = type === 'success' ? '#388E3C' : '#D32F2F';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    logout() {
        console.log('🚪 User logging out...');
        if (window.AuthManager) {
            AuthManager.logout();
        } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('currentSession');
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        }
    }
}

// Функция ожидания готовности AuthManager и API
function waitForAuthManager() {
    return new Promise((resolve) => {
        function checkReady() {
            console.log('🔍 Checking API readiness...', {
                AuthManager: !!window.AuthManager,
                api: !!window.api,
                applications: !!(window.api && window.api.applications),
                users: !!(window.api && window.api.users)
            });
            
            if (window.AuthManager && window.api && window.api.applications && window.api.users) {
                console.log('✅ All APIs ready');
                resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        }
        checkReady();
    });
}

// Инициализация дашборда
let dashboard;
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 UserDashboard initializing...');
    
    // Ждем готовности AuthManager
    await waitForAuthManager();
    console.log('✅ AuthManager ready, starting UserDashboard');
    
    dashboard = new UserDashboard();
});

// Закрытие модальных окон по клику вне их
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Закрытие модальных окон по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});
