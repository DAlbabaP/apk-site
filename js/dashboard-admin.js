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
                this.loadData().then(() => {
                    this.updateStats();
                    this.initNavigation();
                    this.initFilters();
                    this.renderDashboard();
                });
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
            async loadData() {
                try {
                    // Загружаем пользователей из API
                    await this.loadUsersFromAPI();
                    await this.loadRequestsFromAPI();
                    this.managers = this.users.filter(user => user.role === 'manager');
                } catch (error) {
                    console.error('Ошибка загрузки данных:', error);
                    this.users = [];
                    this.requests = [];
                    this.managers = [];
                }
            }

            // Загрузка заявок из API
            async loadRequestsFromAPI() {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    if (!session || !session.token) {
                        this.requests = [];
                        return;
                    }

                    const response = await fetch('api/requests.php/list', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + session.token,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();
                    if (data.success && data.requests) {
                        this.requests = this.normalizeRequests(data.requests);
                    } else {
                        console.error('Ошибка загрузки заявок:', data.error);
                        this.requests = [];
                    }
                } catch (error) {
                    console.error('Ошибка API заявок:', error);
                    this.requests = [];
                }
            }

            // Загрузка пользователей из API
            async loadUsersFromAPI() {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    if (!session || !session.token) {
                        this.users = [];
                        return;
                    }

                    const response = await fetch('api/users.php/list', {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + session.token,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();
                    
                    if (data.success && data.users) {
                        // Приводим поля из API (snake_case) к тем, что использует фронт
                        this.users = data.users.map(user => ({
                            // Приводим id к строке, чтобы совпадать с managerId/userId в заявках
                            id: String(user.id),
                            login: user.login,
                            email: user.email,
                            phone: user.phone,
                            role: user.role,
                            // API отдаёт full_name/created_at, на фронте используется camelCase
                            fullName: user.full_name || user.fullName || user.login || '—',
                            createdAt: this.normalizeDate(user.created_at || user.createdAt) || new Date().toISOString(),
                            // В БД статус "blocked", в интерфейсе — "inactive"
                            status: user.status === 'blocked' ? 'inactive' : (user.status || 'active')
                        }));
                    } else {
                        console.error('Ошибка загрузки пользователей:', data.error);
                        this.users = [];
                    }
                } catch (error) {
                    console.error('Ошибка API:', error);
                    this.users = [];
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
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
                                            <td>${this.formatDate(req.createdAt)}</td>
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
                                        <td><strong>${user.fullName || '—'}</strong></td>
                                        <td>${user.login}</td>
                                        <td>${user.email}</td>
                                        <td><span class="role-badge role-${user.role}">${this.getRoleName(user.role)}</span></td>
                                        <td><span class="status-badge status-${user.status}">${this.getStatusName(user.status)}</span></td>
                                        <td>${this.formatDate(user.createdAt)}</td>
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
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
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
                                            <td><strong>${req.title || '—'}</strong></td>
                                            <td>${user ? user.fullName : 'Неизвестно'}</td>
                                            <td>${manager ? manager.fullName : 'Не назначен'}</td>
                                            <td><span class="role-badge role-${req.priority === 'high' ? 'admin' : req.priority === 'medium' ? 'manager' : 'user'}">${this.getPriorityName(req.priority)}</span></td>
                                            <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                            <td>${this.formatDate(req.createdAt)}</td>
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
            async saveUser() {
                const form = document.getElementById('userForm');
                const formData = new FormData(form);
                
                const userData = {
                    full_name: formData.get('userFullName'),
                    login: formData.get('userLogin'),
                    email: formData.get('userEmail'),
                    phone: formData.get('userPhone'),
                    role: formData.get('userRole'),
                    status: formData.get('userStatus')
                };

                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    
                    if (this.currentEditUser) {
                        // Редактирование через API
                        const response = await fetch('api/users.php/update', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + session.token,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ id: this.currentEditUser, ...userData })
                        });

                        const data = await response.json();
                        
                        if (!data.success) {
                            this.showNotification(data.error || 'Ошибка при обновлении', 'error');
                            return;
                        }
                    } else {
                        // Добавление нового пользователя через API регистрации
                        const response = await fetch('api/users.php/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                login: userData.login,
                                password: 'password123', // Пароль по умолчанию
                                full_name: userData.full_name,
                                email: userData.email,
                                phone: userData.phone,
                                role: userData.role
                            })
                        });

                        const data = await response.json();
                        
                        if (!data.success) {
                            this.showNotification(data.error || 'Ошибка при создании', 'error');
                            return;
                        }
                    }

                    await this.loadData();
                    this.updateStats();
                    this.renderUsers();
                    this.closeUserModal();
                    this.showNotification('Пользователь успешно сохранен', 'success');

                } catch (error) {
                    console.error('Ошибка:', error);
                    this.showNotification('Ошибка при сохранении пользователя', 'error');
                }
            }

            // Редактирование пользователя
            editUser(userId) {
                this.openUserModal(userId);
            }

            // Переключение статуса пользователя
            async toggleUserStatus(userId) {
                try {
                    const user = this.users.find(u => u.id === userId);
                    if (!user) return;

                    const newStatus = user.status === 'active' ? 'blocked' : 'active';
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');

                    const response = await fetch('api/users.php/update', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + session.token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: userId, status: newStatus })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        await this.loadData();
                        this.renderUsers();
                        this.showNotification('Статус пользователя изменен', 'success');
                    } else {
                        this.showNotification(data.error || 'Ошибка при изменении статуса', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
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

                this.updateRequestOnServer({
                    id: this.currentAssignRequest,
                    managerId: String(managerId),
                    status: 'in_progress'
                }).then(success => {
                    if (success) {
                        this.loadData();
                        this.renderRequests();
                        this.renderAssignments();
                        this.closeAssignModal();
                        this.showNotification('Заявка успешно назначена', 'success');
                    } else {
                        this.showNotification('Ошибка при назначении заявки', 'error');
                    }
                });
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

            // Нормализация дат из БД/API к ISO, чтобы избежать Invalid Date
            normalizeDate(dateValue) {
                if (!dateValue) return null;
                if (typeof dateValue === 'string') {
                    // Заменяем пробел на T для корректного парсинга
                    const normalized = dateValue.replace(' ', 'T');
                    const date = new Date(normalized);
                    return isNaN(date) ? null : date.toISOString();
                }
                const date = new Date(dateValue);
                return isNaN(date) ? null : date.toISOString();
            }

            formatDate(dateValue) {
                const normalized = this.normalizeDate(dateValue);
                if (!normalized) return '—';
                return new Date(normalized).toLocaleDateString('ru-RU');
            }

            // Нормализация заявок из локального хранилища
            normalizeRequests(requests) {
                return (requests || []).map(req => ({
                    id: String(req.id),
                    title: req.title || req.name || req.requestTitle || '—',
                    userId: req.userId ? String(req.userId) : (req.user_id ? String(req.user_id) : null),
                    managerId: req.managerId ? String(req.managerId) : (req.manager_id ? String(req.manager_id) : null),
                    priority: req.priority || req.requestPriority || 'medium',
                    status: req.status || 'new',
                    description: req.description || req.requestDescription || '',
                    category: req.category || req.requestCategory || '',
                    files: req.files || [],
                    comments: req.comments || [],
                    createdAt: this.normalizeDate(req.createdAt || req.created_at) || new Date().toISOString(),
                    updatedAt: this.normalizeDate(req.updatedAt || req.updated_at) || null
                }));
            }

            // Обновление заявки на сервере
            async updateRequestOnServer(payload) {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    if (!session || !session.token) {
                        return false;
                    }

                    const response = await fetch('api/requests.php/update', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + session.token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();
                    return !!data.success;
                } catch (error) {
                    console.error('Ошибка обновления заявки:', error);
                    return false;
                }
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
