// Система управления администраторской панелью
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.requests = [];
        this.managers = [];
        this.currentEditUser = null;
        this.currentAssignRequest = null;
        this.init();
    }

    async init() {
        this.checkAuth();
        await this.loadData();
        this.updateStats();
        this.initNavigation();
        this.initFilters();
        this.renderDashboard();
    }

    // Проверка авторизации
    checkAuth() {
        try {
            // Используем новую систему авторизации
            if (!AuthManager.isAuthenticated()) {
                console.log('❌ User not authenticated, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            const user = AuthManager.getCurrentUser();
            if (!user) {
                console.log('❌ No user data found, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            if (user.role !== 'admin') {
                console.log('❌ User is not admin, redirecting to appropriate dashboard');
                const dashboards = {
                    'user': 'dashboard-user.html',
                    'manager': 'dashboard-manager.html'
                };
                if (dashboards[user.role]) {
                    window.location.href = dashboards[user.role];
                }
                return;
            }

            console.log('✅ Admin user authenticated:', user.username);
            this.currentUser = user;
            
            // Обновляем информацию в шапке
            document.getElementById('userName').textContent = user.full_name || user.username || 'Администратор';
            document.getElementById('userRole').textContent = 'Администратор';
            document.getElementById('userAvatar').textContent = (user.full_name || user.username || 'А').charAt(0).toUpperCase();
        } catch (error) {
            console.error('❌ Auth check error:', error);
            window.location.href = 'login.html';
        }
    }

    // Загрузка данных
    async loadData() {
        try {
            console.log('🔄 Loading admin data from API...');
            
            // Загружаем пользователей
            const usersResponse = await UsersAPI.getAll();
            this.users = usersResponse.users || [];
            console.log('✅ Users loaded:', this.users.length);
            
            // Загружаем заявки
            const applicationsResponse = await ApplicationsAPI.getAll();
            this.requests = applicationsResponse.applications || [];
            console.log('✅ Applications loaded:', this.requests.length);
            
            // Фильтруем менеджеров
            this.managers = this.users.filter(user => user.role === 'manager');
            console.log('✅ Managers found:', this.managers.length);
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            this.users = [];
            this.requests = [];
            this.managers = [];
        }
    }

    // Обновление статистики
    async updateStats() {
        try {
            console.log('🔄 Loading admin statistics...');
            const statsResponse = await StatsAPI.getAdminStats();
            const stats = statsResponse.stats;
            
            document.getElementById('totalUsers').textContent = stats.total_users || 0;
            document.getElementById('totalRequests').textContent = stats.total_applications || 0;
            document.getElementById('pendingRequests').textContent = stats.pending_applications || 0;
            document.getElementById('completedRequests').textContent = stats.completed_applications || 0;
            
            console.log('✅ Admin statistics updated');
        } catch (error) {
            console.error('❌ Failed to load statistics:', error);
            // Fallback к локальным подсчетам
            const totalUsers = this.users.length;
            const totalRequests = this.requests.length;
            const pendingRequests = this.requests.filter(req => 
                ['new', 'pending'].includes(req.status)
            ).length;
            const completedRequests = this.requests.filter(req => 
                req.status === 'completed'
            ).length;

            document.getElementById('totalUsers').textContent = totalUsers;
            document.getElementById('totalRequests').textContent = totalRequests;
            document.getElementById('pendingRequests').textContent = pendingRequests;
            document.getElementById('completedRequests').textContent = completedRequests;
        }
    }

    // Инициализация навигации
    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page) {
                    this.showPage(page);
                }
            });
        });
    }

    // Инициализация фильтров
    initFilters() {
        // Фильтры пользователей
        ['userRoleFilter', 'userStatusFilter'].forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.renderUsers();
                });
            }
        });

        // Фильтры заявок
        ['requestStatusFilter', 'requestPriorityFilter', 'requestAssignmentFilter'].forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.renderRequests();
                });
            }
        });
    }

    // Показ страницы
    showPage(pageId) {
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink && activeLink.classList.contains('nav-link')) {
            activeLink.classList.add('active');
        }

        // Загружаем данные для страницы
        switch (pageId) {
            case 'users':
                this.renderUsers();
                break;
            case 'requests':
                this.renderRequests();
                break;
            case 'assignments':
                this.renderAssignments();
                break;
        }
    }

    // Отображение дашборда
    renderDashboard() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const recentRequests = this.requests
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        if (recentRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <h4>Нет активности</h4>
                    <p>Новые заявки появятся здесь</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Заявка</th>
                            <th>Пользователь</th>
                            <th>Статус</th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentRequests.map(req => {
                            const user = this.users.find(u => u.id == req.user_id);
                            return `
                                <tr>
                                    <td><strong>${req.title}</strong></td>
                                    <td>${user ? (user.full_name || user.first_name + ' ' + user.last_name || user.username) : 'Неизвестно'}</td>
                                    <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                    <td>${new Date(req.created_at).toLocaleDateString('ru-RU')}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Отображение пользователей
    renderUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        // Применяем фильтры
        let filteredUsers = [...this.users];
        
        const roleFilter = document.getElementById('userRoleFilter')?.value;
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }

        const statusFilter = document.getElementById('userStatusFilter')?.value;
        if (statusFilter) {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }

        if (filteredUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">👥</div>
                    <h4>Пользователей не найдено</h4>
                    <p>Попробуйте изменить фильтры</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Логин</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Статус</th>
                            <th>Регистрация</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredUsers.map(user => `
                            <tr>
                                <td><strong>${user.full_name || (user.first_name + ' ' + user.last_name) || 'Не указано'}</strong></td>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td><span class="role-badge role-${user.role}">${this.getRoleName(user.role)}</span></td>
                                <td><span class="status-badge status-${user.status}">${this.getStatusName(user.status)}</span></td>
                                <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="adminDashboard.editUser('${user.id}')">
                                        Редактировать
                                    </button>
                                    ${user.role !== 'admin' ? `
                                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.toggleUserStatus('${user.id}')">
                                            ${user.status === 'active' ? 'Заблокировать' : 'Активировать'}
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Отображение заявок
    renderRequests() {
        const container = document.getElementById('requestsContainer');
        if (!container) return;
        
        // Применяем фильтры
        let filteredRequests = [...this.requests];
        
        const statusFilter = document.getElementById('requestStatusFilter')?.value;
        if (statusFilter) {
            filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
        }

        const priorityFilter = document.getElementById('requestPriorityFilter')?.value;
        if (priorityFilter) {
            filteredRequests = filteredRequests.filter(req => req.priority === priorityFilter);
        }

        const assignmentFilter = document.getElementById('requestAssignmentFilter')?.value;
        if (assignmentFilter === 'unassigned') {
            filteredRequests = filteredRequests.filter(req => !req.assigned_manager_id);
        } else if (assignmentFilter === 'assigned') {
            filteredRequests = filteredRequests.filter(req => req.assigned_manager_id);
        }

        if (filteredRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <h4>Заявок не найдено</h4>
                    <p>Попробуйте изменить фильтры</p>
                </div>
            `;
        } else {
            const sortedRequests = filteredRequests.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Заявка</th>
                            <th>Пользователь</th>
                            <th>Менеджер</th>
                            <th>Приоритет</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRequests.map(req => {
                            const user = this.users.find(u => u.id == req.user_id);
                            const manager = this.users.find(u => u.id == req.assigned_manager_id);
                            return `
                                <tr>
                                    <td><strong>${req.title}</strong></td>
                                    <td>${user ? (user.full_name || user.first_name + ' ' + user.last_name || user.username) : 'Неизвестно'}</td>
                                    <td>${manager ? (manager.full_name || manager.first_name + ' ' + manager.last_name || manager.username) : 'Не назначен'}</td>
                                    <td><span class="role-badge role-${req.priority === 'high' ? 'admin' : req.priority === 'medium' ? 'manager' : 'user'}">${this.getPriorityName(req.priority)}</span></td>
                                    <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                    <td>${new Date(req.created_at).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        ${!req.assigned_manager_id ? `
                                            <button class="btn btn-sm btn-primary" onclick="adminDashboard.openAssignModal('${req.id}')">
                                                Назначить
                                            </button>
                                        ` : `
                                            <button class="btn btn-sm btn-secondary" onclick="adminDashboard.openAssignModal('${req.id}')">
                                                Переназначить
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Отображение назначений
    renderAssignments() {
        const container = document.getElementById('assignmentsContainer');
        if (!container) return;
        
        // Группируем заявки по менеджерам
        const assignmentData = this.managers.map(manager => {
            const assignedRequests = this.requests.filter(req => req.assigned_manager_id == manager.id);
            return {
                manager,
                total: assignedRequests.length,
                pending: assignedRequests.filter(req => ['new', 'pending'].includes(req.status)).length,
                completed: assignedRequests.filter(req => req.status === 'completed').length,
                requests: assignedRequests
            };
        });

        const unassignedRequests = this.requests.filter(req => !req.assigned_manager_id);

        container.innerHTML = `
            ${unassignedRequests.length > 0 ? `
                <div style="background: var(--warning-color); color: var(--white); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 2rem;">
                    <h4>⚠️ Неназначенных заявок: ${unassignedRequests.length}</h4>
                    <p>Требуется назначение менеджера</p>
                </div>
            ` : ''}
            
            <div class="stats-grid">
                ${assignmentData.map(data => `
                    <div class="stat-card">
                        <h3>${data.manager.full_name || data.manager.first_name + ' ' + data.manager.last_name || data.manager.username}</h3>
                        <div class="stat-number">${data.total}</div>
                        <p>Всего заявок</p>
                        <div class="assignment-details">
                            <small>В работе: ${data.pending} | Завершено: ${data.completed}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Вспомогательные методы
    getRoleName(role) {
        const roleNames = {
            'admin': 'Администратор',
            'manager': 'Менеджер',
            'user': 'Пользователь'
        };
        return roleNames[role] || role;
    }

    getStatusName(status) {
        const statusNames = {
            'active': 'Активный',
            'inactive': 'Неактивный',
            'pending': 'Ожидание',
            'in_progress': 'В работе',
            'completed': 'Завершено',
            'cancelled': 'Отменено'
        };
        return statusNames[status] || status;
    }

    getPriorityName(priority) {
        const priorityNames = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'urgent': 'Срочный'
        };
        return priorityNames[priority] || priority;
    }

    // Заглушки для методов, которые могут вызываться из HTML
    editUser(userId) {
        console.log('Edit user:', userId);
        // Реализация редактирования пользователя
    }

    toggleUserStatus(userId) {
        console.log('Toggle user status:', userId);
        // Реализация изменения статуса пользователя
    }

    openAssignModal(requestId) {
        console.log('Open assign modal:', requestId);
        // Реализация модального окна назначения
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 AdminDashboard initializing...');
    
    // Ждем загрузки AuthManager
    if (typeof AuthManager !== 'undefined') {
        console.log('✅ AuthManager ready, starting AdminDashboard');
        window.adminDashboard = new AdminDashboard();
    } else {
        console.log('⏳ Waiting for AuthManager...');
        const checkAuth = setInterval(() => {
            if (typeof AuthManager !== 'undefined') {
                console.log('✅ AuthManager ready, starting AdminDashboard');
                clearInterval(checkAuth);
                window.adminDashboard = new AdminDashboard();
            }
        }, 100);
    }
});
