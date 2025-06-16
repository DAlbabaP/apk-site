// Пользовательский дашборд с интеграцией API
// Обновлено для работы с базой данных - 2025-06-16

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.userApplications = [];
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadUserData();
        await this.loadApplications();
        this.updateStats();
        this.initNavigation();
        this.initForms();
        this.renderApplications();
    }

    // Проверка авторизации
    checkAuth() {
        if (!AuthManager.isAuthenticated()) {
            window.location.href = '/agrozayavki/login.html';
            return;
        }

        this.currentUser = AuthManager.getCurrentUser();
        
        if (this.currentUser.role !== 'user') {
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
    }

    // Загрузка данных пользователя
    async loadUserData() {
        if (this.currentUser) {
            // Обновляем интерфейс с данными пользователя
            document.getElementById('userName').textContent = 
                `${this.currentUser.first_name} ${this.currentUser.last_name}`;
            document.getElementById('userRole').textContent = 'Пользователь';
        }
    }

    // Загрузка заявок пользователя
    async loadApplications() {
        try {
            this.userApplications = await ApplicationsAPI.getAll();
            console.log('Loaded applications:', this.userApplications);
        } catch (error) {
            console.error('Failed to load applications:', error);
            Utils.showNotification('Ошибка загрузки заявок', 'error');
            this.userApplications = [];
        }
    }

    // Обновление статистики
    updateStats() {
        const stats = {
            total: this.userApplications.length,
            pending: this.userApplications.filter(app => app.status === 'pending').length,
            inProgress: this.userApplications.filter(app => app.status === 'in_progress').length,
            completed: this.userApplications.filter(app => app.status === 'completed').length
        };

        document.getElementById('totalRequests').textContent = stats.total;
        document.getElementById('pendingRequests').textContent = stats.pending;
        document.getElementById('activeRequests').textContent = stats.inProgress;
        document.getElementById('completedRequests').textContent = stats.completed;
    }

    // Инициализация навигации
    initNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav a');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(item.getAttribute('href').substring(1));
            });
        });

        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            AuthManager.logout();
        });
    }

    // Показать секцию
    showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });

        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Обновляем активный пункт меню
        document.querySelectorAll('.sidebar-nav a').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Обновляем контент секции
        if (sectionId === 'applications') {
            this.renderApplications();
        }
    }

    // Инициализация форм
    initForms() {
        // Форма создания заявки
        const createForm = document.getElementById('createApplicationForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateApplication(e));
        }

        // Кнопка создания заявки
        const createBtn = document.getElementById('createRequestBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateForm());
        }
    }

    // Показать форму создания заявки
    showCreateForm() {
        const modal = document.getElementById('createApplicationModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Скрыть форму создания заявки
    hideCreateForm() {
        const modal = document.getElementById('createApplicationModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('createApplicationForm').reset();
        }
    }

    // Обработка создания заявки
    async handleCreateApplication(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const applicationData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority') || 'medium',
            quantity: parseInt(formData.get('quantity')) || null,
            unit: formData.get('unit'),
            delivery_address: formData.get('delivery_address'),
            delivery_date: formData.get('delivery_date'),
            budget: parseFloat(formData.get('budget')) || null
        };

        try {
            await ApplicationsAPI.create(applicationData);
            Utils.showNotification('Заявка успешно создана', 'success');
            this.hideCreateForm();
            await this.loadApplications();
            this.updateStats();
            this.renderApplications();
        } catch (error) {
            console.error('Failed to create application:', error);
            Utils.showNotification('Ошибка создания заявки: ' + error.message, 'error');
        }
    }

    // Отрисовка заявок
    renderApplications() {
        const container = document.getElementById('applicationsContainer');
        if (!container) return;

        if (this.userApplications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>У вас пока нет заявок</h3>
                    <p>Создайте первую заявку, нажав кнопку "Создать заявку"</p>
                    <button class="btn btn-primary" onclick="dashboard.showCreateForm()">Создать заявку</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.userApplications.map(app => `
            <div class="application-card" data-id="${app.id}">
                <div class="application-header">
                    <h3>${app.title}</h3>
                    <span class="status-badge status-${app.status}">${Utils.getStatusText(app.status)}</span>
                </div>
                <div class="application-details">
                    <p><strong>Категория:</strong> ${Utils.getCategoryText(app.category)}</p>
                    <p><strong>Приоритет:</strong> ${Utils.getPriorityText(app.priority)}</p>
                    <p><strong>Описание:</strong> ${app.description}</p>
                    ${app.quantity ? `<p><strong>Количество:</strong> ${app.quantity} ${app.unit || ''}</p>` : ''}
                    ${app.budget ? `<p><strong>Бюджет:</strong> ${Utils.formatCurrency(app.budget)}</p>` : ''}
                    ${app.delivery_date ? `<p><strong>Дата поставки:</strong> ${Utils.formatDate(app.delivery_date)}</p>` : ''}
                    ${app.delivery_address ? `<p><strong>Адрес доставки:</strong> ${app.delivery_address}</p>` : ''}
                    ${app.manager_first_name ? `<p><strong>Менеджер:</strong> ${app.manager_first_name} ${app.manager_last_name}</p>` : ''}
                </div>
                <div class="application-footer">
                    <small>Создана: ${Utils.formatDate(app.created_at)}</small>
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

    // Редактирование заявки
    async editApplication(id) {
        const application = this.userApplications.find(app => app.id === id);
        if (!application) return;

        // Заполняем форму данными заявки
        const form = document.getElementById('createApplicationForm');
        form.title.value = application.title;
        form.description.value = application.description;
        form.category.value = application.category;
        form.priority.value = application.priority;
        form.quantity.value = application.quantity || '';
        form.unit.value = application.unit || '';
        form.delivery_address.value = application.delivery_address || '';
        form.delivery_date.value = application.delivery_date || '';
        form.budget.value = application.budget || '';

        // Меняем обработчик формы на редактирование
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.handleUpdateApplication(e, id);
        };

        // Показываем форму
        this.showCreateForm();
        document.querySelector('#createApplicationModal h2').textContent = 'Редактировать заявку';
    }

    // Обработка обновления заявки
    async handleUpdateApplication(e, id) {
        const formData = new FormData(e.target);
        const applicationData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            quantity: parseInt(formData.get('quantity')) || null,
            unit: formData.get('unit'),
            delivery_address: formData.get('delivery_address'),
            delivery_date: formData.get('delivery_date'),
            budget: parseFloat(formData.get('budget')) || null
        };

        try {
            await ApplicationsAPI.update(id, applicationData);
            Utils.showNotification('Заявка успешно обновлена', 'success');
            this.hideCreateForm();
            
            // Возвращаем обычный обработчик
            document.getElementById('createApplicationForm').onsubmit = (e) => this.handleCreateApplication(e);
            document.querySelector('#createApplicationModal h2').textContent = 'Создать заявку';
            
            await this.loadApplications();
            this.updateStats();
            this.renderApplications();
        } catch (error) {
            console.error('Failed to update application:', error);
            Utils.showNotification('Ошибка обновления заявки: ' + error.message, 'error');
        }
    }

    // Удаление заявки
    async deleteApplication(id) {
        if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
            return;
        }

        try {
            await ApplicationsAPI.delete(id);
            Utils.showNotification('Заявка успешно удалена', 'success');
            await this.loadApplications();
            this.updateStats();
            this.renderApplications();
        } catch (error) {
            console.error('Failed to delete application:', error);
            Utils.showNotification('Ошибка удаления заявки: ' + error.message, 'error');
        }
    }
}

// Инициализация дашборда
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
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
