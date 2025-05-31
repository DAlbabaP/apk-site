// Скрипты из dashboard-admin.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
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

            init() {
                this.checkAuth();
                this.loadData();
                this.updateStats();
                this.initNavigation();
                this.initFilters();
                this.renderDashboard();
            }

            // Проверка авторизации
            checkAuth() {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    
                    if (!session || new Date(session.expiresAt) <= new Date()) {
                        window.location.href = 'login.html';
                        return;
                    }

                    if (session.role !== 'admin') {
                        const dashboards = {
                            'user': 'dashboard-user.html',
                            'manager': 'dashboard-manager.html'
                        };
                        if (dashboards[session.role]) {
                            window.location.href = dashboards[session.role];
                        }
                        return;
                    }

                    this.currentUser = session;
                    
                    // Обновляем информацию в шапке
                    document.getElementById('userName').textContent = session.fullName || 'Администратор';
                    document.getElementById('userRole').textContent = 'Администратор';
                    document.getElementById('userAvatar').textContent = (session.fullName || 'А').charAt(0).toUpperCase();
                } catch (error) {
                    window.location.href = 'login.html';
                }
            }

            // Загрузка данных
            loadData() {
                try {
                    this.users = JSON.parse(localStorage.getItem('users') || '[]');
                    this.requests = JSON.parse(localStorage.getItem('requests') || '[]');
                    this.managers = this.users.filter(user => user.role === 'manager');
                } catch (error) {
                    this.users = [];
                    this.requests = [];
                    this.managers = [];
                }
            }

            // Обновление статистики
            updateStats() {
                const totalUsers = this.users.length;
                const totalRequests = this.requests.length;
                const pendingRequests = this.requests.filter(req => 
                    ['new', 'in_progress'].includes(req.status)
                ).length;
                const completedRequests = this.requests.filter(req => 
                    req.status === 'completed'
                ).length;

                document.getElementById('totalUsers').textContent = totalUsers;
                document.getElementById('totalRequests').textContent = totalRequests;
                document.getElementById('pendingRequests').textContent = pendingRequests;
                document.getElementById('completedRequests').textContent = completedRequests;
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
                    document.getElementById(filterId).addEventListener('change', () => {
                        this.renderUsers();
                    });
                });

                // Фильтры заявок
                ['requestStatusFilter', 'requestPriorityFilter', 'requestAssignmentFilter'].forEach(filterId => {
                    document.getElementById(filterId).addEventListener('change', () => {
                        this.renderRequests();
                    });
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
                const recentRequests = this.requests
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
                                    const user = this.users.find(u => u.id === req.userId);
                                    return `
                                        <tr>
                                            <td><strong>${req.title}</strong></td>
                                            <td>${user ? user.fullName : 'Неизвестно'}</td>
                                            <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                            <td>${new Date(req.createdAt).toLocaleDateString('ru-RU')}</td>
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
                
                // Применяем фильтры
                let filteredUsers = [...this.users];
                
                const roleFilter = document.getElementById('userRoleFilter').value;
                if (roleFilter) {
                    filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
                }

                const statusFilter = document.getElementById('userStatusFilter').value;
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
                                        <td><strong>${user.fullName}</strong></td>
                                        <td>${user.login}</td>
                                        <td>${user.email}</td>
                                        <td><span class="role-badge role-${user.role}">${this.getRoleName(user.role)}</span></td>
                                        <td><span class="status-badge status-${user.status}">${this.getStatusName(user.status)}</span></td>
                                        <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
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
                
                // Применяем фильтры
                let filteredRequests = [...this.requests];
                
                const statusFilter = document.getElementById('requestStatusFilter').value;
                if (statusFilter) {
                    filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
                }

                const priorityFilter = document.getElementById('requestPriorityFilter').value;
                if (priorityFilter) {
                    filteredRequests = filteredRequests.filter(req => req.priority === priorityFilter);
                }

                const assignmentFilter = document.getElementById('requestAssignmentFilter').value;
                if (assignmentFilter === 'unassigned') {
                    filteredRequests = filteredRequests.filter(req => !req.managerId);
                } else if (assignmentFilter === 'assigned') {
                    filteredRequests = filteredRequests.filter(req => req.managerId);
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
                        new Date(b.createdAt) - new Date(a.createdAt)
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
                                    const user = this.users.find(u => u.id === req.userId);
                                    const manager = this.users.find(u => u.id === req.managerId);
                                    return `
                                        <tr>
                                            <td><strong>${req.title}</strong></td>
                                            <td>${user ? user.fullName : 'Неизвестно'}</td>
                                            <td>${manager ? manager.fullName : 'Не назначен'}</td>
                                            <td><span class="role-badge role-${req.priority === 'high' ? 'admin' : req.priority === 'medium' ? 'manager' : 'user'}">${this.getPriorityName(req.priority)}</span></td>
                                            <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                            <td>${new Date(req.createdAt).toLocaleDateString('ru-RU')}</td>
                                            <td>
                                                ${!req.managerId ? `
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
                
                // Группируем заявки по менеджерам
                const assignmentData = this.managers.map(manager => {
                    const assignedRequests = this.requests.filter(req => req.managerId === manager.id);
                    return {
                        manager,
                        total: assignedRequests.length,
                        pending: assignedRequests.filter(req => ['new', 'in_progress'].includes(req.status)).length,
                        completed: assignedRequests.filter(req => req.status === 'completed').length,
                        requests: assignedRequests
                    };
                });

                const unassignedRequests = this.requests.filter(req => !req.managerId);

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
                                <h4>${data.manager.fullName}</h4>
                                <div class="stat-number">${data.total}</div>
                                <div class="stat-label">Всего заявок</div>
                                <div style="margin-top: 1rem; font-size: 0.9rem;">
                                    <div>В работе: ${data.pending}</div>
                                    <div>Выполнено: ${data.completed}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <h3>Детали назначений</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Менеджер</th>
                                <th>Всего заявок</th>
                                <th>В работе</th>
                                <th>Выполнено</th>
                                <th>Эффективность</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignmentData.map(data => {
                                const efficiency = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                                return `
                                    <tr>
                                        <td><strong>${data.manager.fullName}</strong></td>
                                        <td>${data.total}</td>
                                        <td>${data.pending}</td>
                                        <td>${data.completed}</td>
                                        <td>${efficiency}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }

            // Открытие модального окна пользователя
            openUserModal(userId = null) {
                this.currentEditUser = userId;
                const modal = document.getElementById('userModal');
                const title = document.getElementById('userModalTitle');
                
                if (userId) {
                    const user = this.users.find(u => u.id === userId);
                    if (user) {
                        title.textContent = 'Редактировать пользователя';
                        document.getElementById('userFullName').value = user.fullName;
                        document.getElementById('userLogin').value = user.login;
                        document.getElementById('userEmail').value = user.email;
                        document.getElementById('userPhone').value = user.phone;
                        document.getElementById('userRole').value = user.role;
                        document.getElementById('userStatus').value = user.status;
                        document.getElementById('userLogin').disabled = true;
                    }
                } else {
                    title.textContent = 'Добавить пользователя';
                    document.getElementById('userForm').reset();
                    document.getElementById('userLogin').disabled = false;
                }

                modal.classList.add('show');
            }

            // Закрытие модального окна пользователя
            closeUserModal() {
                document.getElementById('userModal').classList.remove('show');
                this.currentEditUser = null;
            }

            // Сохранение пользователя
            saveUser() {
                const form = document.getElementById('userForm');
                const formData = new FormData(form);
                
                const userData = {
                    fullName: formData.get('userFullName'),
                    login: formData.get('userLogin'),
                    email: formData.get('userEmail'),
                    phone: formData.get('userPhone'),
                    role: formData.get('userRole'),
                    status: formData.get('userStatus')
                };

                try {
                    if (this.currentEditUser) {
                        // Редактирование
                        const userIndex = this.users.findIndex(u => u.id === this.currentEditUser);
                        if (userIndex !== -1) {
                            this.users[userIndex] = { 
                                ...this.users[userIndex], 
                                ...userData, 
                                updatedAt: new Date().toISOString() 
                            };
                        }
                    } else {
                        // Добавление
                        const newUser = {
                            id: this.generateId(),
                            ...userData,
                            password: this.hashPassword('password'), // Пароль по умолчанию
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        this.users.push(newUser);
                    }

                    localStorage.setItem('users', JSON.stringify(this.users));
                    this.loadData();
                    this.updateStats();
                    this.renderUsers();
                    this.closeUserModal();
                    this.showNotification('Пользователь успешно сохранен', 'success');

                } catch (error) {
                    this.showNotification('Ошибка при сохранении пользователя', 'error');
                }
            }

            // Редактирование пользователя
            editUser(userId) {
                this.openUserModal(userId);
            }

            // Переключение статуса пользователя
            toggleUserStatus(userId) {
                try {
                    const userIndex = this.users.findIndex(u => u.id === userId);
                    if (userIndex !== -1) {
                        this.users[userIndex].status = this.users[userIndex].status === 'active' ? 'inactive' : 'active';
                        this.users[userIndex].updatedAt = new Date().toISOString();
                        
                        localStorage.setItem('users', JSON.stringify(this.users));
                        this.loadData();
                        this.renderUsers();
                        this.showNotification('Статус пользователя изменен', 'success');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при изменении статуса', 'error');
                }
            }

            // Открытие модального окна назначения
            openAssignModal(requestId) {
                this.currentAssignRequest = requestId;
                const request = this.requests.find(req => req.id === requestId);
                if (!request) return;

                const user = this.users.find(u => u.id === request.userId);
                const modal = document.getElementById('assignModal');
                
                document.getElementById('assignRequestDetails').innerHTML = `
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--background-color); border-radius: var(--border-radius);">
                        <h4>${request.title}</h4>
                        <p><strong>Заявитель:</strong> ${user ? user.fullName : 'Неизвестно'}</p>
                        <p><strong>Приоритет:</strong> ${this.getPriorityName(request.priority)}</p>
                        <p><strong>Дата создания:</strong> ${new Date(request.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                `;

                // Заполняем список менеджеров
                const select = document.getElementById('assignManager');
                select.innerHTML = '<option value="">Выберите менеджера</option>' + 
                    this.managers.map(manager => 
                        `<option value="${manager.id}" ${request.managerId === manager.id ? 'selected' : ''}>
                            ${manager.fullName}
                        </option>`
                    ).join('');

                modal.classList.add('show');
            }

            // Закрытие модального окна назначения
            closeAssignModal() {
                document.getElementById('assignModal').classList.remove('show');
                this.currentAssignRequest = null;
            }

            // Назначение заявки
            assignRequest() {
                const managerId = document.getElementById('assignManager').value;
                if (!managerId) {
                    this.showNotification('Выберите менеджера', 'error');
                    return;
                }

                try {
                    const requestIndex = this.requests.findIndex(req => req.id === this.currentAssignRequest);
                    if (requestIndex !== -1) {
                        this.requests[requestIndex].managerId = managerId;
                        this.requests[requestIndex].updatedAt = new Date().toISOString();
                        
                        localStorage.setItem('requests', JSON.stringify(this.requests));
                        this.loadData();
                        this.renderRequests();
                        this.renderAssignments();
                        this.closeAssignModal();
                        this.showNotification('Заявка успешно назначена', 'success');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при назначении заявки', 'error');
                }
            }

            // Экспорт пользователей
            exportUsers() {
                const data = this.users.map(user => ({
                    ФИО: user.fullName,
                    Логин: user.login,
                    Email: user.email,
                    Телефон: user.phone,
                    Роль: this.getRoleName(user.role),
                    Статус: this.getStatusName(user.status),
                    Регистрация: new Date(user.createdAt).toLocaleDateString('ru-RU')
                }));

                this.downloadCSV(data, 'users.csv');
                this.showNotification('Список пользователей экспортирован', 'success');
            }

            // Экспорт данных системы
            exportSystemData() {
                const data = {
                    users: this.users,
                    requests: this.requests,
                    exportDate: new Date().toISOString()
                };

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'system-data.json';
                a.click();
                URL.revokeObjectURL(url);

                this.showNotification('Данные системы экспортированы', 'success');
            }

            // Очистка всех данных
            clearAllData() {
                if (confirm('Вы действительно хотите удалить ВСЕ данные системы? Это действие нельзя отменить!')) {
                    localStorage.removeItem('users');
                    localStorage.removeItem('requests');
                    localStorage.removeItem('currentSession');
                    sessionStorage.clear();
                    
                    this.showNotification('Все данные очищены. Перенаправление...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            }

            // Скачивание CSV
            downloadCSV(data, filename) {
                if (data.length === 0) return;

                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(','),
                    ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }

            // Утилиты
            generateId() {
                return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            hashPassword(password) {
                let hash = 0;
                for (let i = 0; i < password.length; i++) {
                    const char = password.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return 'hashed_' + Math.abs(hash).toString(36);
            }

            getRoleName(role) {
                const roles = {
                    'admin': 'Администратор',
                    'manager': 'Менеджер',
                    'user': 'Пользователь'
                };
                return roles[role] || role;
            }

            getPriorityName(priority) {
                const priorities = {
                    'low': 'Низкий',
                    'medium': 'Средний',
                    'high': 'Высокий'
                };
                return priorities[priority] || priority;
            }

            getStatusName(status) {
                const statuses = {
                    'active': 'Активный',
                    'inactive': 'Неактивный',
                    'new': 'Новая',
                    'in_progress': 'В работе',
                    'completed': 'Выполнена',
                    'rejected': 'Отклонена'
                };
                return statuses[status] || status;
            }

            showNotification(message, type = 'success') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.textContent = message;
                notification.style.position = 'fixed';
                notification.style.top = '2rem';
                notification.style.right = '2rem';
                notification.style.padding = '1rem 1.5rem';
                notification.style.borderRadius = 'var(--border-radius)';
                notification.style.color = 'var(--white)';
                notification.style.fontWeight = '500';
                notification.style.boxShadow = 'var(--shadow)';
                notification.style.zIndex = '1000';
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                notification.style.transition = 'all 0.3s ease';
                notification.style.background = type === 'success' ? 'var(--success-color)' : 'var(--error-color)';

                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.opacity = '1';
                    notification.style.transform = 'translateX(0)';
                }, 100);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (document.body.contains(notification)) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }, 4000);
            }
        }

        // Глобальные функции
        function logout() {
            localStorage.removeItem('currentSession');
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        }

        function openUserModal(userId = null) {
            adminDashboard.openUserModal(userId);
        }

        function closeUserModal() {
            adminDashboard.closeUserModal();
        }

        function saveUser() {
            adminDashboard.saveUser();
        }

        function closeAssignModal() {
            adminDashboard.closeAssignModal();
        }

        function assignRequest() {
            adminDashboard.assignRequest();
        }

        function exportUsers() {
            adminDashboard.exportUsers();
        }

        function exportSystemData() {
            adminDashboard.exportSystemData();
        }

        function clearAllData() {
            adminDashboard.clearAllData();
        }

        // Инициализация
        let adminDashboard;
        document.addEventListener('DOMContentLoaded', () => {
            adminDashboard = new AdminDashboard();
        });
