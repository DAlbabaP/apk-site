// Скрипты из dashboard-manager.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система управления дашбордом менеджера
        class ManagerDashboard {
            constructor() {
                this.currentUser = null;
                this.currentUserId = null; // храним как строку для сопоставления
                this.users = [];
                this.requestsFromServer = [];
                this.assignedRequests = [];
                this.currentRequest = null;
                this.uploadedFiles = [];
                this.existingFiles = []; // Существующие файлы из заявки
                this.init();
            }

            init() {
                this.checkAuth();
                // Загружаем пользователей из API, потом остальные данные
                this.loadUsersFromAPI().finally(() => {
                    this.loadUserData();
                    this.loadAssignedRequests();
                    this.updateStats();
                    this.initNavigation();
                    this.initForms();
                    this.initFileUpload();
                    this.renderRecentRequests();
                    this.initFilters();
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

                    if (session.role !== 'manager') {
                        const dashboards = {
                            'user': 'dashboard-user.html',
                            'admin': 'dashboard-admin.html'
                        };
                        if (dashboards[session.role]) {
                            window.location.href = dashboards[session.role];
                        }
                        return;
                    }

                    this.currentUser = session;
                    this.currentUserId = String(session.userId);
                } catch (error) {
                    window.location.href = 'login.html';
                }
            }

            // Загрузка данных пользователя
            loadUserData() {
                if (!this.currentUser) return;

                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => String(u.id) === this.currentUserId);
                
                const fullName = (user && user.fullName) || this.currentUser.fullName || 'Менеджер';
                const login = (user && user.login) || this.currentUser.login || '';
                const phone = (user && user.phone) || this.currentUser.phone || '';
                const email = (user && user.email) || this.currentUser.email || '';

                // Обновляем информацию в шапке
                document.getElementById('userName').textContent = fullName;
                document.getElementById('userRole').textContent = 'Менеджер';
                document.getElementById('userAvatar').textContent = fullName.charAt(0).toUpperCase();

                // Заполняем форму профиля
                document.getElementById('profileFullName').value = fullName;
                document.getElementById('profileLogin').value = login;
                document.getElementById('profilePhone').value = phone;
                document.getElementById('profileEmail').value = email;
                
                if (user && user.additionalFields) {
                    document.getElementById('profileDepartment').value = user.additionalFields.department || '';
                    document.getElementById('profilePosition').value = user.additionalFields.position || '';
                    document.getElementById('profilePositionCode').value = user.additionalFields.positionCode || '';
                }
            }

            // Загрузка назначенных заявок
            loadAssignedRequests() {
                try {
                    // Загружаем с сервера
                    // (для менеджера API вернет назначенные на него + новые)
                    this.loadRequestsFromAPI().then(() => {
                        // Приводим ID к строкам для корректного сравнения
                        const currentUserIdStr = String(this.currentUserId);
                        this.assignedRequests = this.requestsFromServer.filter(req => 
                            String(req.managerId) === currentUserIdStr || req.status === 'new'
                        );
                        this.renderRecentRequests();
                        this.renderAllRequests();
                        this.updateStats();
                    });
                } catch (error) {
                    console.error('Ошибка загрузки заявок:', error);
                    this.assignedRequests = [];
                }
            }

            // Обновление статистики
            updateStats() {
                const total = this.assignedRequests.length;
                const pending = this.assignedRequests.filter(req => 
                    ['new', 'in_progress'].includes(req.status)
                ).length;
                const completed = this.assignedRequests.filter(req => 
                    req.status === 'completed'
                ).length;
                const urgent = this.assignedRequests.filter(req => 
                    req.priority === 'high' && req.status !== 'completed'
                ).length;

                document.getElementById('totalAssignedRequests').textContent = total;
                document.getElementById('pendingRequests').textContent = pending;
                document.getElementById('completedRequests').textContent = completed;
                document.getElementById('urgentRequests').textContent = urgent;
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

                if (pageId === 'requests') {
                    this.renderAllRequests();
                }
            }

            // Инициализация форм
            initForms() {
                document.getElementById('profileForm').addEventListener('submit', (e) => {
                    this.handleProfileUpdate(e);
                });

                document.getElementById('requestStatus').addEventListener('change', (e) => {
                    const fileUploadGroup = document.getElementById('fileUploadGroup');
                    if (e.target.value === 'completed') {
                        fileUploadGroup.style.display = 'block';
                    } else {
                        fileUploadGroup.style.display = 'none';
                    }
                });
            }

            // Инициализация загрузки файлов
            initFileUpload() {
                const fileUpload = document.getElementById('fileUpload');
                const fileInput = document.getElementById('fileInput');

                fileUpload.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

                // Drag & Drop
                fileUpload.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    fileUpload.classList.add('dragover');
                });

                fileUpload.addEventListener('dragleave', () => {
                    fileUpload.classList.remove('dragover');
                });

                fileUpload.addEventListener('drop', (e) => {
                    e.preventDefault();
                    fileUpload.classList.remove('dragover');
                    this.handleFileSelect(e.dataTransfer.files);
                });
            }

            // Инициализация фильтров
            initFilters() {
                ['statusFilter', 'priorityFilter', 'dateFilter'].forEach(filterId => {
                    document.getElementById(filterId).addEventListener('change', () => {
                        this.renderAllRequests();
                    });
                });
            }

            // Обработка файлов
            handleFileSelect(files) {
                Array.from(files).forEach(file => {
                    if (file.size > 10 * 1024 * 1024) { // 10MB limit
                        this.showNotification('Файл слишком большой (максимум 10MB)', 'error');
                        return;
                    }

                    this.uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data: file
                    });
                });

                this.renderUploadedFiles();
            }

            // Отображение загруженных файлов
            renderUploadedFiles() {
                const container = document.getElementById('uploadedFiles');
                container.innerHTML = this.uploadedFiles.map((file, index) => `
                    <div class="file-item">
                        <span>${file.name} (${this.formatFileSize(file.size)})</span>
                        <button class="file-remove" onclick="managerDashboard.removeFile(${index})">×</button>
                    </div>
                `).join('');
            }

            // Удаление файла
            removeFile(index) {
                this.uploadedFiles.splice(index, 1);
                this.renderUploadedFiles();
            }

            // Форматирование размера файла
            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            // Обработка обновления профиля
            handleProfileUpdate(e) {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const updatedData = {
                    fullName: formData.get('profileFullName'),
                    phone: formData.get('profilePhone'),
                    email: formData.get('profileEmail'),
                    additionalFields: {
                        department: formData.get('profileDepartment'),
                        position: formData.get('profilePosition'),
                        positionCode: formData.get('profilePositionCode')
                    }
                };

                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.id === this.currentUser.userId);
                    
                    if (userIndex !== -1) {
                        users[userIndex] = { ...users[userIndex], ...updatedData, updatedAt: new Date().toISOString() };
                        localStorage.setItem('users', JSON.stringify(users));
                        
                        this.currentUser.fullName = updatedData.fullName;
                        localStorage.setItem('currentSession', JSON.stringify(this.currentUser));
                        
                        this.loadUserData();
                        this.showNotification('Профиль успешно обновлен', 'success');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при обновлении профиля', 'error');
                }
            }

            // Отображение последних заявок
            renderRecentRequests() {
                const container = document.getElementById('recentRequestsContainer');
                const recentRequests = this.assignedRequests
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5);

                if (recentRequests.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <h4>Заявок пока нет</h4>
                            <p>Новые заявки появятся здесь</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <table class="requests-table">
                            <thead>
                                <tr>
                                    <th>Заголовок</th>
                                    <th>Приоритет</th>
                                    <th>Статус</th>
                                    <th>Дата</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentRequests.map(req => `
                                    <tr>
                                        <td><strong>${req.title}</strong></td>
                                        <td><span class="priority-badge priority-${req.priority}">${this.getPriorityName(req.priority)}</span></td>
                                        <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                        <td>${new Date(req.createdAt).toLocaleDateString('ru-RU')}</td>
                                        <td>
                                            <button class="btn btn-primary btn-sm" onclick="managerDashboard.openRequestModal('${req.id}')">
                                                Обработать
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }
            }

            // Отображение всех заявок с фильтрацией
            renderAllRequests() {
                const container = document.getElementById('requestsContainer');
                
                // Применяем фильтры
                let filteredRequests = [...this.assignedRequests];
                
                const statusFilter = document.getElementById('statusFilter').value;
                if (statusFilter) {
                    filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
                }

                const priorityFilter = document.getElementById('priorityFilter').value;
                if (priorityFilter) {
                    filteredRequests = filteredRequests.filter(req => req.priority === priorityFilter);
                }

                const dateFilter = document.getElementById('dateFilter').value;
                if (dateFilter) {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    filteredRequests = filteredRequests.filter(req => {
                        const reqDate = new Date(req.createdAt);
                        switch (dateFilter) {
                            case 'today':
                                return reqDate >= today;
                            case 'week':
                                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                return reqDate >= weekAgo;
                            case 'month':
                                const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                                return reqDate >= monthAgo;
                            default:
                                return true;
                        }
                    });
                }

                if (filteredRequests.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <h4>Нет заявок по выбранным фильтрам</h4>
                            <p>Попробуйте изменить критерии поиска</p>
                        </div>
                    `;
                } else {
                    const sortedRequests = filteredRequests.sort((a, b) => {
                        // Сортировка: сначала новые и в работе, потом по приоритету, потом по дате
                        const statusOrder = { 'new': 0, 'in_progress': 1, 'completed': 2, 'rejected': 3 };
                        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                        
                        if (statusOrder[a.status] !== statusOrder[b.status]) {
                            return statusOrder[a.status] - statusOrder[b.status];
                        }
                        
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                        }
                        
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    });

                    container.innerHTML = `
                        <table class="requests-table">
                            <thead>
                                <tr>
                                    <th>Заголовок</th>
                                    <th>Категория</th>
                                    <th>Приоритет</th>
                                    <th>Статус</th>
                                    <th>Дата создания</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedRequests.map(req => `
                                    <tr>
                                        <td><strong>${req.title}</strong></td>
                                        <td>${this.getCategoryName(req.category)}</td>
                                        <td><span class="priority-badge priority-${req.priority}">${this.getPriorityName(req.priority)}</span></td>
                                        <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                        <td>${this.formatDate(req.createdAt)}</td>
                                        <td>
                                            <div class="btn-group">
                                                <button class="btn btn-primary btn-sm" onclick="managerDashboard.openRequestModal('${req.id}')">
                                                    Обработать
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                }
            }

            // Открытие модального окна заявки
            openRequestModal(requestId) {
                // Приводим requestId к строке для корректного сравнения
                const requestIdStr = String(requestId);
                const request = this.assignedRequests.find(req => String(req.id) === requestIdStr);
                
                if (!request) {
                    console.error('Заявка не найдена:', requestIdStr, 'Доступные заявки:', this.assignedRequests.map(r => r.id));
                    this.showNotification('Заявка не найдена', 'error');
                    return;
                }

                this.currentRequest = request;
                this.uploadedFiles = [];

                // Если заявка новая и менеджер еще не назначен, автоматически назначаем текущего менеджера
                if (request.status === 'new' && (!request.managerId || request.managerId === null || request.managerId === 'null')) {
                    this.updateRequestOnServer({
                        id: request.id,
                        managerId: this.currentUserId,
                        status: 'in_progress'
                    }).then(success => {
                        if (success) {
                            request.managerId = this.currentUserId;
                            request.status = 'in_progress';
                            this.showNotification('Заявка назначена на вас', 'success');
                        } else {
                            console.error('Не удалось назначить менеджера на заявку');
                        }
                    }).catch(error => {
                        console.error('Ошибка при назначении менеджера:', error);
                    });
                }

                // Заполняем детали заявки
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = this.users.find(u => String(u.id) === String(request.userId)) || users.find(u => String(u.id) === String(request.userId));
                
                document.getElementById('requestDetails').innerHTML = `
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--background-color); border-radius: var(--border-radius);">
                        <h4>${request.title}</h4>
                        <p><strong>Категория:</strong> ${this.getCategoryName(request.category)}</p>
                        <p><strong>Приоритет:</strong> ${this.getPriorityName(request.priority)}</p>
                        <p><strong>Заявитель:</strong> ${user ? user.fullName : 'Неизвестно'}</p>
                        <p><strong>Дата создания:</strong> ${this.formatDate(request.createdAt)}</p>
                        <p><strong>Описание:</strong></p>
                        <p style="white-space: pre-wrap;">${request.description || '—'}</p>
                    </div>
                `;

                // Устанавливаем текущий статус
                document.getElementById('requestStatus').value = request.status || 'new';

                // Показываем/скрываем загрузку файлов
                const fileUploadGroup = document.getElementById('fileUploadGroup');
                fileUploadGroup.style.display = request.status === 'completed' ? 'block' : 'none';

                // Загружаем существующие файлы
                this.loadExistingFiles(request);

                // Загружаем комментарии
                this.renderComments();

                // Показываем модальное окно
                document.getElementById('requestModal').classList.add('show');
            }

            // Отображение комментариев
            renderComments() {
                const container = document.getElementById('commentsSection');
                
                // Проверяем, что currentRequest существует
                if (!this.currentRequest) {
                    container.innerHTML = '<p style="color: var(--gray-medium); text-align: center;">Нет комментариев</p>';
                    return;
                }
                
                // Парсим комментарии, если они в виде JSON строки
                let comments = this.currentRequest.comments;
                
                // Обрабатываем разные форматы комментариев
                if (comments === null || comments === undefined) {
                    comments = [];
                } else if (typeof comments === 'string') {
                    // Если это пустая строка или "[]", делаем пустой массив
                    if (comments.trim() === '' || comments.trim() === '[]') {
                        comments = [];
                    } else {
                        try {
                            comments = JSON.parse(comments);
                        } catch (e) {
                            console.warn('Ошибка парсинга комментариев:', e, comments);
                            comments = [];
                        }
                    }
                }
                
                // Убеждаемся, что это массив
                if (!Array.isArray(comments)) {
                    console.warn('Комментарии не являются массивом:', typeof comments, comments);
                    comments = [];
                }
                
                // Объединяем все источники пользователей
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const allUsers = [...this.users, ...localUsers];
                
                // Убираем дубликаты по ID
                const uniqueUsers = [];
                const seenIds = new Set();
                allUsers.forEach(user => {
                    const userId = String(user.id);
                    if (!seenIds.has(userId)) {
                        seenIds.add(userId);
                        uniqueUsers.push(user);
                    }
                });

                if (comments.length === 0) {
                    container.innerHTML = '<p style="color: var(--gray-medium); text-align: center;">Нет комментариев</p>';
                } else {
                    container.innerHTML = comments.map(comment => {
                        // Проверяем, что comment является объектом
                        if (!comment || typeof comment !== 'object') {
                            return '';
                        }
                        
                        const userId = String(comment.userId || comment.user_id || '');
                        const userLogin = comment.login || comment.userLogin || '';
                        const commentFullName = comment.fullName || comment.full_name || '';
                        
                        // Ищем пользователя по ID (с учетом разных форматов)
                        let user = uniqueUsers.find(u => {
                            const uId = String(u.id);
                            return uId === userId || uId === String(parseInt(userId)) || String(parseInt(uId)) === userId;
                        });
                        
                        // Если не нашли по ID, ищем по логину
                        if (!user && userLogin) {
                            user = uniqueUsers.find(u => String(u.login) === String(userLogin));
                        }
                        
                        // Если все еще не нашли, проверяем текущего пользователя
                        if (!user && userId === String(this.currentUserId)) {
                            user = {
                                id: this.currentUserId,
                                fullName: this.currentUser?.fullName || 'Текущий пользователь',
                                login: this.currentUser?.login || ''
                            };
                        }
                        
                        // Если пользователь не найден, используем полное имя из комментария, логин или "Неизвестно"
                        const authorName = user ? user.fullName : (commentFullName || userLogin || 'Неизвестно');
                        
                        // Отладочная информация (можно убрать в продакшене)
                        if (!user && userId) {
                            console.debug('Пользователь не найден для комментария:', {
                                userId,
                                userLogin,
                                commentFullName,
                                availableUsers: uniqueUsers.map(u => ({ id: u.id, login: u.login, fullName: u.fullName }))
                            });
                        }
                        const message = comment.message || comment.text || comment.comment || '—';
                        const createdAt = comment.createdAt || comment.created_at || comment.date;
                        
                        return `
                            <div class="comment">
                                <div class="comment-header">
                                    <span class="comment-author">${authorName}</span>
                                    <span class="comment-date">${createdAt ? new Date(createdAt).toLocaleString('ru-RU') : '—'}</span>
                                </div>
                                <div class="comment-text">${message}</div>
                            </div>
                        `;
                    }).filter(html => html !== '').join('');
                }
            }

            // Сохранение заявки
            async saveRequest() {
                const status = document.getElementById('requestStatus').value;
                const comment = document.getElementById('newComment').value.trim();

                // Если есть новый комментарий, добавляем его
                let comments = Array.isArray(this.currentRequest.comments) 
                    ? [...this.currentRequest.comments] 
                    : (typeof this.currentRequest.comments === 'string' && this.currentRequest.comments 
                        ? (() => {
                            try {
                                return JSON.parse(this.currentRequest.comments);
                            } catch (e) {
                                return [];
                            }
                        })() 
                        : []);
                
                if (!Array.isArray(comments)) {
                    comments = [];
                }
                
                if (comment) {
                    comments.push({
                        userId: this.currentUserId,
                        login: this.currentUser?.login || '',
                        fullName: this.currentUser?.fullName || '',
                        message: comment,
                        createdAt: new Date().toISOString()
                    });
                }

                // Обрабатываем файлы - используем существующие файлы и добавляем новые
                let files = this.existingFiles || [];
                
                // Если нет существующих файлов, пытаемся загрузить из заявки
                if (files.length === 0) {
                    files = Array.isArray(this.currentRequest.files) 
                        ? [...this.currentRequest.files] 
                        : (typeof this.currentRequest.files === 'string' && this.currentRequest.files 
                            ? (() => {
                                try {
                                    return JSON.parse(this.currentRequest.files);
                                } catch (e) {
                                    return [];
                                }
                            })() 
                            : []);
                }
                
                if (!Array.isArray(files)) {
                    files = [];
                }

                // Добавляем новые файлы
                if (this.uploadedFiles.length > 0) {
                    for (const file of this.uploadedFiles) {
                        try {
                            // Читаем файл как base64
                            const base64 = await this.fileToBase64(file.data);
                            files.push({
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                data: base64,
                                uploadedAt: new Date().toISOString(),
                                uploadedBy: this.currentUserId
                            });
                        } catch (error) {
                            console.error('Ошибка чтения файла:', error);
                            this.showNotification('Ошибка при обработке файла: ' + file.name, 'error');
                        }
                    }
                }

                // Подготавливаем данные для обновления
                const updateData = {
                    id: this.currentRequest.id,
                    status: status,
                    description: this.currentRequest.description,
                    priority: this.currentRequest.priority
                };

                // Если менеджер еще не назначен, назначаем его
                if (!this.currentRequest.managerId || this.currentRequest.managerId === null) {
                    updateData.managerId = this.currentUserId;
                }

                // Если есть комментарии (новые или существующие), отправляем их
                if (comments.length > 0) {
                    updateData.comments = comments;
                }

                // Если есть файлы, отправляем их
                if (files.length > 0) {
                    updateData.files = files;
                }

                this.updateRequestOnServer(updateData).then(success => {
                    if (!success) {
                        this.showNotification('Ошибка при сохранении заявки', 'error');
                        return;
                    }
                    
                    // Обновляем данные локально
                    if (comments.length > 0) {
                        this.currentRequest.comments = comments;
                    }
                    if (files.length > 0) {
                        this.currentRequest.files = files;
                    }
                    
                    // Перезагружаем заявки
                    this.loadAssignedRequests();
                    this.showNotification('Заявка успешно обновлена', 'success');
                    this.closeModal();
                });
            }

            // Конвертация файла в base64
            fileToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        // Убираем префикс data:type;base64,
                        const base64 = reader.result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // Загрузка существующих файлов из заявки
            loadExistingFiles(request) {
                let files = request.files || [];
                
                // Парсим файлы, если они в виде JSON строки
                if (typeof files === 'string') {
                    try {
                        files = JSON.parse(files);
                    } catch (e) {
                        files = [];
                    }
                }
                
                if (!Array.isArray(files)) {
                    files = [];
                }

                // Отображаем существующие файлы
                const container = document.getElementById('uploadedFiles');
                if (files.length > 0) {
                    const existingFilesHtml = files.map((file, index) => `
                        <div class="file-item">
                            <span>${file.name || 'Файл'} (${this.formatFileSize(file.size || 0)})</span>
                            <div>
                                <button class="file-download" onclick="managerDashboard.downloadFile(${index}, '${file.name || 'file'}')" title="Скачать">⬇</button>
                                ${request.status === 'completed' ? `<button class="file-remove" onclick="managerDashboard.removeExistingFile(${index})" title="Удалить">×</button>` : ''}
                            </div>
                        </div>
                    `).join('');
                    
                    // Сохраняем существующие файлы для дальнейшей работы
                    this.existingFiles = files;
                    
                    // Добавляем к новым файлам, если они есть
                    const newFilesHtml = this.uploadedFiles.map((file, index) => `
                        <div class="file-item">
                            <span>${file.name} (${this.formatFileSize(file.size)})</span>
                            <button class="file-remove" onclick="managerDashboard.removeFile(${index})">×</button>
                        </div>
                    `).join('');
                    
                    container.innerHTML = existingFilesHtml + newFilesHtml;
                } else {
                    // Только новые файлы
                    this.existingFiles = [];
                    this.renderUploadedFiles();
                }
            }

            // Скачивание файла
            downloadFile(fileIndex, fileName) {
                if (!this.existingFiles || !this.existingFiles[fileIndex]) {
                    this.showNotification('Файл не найден', 'error');
                    return;
                }

                const file = this.existingFiles[fileIndex];
                if (!file.data) {
                    this.showNotification('Данные файла отсутствуют', 'error');
                    return;
                }

                try {
                    // Конвертируем base64 обратно в blob
                    const byteCharacters = atob(file.data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: file.type || 'application/octet-stream' });

                    // Создаем ссылку для скачивания
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName || file.name || 'file';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Ошибка скачивания файла:', error);
                    this.showNotification('Ошибка при скачивании файла', 'error');
                }
            }

            // Удаление существующего файла
            removeExistingFile(fileIndex) {
                if (!this.existingFiles || !this.existingFiles[fileIndex]) {
                    return;
                }

                this.existingFiles.splice(fileIndex, 1);
                
                // Обновляем файлы в заявке
                this.currentRequest.files = this.existingFiles;
                
                // Перерисовываем список файлов
                this.loadExistingFiles(this.currentRequest);
            }

            // Закрытие модального окна
            closeModal() {
                document.getElementById('requestModal').classList.remove('show');
                document.getElementById('newComment').value = '';
                this.uploadedFiles = [];
                this.existingFiles = [];
                this.renderUploadedFiles();
                this.currentRequest = null;
            }

            // Утилиты
            generateId() {
                return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            // Нормализация заявок из локального хранилища (приводим id и ссылки к строкам)
            normalizeRequests(requests) {
                return (requests || []).map(req => {
                    // Парсим комментарии, если они в виде JSON строки
                    let comments = req.comments;
                    
                    if (comments === null || comments === undefined) {
                        comments = [];
                    } else if (typeof comments === 'string') {
                        // Если это пустая строка или "[]", делаем пустой массив
                        if (comments.trim() === '' || comments.trim() === '[]') {
                            comments = [];
                        } else {
                            try {
                                comments = JSON.parse(comments);
                            } catch (e) {
                                console.warn('Ошибка парсинга комментариев при нормализации:', e);
                                comments = [];
                            }
                        }
                    }
                    
                    // Убеждаемся, что это массив
                    if (!Array.isArray(comments)) {
                        comments = [];
                    }
                    
                    // Парсим files аналогично
                    let files = req.files;
                    if (files === null || files === undefined) {
                        files = [];
                    } else if (typeof files === 'string') {
                        if (files.trim() === '' || files.trim() === '[]') {
                            files = [];
                        } else {
                            try {
                                files = JSON.parse(files);
                            } catch (e) {
                                files = [];
                            }
                        }
                    }
                    if (!Array.isArray(files)) {
                        files = [];
                    }
                    
                    return {
                        id: String(req.id),
                        title: req.title || req.name || req.requestTitle || '—',
                        userId: req.userId ? String(req.userId) : (req.user_id ? String(req.user_id) : null),
                        managerId: req.managerId ? String(req.managerId) : (req.manager_id ? String(req.manager_id) : null),
                        priority: req.priority || req.requestPriority || 'medium',
                        status: req.status || 'new',
                        description: req.description || req.requestDescription || '',
                        category: req.category || req.requestCategory || '',
                        files: files,
                        comments: comments,
                        createdAt: this.normalizeDate(req.createdAt || req.created_at) || new Date().toISOString(),
                        updatedAt: this.normalizeDate(req.updatedAt || req.updated_at) || null
                    };
                });
            }

            // Нормализация дат
            normalizeDate(dateValue) {
                if (!dateValue) return null;
                if (typeof dateValue === 'string') {
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

            async loadRequestsFromAPI() {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    if (!session || !session.token) {
                        this.requestsFromServer = [];
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
                        this.requestsFromServer = this.normalizeRequests(data.requests);
                    } else {
                        this.requestsFromServer = [];
                    }
                } catch (error) {
                    console.error('Ошибка загрузки заявок:', error);
                    this.requestsFromServer = [];
                }
            }

            // Обновление заявки на сервере
            async updateRequestOnServer(payload) {
                try {
                    const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                    if (!session || !session.token) {
                        console.error('Нет токена авторизации');
                        this.showNotification('Ошибка авторизации. Пожалуйста, войдите снова', 'error');
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

                    if (response.status === 403) {
                        const errorData = await response.json().catch(() => ({ error: 'Доступ запрещен' }));
                        console.error('403 Forbidden:', errorData);
                        this.showNotification('Доступ запрещен. Проверьте права доступа', 'error');
                        return false;
                    }

                    if (response.status === 401) {
                        console.error('401 Unauthorized - токен истек');
                        this.showNotification('Сессия истекла. Пожалуйста, войдите снова', 'error');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                        return false;
                    }

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
                        console.error('Ошибка обновления заявки:', response.status, errorData);
                        this.showNotification('Ошибка при обновлении заявки: ' + (errorData.error || 'Неизвестная ошибка'), 'error');
                        return false;
                    }

                    const data = await response.json();
                    return !!data.success;
                } catch (error) {
                    console.error('Ошибка обновления заявки:', error);
                    this.showNotification('Ошибка сети при обновлении заявки', 'error');
                    return false;
                }
            }

            getCategoryName(category) {
                if (!category) return '—';
                const categories = {
                    'maintenance': 'Техобслуживание',
                    'repair': 'Ремонт',
                    'supply': 'Поставка',
                    'consultation': 'Консультация',
                    'other': 'Другое'
                };
                return categories[category] || category;
            }

            // Загрузка пользователей из API для отображения ФИО заявителя
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
                        this.users = data.users.map(user => ({
                            id: String(user.id),
                            login: user.login || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            role: user.role || 'user',
                            fullName: user.full_name || user.fullName || user.login || 'Неизвестно',
                            status: user.status === 'blocked' ? 'inactive' : (user.status || 'active'),
                            createdAt: user.created_at || user.createdAt
                        }));
                        console.log('Загружено пользователей из API:', this.users.length, this.users);
                    } else {
                        console.warn('Не удалось загрузить пользователей из API:', data);
                        this.users = [];
                    }
                } catch (error) {
                    console.error('Ошибка загрузки пользователей:', error);
                    this.users = [];
                }
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
                        document.body.removeChild(notification);
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

        function closeModal() {
            managerDashboard.closeModal();
        }

        function saveRequest() {
            managerDashboard.saveRequest();
        }

        // Инициализация
        let managerDashboard;
        document.addEventListener('DOMContentLoaded', () => {
            managerDashboard = new ManagerDashboard();
        });
