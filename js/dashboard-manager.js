// Скрипты из dashboard-manager.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система управления дашбордом менеджера
        class ManagerDashboard {
            constructor() {
                this.currentUser = null;
                this.assignedRequests = [];
                this.currentRequest = null;
                this.uploadedFiles = [];
                this.init();
            }            async init() {
                this.checkAuth();
                this.loadUserData();
                await this.loadAssignedRequests();
                this.updateStats();
                this.initNavigation();
                this.initForms();
                this.initFileUpload();
                this.renderRecentRequests();
                this.initFilters();
            }// Проверка авторизации
            checkAuth() {
                try {
                    // Используем новую систему авторизации
                    if (!window.AuthManager || !AuthManager.isAuthenticated()) {
                        console.log('❌ Manager not authenticated, redirecting to login');
                        window.location.href = 'login.html';
                        return;
                    }

                    const user = AuthManager.getCurrentUser();
                    if (!user) {
                        console.log('❌ No user data found, redirecting to login');
                        window.location.href = 'login.html';
                        return;
                    }

                    if (user.role !== 'manager') {
                        console.log('❌ User is not manager, redirecting to appropriate dashboard');
                        const dashboards = {
                            'user': 'dashboard-user.html',
                            'admin': 'dashboard-admin.html'
                        };
                        if (dashboards[user.role]) {
                            window.location.href = dashboards[user.role];
                        }
                        return;
                    }

                    console.log('✅ Manager user authenticated:', user.username);
                    this.currentUser = user;                } catch (error) {
                    console.error('❌ Auth check error:', error);
                    window.location.href = 'login.html';
                }
            }

            // Загрузка данных пользователя
            async loadUserData() {
                if (!this.currentUser) return;

                // Используем данные из новой системы авторизации
                let user = this.currentUser;
                console.log('📋 Loading user data:', user);
                
                // Загружаем дополнительные данные пользователя через API профиля
                try {
                    if (window.api && window.api.users && window.api.users.getProfile) {
                        console.log('🔄 Loading user profile via API...');
                        const profileResponse = await window.api.users.getProfile();
                        if (profileResponse.success && profileResponse.user) {
                            console.log('📋 Full user profile loaded:', profileResponse.user);
                            // Обновляем данные текущего пользователя
                            Object.assign(this.currentUser, profileResponse.user);
                            user = this.currentUser;
                        }
                    }
                } catch (error) {
                    console.warn('Could not load user profile:', error);
                }

                // Обновляем информацию в шапке ПОСЛЕ загрузки данных профиля
                const displayName = user.full_name || (user.first_name && user.last_name ? 
                    `${user.first_name} ${user.last_name}` : user.username) || 'Менеджер';
                
                const setElementText = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                        console.log(`✅ Updated header ${id} = "${value}"`);
                    }
                };

                setElementText('userName', displayName);
                setElementText('userRole', 'Менеджер');
                
                const avatarElement = document.getElementById('userAvatar');
                if (avatarElement) {
                    avatarElement.textContent = displayName.charAt(0).toUpperCase();
                }

                // Заполняем форму профиля (если элементы существуют)
                const setFieldValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value || '';
                        console.log(`✅ Set ${id} = "${value}"`);
                    } else {
                        console.warn(`❌ Element ${id} not found`);
                    }
                };

                setFieldValue('profileFullName', user.full_name || (user.first_name && user.last_name ? 
                    `${user.first_name} ${user.last_name}` : user.username));
                setFieldValue('profileLogin', user.username);
                setFieldValue('profilePhone', user.phone);
                setFieldValue('profileEmail', user.email);
                setFieldValue('profileDepartment', user.department);                setFieldValue('profilePosition', user.position);
                setFieldValue('profilePositionCode', user.position_code);
            }

            // Загрузка назначенных заявок
            async loadAssignedRequests() {
                try {
                    console.log('🔄 Loading assigned requests via API...');
                    
                    // Ждем готовности API если он еще не готов
                    let retries = 0;
                    while ((!window.api || !window.api.applications) && retries < 50) {
                        console.log('⏳ Waiting for API to be ready...');
                        await new Promise(resolve => setTimeout(resolve, 100));
                        retries++;
                    }
                    
                    if (!window.api || !window.api.applications) {
                        console.error('❌ API not available after waiting');
                        this.assignedRequests = [];
                        return;
                    }

                    const response = await window.api.applications.getAll();
                    
                    if (response.success && response.applications) {
                        // Менеджер видит только свои назначенные заявки или неназначенные
                        this.assignedRequests = response.applications.filter(req => 
                            req.assigned_manager_id == this.currentUser.id || !req.assigned_manager_id
                        );
                        console.log('✅ Assigned requests loaded:', this.assignedRequests.length);
                    } else {
                        console.error('❌ Failed to load requests:', response.error);
                        this.assignedRequests = [];
                    }
                } catch (error) {
                    console.error('❌ Error loading assigned requests:', error);
                    this.assignedRequests = [];
                }
            }// Обновление статистики
            updateStats() {
                const total = this.assignedRequests.length;
                const pending = this.assignedRequests.filter(req => 
                    ['pending', 'in_progress'].includes(req.status)
                ).length;
                const completed = this.assignedRequests.filter(req => 
                    req.status === 'completed'
                ).length;
                const urgent = this.assignedRequests.filter(req => 
                    ['high', 'urgent'].includes(req.priority) && req.status !== 'completed'
                ).length;

                const setStatValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = value;
                };

                setStatValue('totalAssignedRequests', total);
                setStatValue('pendingRequests', pending);
                setStatValue('completedRequests', completed);
                setStatValue('urgentRequests', urgent);
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
            }            // Инициализация форм
            initForms() {
                const profileForm = document.getElementById('profileForm');
                if (profileForm) {
                    profileForm.addEventListener('submit', (e) => {
                        this.handleProfileUpdate(e);
                    });
                }

                const requestStatus = document.getElementById('requestStatus');
                if (requestStatus) {
                    requestStatus.addEventListener('change', (e) => {
                        const fileUploadGroup = document.getElementById('fileUploadGroup');
                        if (fileUploadGroup) {
                            if (e.target.value === 'completed') {
                                fileUploadGroup.style.display = 'block';
                            } else {
                                fileUploadGroup.style.display = 'none';
                            }
                        }
                    });
                }
            }            // Инициализация загрузки файлов
            initFileUpload() {
                const fileUpload = document.getElementById('fileUpload');
                const fileInput = document.getElementById('fileInput');

                if (!fileUpload || !fileInput) return;

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
            }// Инициализация фильтров
            initFilters() {
                ['statusFilter', 'priorityFilter', 'dateFilter'].forEach(filterId => {
                    const element = document.getElementById(filterId);
                    if (element) {
                        element.addEventListener('change', () => {
                            this.renderAllRequests();
                        });
                    }
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
            }            // Отображение загруженных файлов
            renderUploadedFiles() {
                const container = document.getElementById('uploadedFiles');
                if (!container) return;
                
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
            }            // Обработка обновления профиля
            async handleProfileUpdate(e) {
                e.preventDefault();
                
                console.log('📝 Updating profile...');
                
                const formData = new FormData(e.target);
                const updatedData = {
                    full_name: formData.get('profileFullName'),
                    phone: formData.get('profilePhone'),
                    email: formData.get('profileEmail'),
                    department: formData.get('profileDepartment'),
                    position: formData.get('profilePosition'),
                    position_code: formData.get('profilePositionCode')
                };

                console.log('📝 Updated data:', updatedData);                try {
                    // Используем API для обновления профиля текущего пользователя
                    if (window.api && window.api.users && window.api.users.updateProfile) {
                        console.log('🔄 Calling API to update profile...');
                        const response = await window.api.users.updateProfile(updatedData);
                        if (response.success) {
                            console.log('✅ Profile updated via API');
                            // Обновляем локальные данные из ответа API
                            if (response.user) {
                                Object.assign(this.currentUser, response.user);
                            } else {
                                Object.assign(this.currentUser, updatedData);
                            }
                        } else {
                            console.warn('❌ API update failed:', response.error);
                            throw new Error(response.error || 'Failed to update profile');
                        }
                    } else {
                        console.log('⚠️ API update not available, updating locally');
                        Object.assign(this.currentUser, updatedData);
                    }
                      // Обновляем отображение данных пользователя
                    await this.loadUserData();
                    
                    this.showNotification('Профиль успешно обновлен', 'success');
                } catch (error) {
                    console.error('❌ Error updating profile:', error);
                    this.showNotification('Ошибка при обновлении профиля: ' + error.message, 'error');
                }
            }// Отображение последних заявок
            renderRecentRequests() {
                const container = document.getElementById('recentRequestsContainer');
                if (!container) return;
                
                const recentRequests = this.assignedRequests
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
                                        <td>${new Date(req.created_at).toLocaleDateString('ru-RU')}</td>
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
            }            // Отображение всех заявок с фильтрацией
            renderAllRequests() {
                const container = document.getElementById('requestsContainer');
                if (!container) return;
                
                // Применяем фильтры
                let filteredRequests = [...this.assignedRequests];
                
                const statusFilter = document.getElementById('statusFilter')?.value;
                if (statusFilter) {
                    filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
                }

                const priorityFilter = document.getElementById('priorityFilter')?.value;
                if (priorityFilter) {
                    filteredRequests = filteredRequests.filter(req => req.priority === priorityFilter);
                }

                const dateFilter = document.getElementById('dateFilter')?.value;
                if (dateFilter) {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    filteredRequests = filteredRequests.filter(req => {
                        const reqDate = new Date(req.created_at);
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
                        const statusOrder = { 'pending': 0, 'in_progress': 1, 'completed': 2, 'cancelled': 3 };
                        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
                        
                        if (statusOrder[a.status] !== statusOrder[b.status]) {
                            return statusOrder[a.status] - statusOrder[b.status];
                        }
                        
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                        }
                        
                        return new Date(b.created_at) - new Date(a.created_at);
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
                                        <td><span class="category-badge category-${req.category || 'other'}">${this.getCategoryName(req.category)}</span></td>
                                        <td><span class="priority-badge priority-${req.priority}">${this.getPriorityName(req.priority)}</span></td>
                                        <td><span class="status-badge status-${req.status}">${this.getStatusName(req.status)}</span></td>
                                        <td>${new Date(req.created_at).toLocaleDateString('ru-RU')}</td>
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
            }            // Открытие модального окна заявки
            async openRequestModal(requestId) {
                const request = this.assignedRequests.find(req => req.id == requestId);
                if (!request) return;

                this.currentRequest = request;
                this.uploadedFiles = [];

                try {
                    // Получаем информацию о пользователе через API
                    let userName = 'Неизвестно';
                    if (request.user_id && window.api && window.api.users) {
                        try {
                            const userResponse = await window.api.users.getAll();
                            if (userResponse.success && userResponse.users) {
                                const user = userResponse.users.find(u => u.id == request.user_id);
                                if (user) {
                                    userName = user.full_name || 
                                        (user.first_name && user.last_name ? 
                                            `${user.first_name} ${user.last_name}` : user.username) || 'Неизвестно';
                                }
                            }
                        } catch (e) {
                            console.warn('Could not load user info:', e);
                        }
                    }

                    // Заполняем детали заявки
                    const detailsContainer = document.getElementById('requestDetails');
                    if (detailsContainer) {
                        detailsContainer.innerHTML = `
                            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--background-color); border-radius: var(--border-radius);">
                                <h4>${request.title}</h4>
                                <p><strong>Категория:</strong> ${this.getCategoryName(request.category)}</p>
                                <p><strong>Приоритет:</strong> ${this.getPriorityName(request.priority)}</p>
                                <p><strong>Заявитель:</strong> ${userName}</p>
                                <p><strong>Дата создания:</strong> ${new Date(request.created_at).toLocaleDateString('ru-RU')}</p>
                                <p><strong>Описание:</strong></p>
                                <p style="white-space: pre-wrap;">${request.description || 'Описание не указано'}</p>
                            </div>
                        `;
                    }

                    // Устанавливаем текущий статус
                    const statusSelect = document.getElementById('requestStatus');
                    if (statusSelect) {
                        statusSelect.value = request.status;
                    }

                    // Показываем/скрываем загрузку файлов
                    const fileUploadGroup = document.getElementById('fileUploadGroup');
                    if (fileUploadGroup) {
                        fileUploadGroup.style.display = request.status === 'completed' ? 'block' : 'none';
                    }

                    // Загружаем комментарии
                    this.renderComments();

                    // Показываем модальное окно
                    const modal = document.getElementById('requestModal');
                    if (modal) {
                        modal.classList.add('show');
                    }
                } catch (error) {
                    console.error('Error opening request modal:', error);
                    this.showNotification('Ошибка при открытии заявки', 'error');
                }
            }            // Отображение комментариев
            renderComments() {
                const container = document.getElementById('commentsSection');
                if (!container) return;
                
                const comments = this.currentRequest.comments || [];

                if (comments.length === 0) {
                    container.innerHTML = '<p style="color: var(--gray-medium); text-align: center;">Нет комментариев</p>';
                } else {
                    container.innerHTML = comments.map(comment => {
                        const userName = comment.user_name || 'Неизвестно';
                        return `
                            <div class="comment">
                                <div class="comment-header">
                                    <span class="comment-author">${userName}</span>
                                    <span class="comment-date">${new Date(comment.created_at).toLocaleString('ru-RU')}</span>
                                </div>
                                <div class="comment-text">${comment.message}</div>
                            </div>
                        `;
                    }).join('');
                }
            }            // Сохранение заявки
            async saveRequest() {
                const statusSelect = document.getElementById('requestStatus');
                const commentInput = document.getElementById('newComment');
                
                if (!statusSelect || !this.currentRequest) {
                    this.showNotification('Ошибка: заявка не выбрана', 'error');
                    return;
                }

                const status = statusSelect.value;
                const comment = commentInput ? commentInput.value.trim() : '';

                try {
                    // В реальной системе здесь должен быть API-вызов для обновления заявки
                    console.log('Saving request:', {
                        id: this.currentRequest.id,
                        status: status,
                        comment: comment,
                        files: this.uploadedFiles
                    });

                    // Временно обновляем локально до реализации API
                    const requestIndex = this.assignedRequests.findIndex(req => req.id == this.currentRequest.id);
                    if (requestIndex !== -1) {
                        this.assignedRequests[requestIndex].status = status;
                        this.assignedRequests[requestIndex].updated_at = new Date().toISOString();

                        if (status === 'completed') {
                            this.assignedRequests[requestIndex].completed_at = new Date().toISOString();
                        }

                        // Добавляем комментарий локально
                        if (comment) {
                            if (!this.assignedRequests[requestIndex].comments) {
                                this.assignedRequests[requestIndex].comments = [];
                            }

                            this.assignedRequests[requestIndex].comments.push({
                                id: this.generateId(),
                                user_id: this.currentUser.id,
                                user_name: this.currentUser.full_name || 
                                    (this.currentUser.first_name && this.currentUser.last_name ? 
                                        `${this.currentUser.first_name} ${this.currentUser.last_name}` : 
                                        this.currentUser.username),
                                message: comment,
                                type: 'manager',
                                created_at: new Date().toISOString()
                            });
                        }

                        // Добавляем файлы локально
                        if (this.uploadedFiles.length > 0) {
                            if (!this.assignedRequests[requestIndex].files) {
                                this.assignedRequests[requestIndex].files = [];
                            }

                            this.uploadedFiles.forEach(file => {
                                this.assignedRequests[requestIndex].files.push({
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                    uploaded_by: this.currentUser.id,
                                    uploaded_at: new Date().toISOString()
                                });
                            });
                        }
                    }

                    // Обновляем отображение
                    this.updateStats();
                    this.renderRecentRequests();
                    this.renderAllRequests();

                    this.showNotification('Заявка успешно обновлена', 'success');
                    this.closeModal();

                } catch (error) {
                    console.error('Error saving request:', error);
                    this.showNotification('Ошибка при сохранении заявки', 'error');
                }
            }            // Закрытие модального окна
            closeModal() {
                const modal = document.getElementById('requestModal');
                if (modal) {
                    modal.classList.remove('show');
                }
                
                const commentInput = document.getElementById('newComment');
                if (commentInput) {
                    commentInput.value = '';
                }
                
                this.uploadedFiles = [];
                this.renderUploadedFiles();
                this.currentRequest = null;
            }

            // Утилиты
            generateId() {
                return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }            getCategoryName(category) {
                const categories = {
                    'seeds': 'Семена',
                    'fertilizers': 'Удобрения',
                    'equipment': 'Оборудование',
                    'consultation': 'Консультация',
                    'other': 'Прочее'
                };
                return categories[category] || 'Не указано';
            }

            getPriorityName(priority) {
                const priorities = {
                    'low': 'Низкий',
                    'medium': 'Средний',
                    'high': 'Высокий',
                    'urgent': 'Срочный'
                };
                return priorities[priority] || priority;
            }

            getStatusName(status) {
                const statuses = {
                    'pending': 'Ожидает',
                    'in_progress': 'В работе',
                    'completed': 'Выполнена',
                    'cancelled': 'Отменена'
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
        }        // Глобальные функции
        function logout() {
            console.log('🚪 Manager logging out...');
            // Используем новую систему авторизации
            if (window.AuthManager) {
                AuthManager.logout();
            } else {
                // Fallback на старую систему если новая недоступна
                localStorage.removeItem('auth_token');
                localStorage.removeItem('currentSession');
                sessionStorage.removeItem('isLoggedIn');
                window.location.href = 'login.html';
            }
        }

        function closeModal() {
            managerDashboard.closeModal();
        }

        function saveRequest() {
            managerDashboard.saveRequest();
        }        // Функция ожидания готовности AuthManager и API
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

        // Инициализация
        let managerDashboard;
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🔧 ManagerDashboard initializing...');
            
            // Ждем готовности AuthManager и API
            await waitForAuthManager();
            console.log('✅ AuthManager and API ready, starting ManagerDashboard');
            
            managerDashboard = new ManagerDashboard();
        });
