// Скрипты из dashboard-user.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система управления дашбордом пользователя
        class UserDashboard {
            constructor() {
                this.currentUser = null;
                this.userRequests = [];
                this.init();
            }

            init() {
                this.checkAuth();
                this.loadUserData();
                this.loadUserRequests();
                this.updateStats();
                this.initNavigation();
                this.initForms();
                this.renderRecentRequests();
            }

            // Проверка авторизации
            checkAuth() {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    
                    if (!session || new Date(session.expiresAt) <= new Date()) {
                        window.location.href = 'login.html';
                        return;
                    }

                    if (session.role !== 'user') {
                        // Перенаправляем на соответствующий дашборд
                        const dashboards = {
                            'manager': 'dashboard-manager.html',
                            'admin': 'dashboard-admin.html'
                        };
                        if (dashboards[session.role]) {
                            window.location.href = dashboards[session.role];
                        }
                        return;
                    }

                    this.currentUser = session;
                } catch (error) {
                    window.location.href = 'login.html';
                }
            }

            // Загрузка данных пользователя
            loadUserData() {
                if (!this.currentUser) return;

                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.id === this.currentUser.userId);
                
                if (user) {
                    // Обновляем информацию в шапке
                    document.getElementById('userName').textContent = user.fullName;
                    document.getElementById('userRole').textContent = 'Пользователь';
                    document.getElementById('userAvatar').textContent = user.fullName.charAt(0).toUpperCase();

                    // Заполняем форму профиля
                    document.getElementById('profileFullName').value = user.fullName;
                    document.getElementById('profileLogin').value = user.login;
                    document.getElementById('profilePhone').value = user.phone;
                    document.getElementById('profileEmail').value = user.email;
                }
            }

            // Загрузка заявок пользователя
            loadUserRequests() {
                try {
                    const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
                    this.userRequests = allRequests.filter(req => req.userId === this.currentUser.userId);
                } catch (error) {
                    this.userRequests = [];
                }
            }

            // Обновление статистики
            updateStats() {
                const total = this.userRequests.length;
                const pending = this.userRequests.filter(req => 
                    ['new', 'in_progress'].includes(req.status)
                ).length;
                const completed = this.userRequests.filter(req => 
                    req.status === 'completed'
                ).length;

                document.getElementById('totalRequests').textContent = total;
                document.getElementById('pendingRequests').textContent = pending;
                document.getElementById('completedRequests').textContent = completed;
            }

            // Инициализация навигации
            initNavigation() {
                document.querySelectorAll('.nav-link, .action-card, [data-page]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const page = link.getAttribute('data-page');
                        if (page) {
                            this.showPage(page);
                        }
                    });
                });
            }

            // Показ страницы
            showPage(pageId) {
                // Скрываем все страницы
                document.querySelectorAll('.page-section').forEach(section => {
                    section.classList.remove('active');
                });

                // Показываем нужную страницу
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.classList.add('active');
                }

                // Обновляем активную ссылку
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });

                const activeLink = document.querySelector(`[data-page="${pageId}"]`);
                if (activeLink && activeLink.classList.contains('nav-link')) {
                    activeLink.classList.add('active');
                }

                // Обновляем контент страницы
                if (pageId === 'requests') {
                    this.renderAllRequests();
                }
            }

            // Инициализация форм
            initForms() {
                // Форма профиля
                document.getElementById('profileForm').addEventListener('submit', (e) => {
                    this.handleProfileUpdate(e);
                });

                // Форма создания заявки
                document.getElementById('createRequestForm').addEventListener('submit', (e) => {
                    this.handleCreateRequest(e);
                });
            }

            // Обработка обновления профиля
            handleProfileUpdate(e) {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const updatedData = {
                    fullName: formData.get('profileFullName'),
                    phone: formData.get('profilePhone'),
                    email: formData.get('profileEmail')
                };

                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.id === this.currentUser.userId);
                    
                    if (userIndex !== -1) {
                        users[userIndex] = { ...users[userIndex], ...updatedData, updatedAt: new Date().toISOString() };
                        localStorage.setItem('users', JSON.stringify(users));
                        
                        // Обновляем сессию
                        this.currentUser.fullName = updatedData.fullName;
                        localStorage.setItem('currentSession', JSON.stringify(this.currentUser));
                        
                        this.loadUserData();
                        this.showNotification('Профиль успешно обновлен', 'success');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при обновлении профиля', 'error');
                }
            }

            // Обработка создания заявки
            handleCreateRequest(e) {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const requestData = {
                    id: this.generateId(),
                    userId: this.currentUser.userId,
                    title: formData.get('requestTitle'),
                    category: formData.get('requestCategory'),
                    priority: formData.get('requestPriority'),
                    description: formData.get('requestDescription'),
                    status: 'new',
                    managerId: null,
                    files: [],
                    comments: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    completedAt: null
                };

                try {
                    const allRequests = JSON.parse(localStorage.getItem('requests') || '[]');
                    allRequests.push(requestData);
                    localStorage.setItem('requests', JSON.stringify(allRequests));
                    
                    this.loadUserRequests();
                    this.updateStats();
                    this.renderRecentRequests();
                    
                    // Очищаем форму
                    e.target.reset();
                    
                    this.showNotification('Заявка успешно создана', 'success');
                    
                    // Переходим на страницу заявок
                    setTimeout(() => {
                        this.showPage('requests');
                    }, 1500);
                    
                } catch (error) {
                    this.showNotification('Ошибка при создании заявки', 'error');
                }
            }

            // Отображение последних заявок
            renderRecentRequests() {
                const container = document.getElementById('recentRequestsContainer');
                const recentRequests = this.userRequests
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);

                if (recentRequests.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <h4>Заявок пока нет</h4>
                            <p>Создайте первую заявку, чтобы начать работу</p>
                            <a href="#" class="btn btn-primary" data-page="create-request">Создать заявку</a>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <table class="requests-table">
                            <thead>
                                <tr>
                                    <th>Заголовок</th>
                                    <th>Категория</th>
                                    <th>Приоритет</th>
                                    <th>Статус</th>
                                    <th>Дата создания</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentRequests.map(req => `
                                    <tr>
                                        <td>${req.title}</td>
                                        <td>${this.getCategoryName(req.category)}</td>
                                        <td>${this.getPriorityName(req.priority)}</td>
                                        <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                        <td>${new Date(req.createdAt).toLocaleDateString('ru-RU')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="text-align: center; margin-top: 1rem;">
                            <a href="#" class="btn btn-secondary" data-page="requests">Показать все заявки</a>
                        </div>
                    `;
                }

                // Переинициализируем обработчики для новых ссылок
                container.querySelectorAll('[data-page]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showPage(link.getAttribute('data-page'));
                    });
                });
            }

            // Отображение всех заявок
            renderAllRequests() {
                const container = document.getElementById('requestsContainer');
                
                if (this.userRequests.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <h4>У вас пока нет заявок</h4>
                            <p>Создайте первую заявку для начала работы</p>
                            <a href="#" class="btn btn-primary" data-page="create-request">Создать заявку</a>
                        </div>
                    `;
                } else {
                    const sortedRequests = this.userRequests.sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );

                    container.innerHTML = `
                        <table class="requests-table">
                            <thead>
                                <tr>
                                    <th>Заголовок</th>
                                    <th>Категория</th>
                                    <th>Приоритет</th>
                                    <th>Статус</th>
                                    <th>Дата создания</th>
                                    <th>Описание</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedRequests.map(req => `
                                    <tr>
                                        <td><strong>${req.title}</strong></td>
                                        <td>${this.getCategoryName(req.category)}</td>
                                        <td>${this.getPriorityName(req.priority)}</td>
                                        <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                        <td>${new Date(req.createdAt).toLocaleDateString('ru-RU')}</td>
                                        <td>${req.description.length > 100 ? req.description.substring(0, 100) + '...' : req.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }

                // Переинициализируем обработчики
                container.querySelectorAll('[data-page]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showPage(link.getAttribute('data-page'));
                    });
                });
            }

            // Утилиты
            generateId() {
                return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            getCategoryName(category) {
                const categories = {
                    'maintenance': 'Техобслуживание',
                    'repair': 'Ремонт',
                    'supply': 'Поставка',
                    'consultation': 'Консультация',
                    'other': 'Другое'
                };
                return categories[category] || category;
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
                    'new': 'Новая',
                    'in_progress': 'В работе',
                    'completed': 'Выполнена',
                    'rejected': 'Отклонена'
                };
                return statuses[status] || status;
            }

            showNotification(message, type = 'success') {
                // Создаем уведомление
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

                // Показываем
                setTimeout(() => {
                    notification.style.opacity = '1';
                    notification.style.transform = 'translateX(0)';
                }, 100);

                // Скрываем
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 4000);
            }
        }

        // Функция выхода
        function logout() {
            localStorage.removeItem('currentSession');
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        }

        // Инициализация
        document.addEventListener('DOMContentLoaded', () => {
            new UserDashboard();
        });
