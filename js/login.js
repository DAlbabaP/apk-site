// Скрипты из login.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система авторизации
        class AuthSystem {
            constructor() {
                this.form = document.getElementById('loginForm');
                this.initEventListeners();
                this.createDefaultAdmin();
            }

            initEventListeners() {
                this.form.addEventListener('submit', (e) => this.handleLogin(e));
                
                // Убираем ошибки при вводе
                document.getElementById('login').addEventListener('input', () => this.hideError());
                document.getElementById('password').addEventListener('input', () => this.hideError());
            }

            // Создание администратора по умолчанию
            createDefaultAdmin() {
                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const hasAdmin = users.some(user => user.login === 'admin');
                    
                    if (!hasAdmin) {
                        const adminUser = {
                            id: 'admin_' + Date.now(),
                            fullName: 'Администратор Системы',
                            login: 'admin',
                            phone: '79999999999',
                            email: 'admin@agrozayavki.ru',
                            password: this.hashPassword('admin'),
                            role: 'admin',
                            status: 'active',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        users.push(adminUser);
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                } catch (error) {
                    console.error('Ошибка создания администратора:', error);
                }
            }

            // Обработка входа
            async handleLogin(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const loadingSpinner = document.getElementById('loadingSpinner');
                
                // Показываем индикатор загрузки
                submitBtn.disabled = true;
                loadingSpinner.style.display = 'inline-block';
                this.hideError();

                try {
                    const formData = new FormData(this.form);
                    const login = formData.get('login').trim();
                    const password = formData.get('password');

                    // Валидация
                    if (!login || !password) {
                        this.showError('Заполните все поля');
                        return;
                    }

                    // Имитация задержки сервера
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Проверка пользователя
                    const user = this.authenticateUser(login, password);
                    
                    if (!user) {
                        this.showError('Неверный логин или пароль');
                        return;
                    }

                    if (user.status !== 'active') {
                        this.showError('Аккаунт заблокирован. Обратитесь к администратору');
                        return;
                    }

                    // Сохраняем сессию
                    this.createSession(user);
                    
                    this.showNotification('Вход выполнен успешно! Перенаправление...', 'success');
                    
                    // Перенаправление в зависимости от роли
                    setTimeout(() => {
                        this.redirectToDashboard(user.role);
                    }, 1500);

                } catch (error) {
                    this.showError('Произошла ошибка при входе. Попробуйте еще раз');
                    console.error('Login error:', error);
                } finally {
                    submitBtn.disabled = false;
                    loadingSpinner.style.display = 'none';
                }
            }

            // Аутентификация пользователя
            authenticateUser(login, password) {
                try {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const hashedPassword = this.hashPassword(password);
                    
                    return users.find(user => 
                        user.login === login && user.password === hashedPassword
                    );
                } catch (error) {
                    console.error('Authentication error:', error);
                    return null;
                }
            }

            // Создание сессии
            createSession(user) {
                const session = {
                    userId: user.id,
                    login: user.login,
                    fullName: user.fullName,
                    role: user.role,
                    loginTime: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
                };

                localStorage.setItem('currentSession', JSON.stringify(session));
                sessionStorage.setItem('isLoggedIn', 'true');
            }

            // Перенаправление на дашборд
            redirectToDashboard(role) {
                const dashboardPages = {
                    'user': 'dashboard-user.html',
                    'manager': 'dashboard-manager.html', 
                    'admin': 'dashboard-admin.html'
                };

                const targetPage = dashboardPages[role] || 'dashboard-user.html';
                window.location.href = targetPage;
            }

            // Простое хеширование пароля (как в регистрации)
            hashPassword(password) {
                let hash = 0;
                for (let i = 0; i < password.length; i++) {
                    const char = password.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return 'hashed_' + Math.abs(hash).toString(36);
            }

            // Показ ошибки
            showError(message) {
                const errorElement = document.getElementById('loginError');
                errorElement.textContent = message;
                errorElement.classList.add('show');
                
                // Подсвечиваем поля
                document.getElementById('login').classList.add('error');
                document.getElementById('password').classList.add('error');
            }

            // Скрытие ошибки
            hideError() {
                const errorElement = document.getElementById('loginError');
                errorElement.classList.remove('show');
                
                // Убираем подсветку
                document.getElementById('login').classList.remove('error');
                document.getElementById('password').classList.remove('error');
            }

            // Показ уведомлений
            showNotification(message, type = 'success') {
                const notification = document.getElementById('notification');
                notification.textContent = message;
                notification.className = `notification ${type}`;
                notification.classList.add('show');

                setTimeout(() => {
                    notification.classList.remove('show');
                }, 4000);
            }
        }

        // Проверка сессии при загрузке
        function checkExistingSession() {
            try {
                const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
                
                if (session && new Date(session.expiresAt) > new Date()) {
                    // Сессия действительна, перенаправляем
                    const dashboardPages = {
                        'user': 'dashboard-user.html',
                        'manager': 'dashboard-manager.html', 
                        'admin': 'dashboard-admin.html'
                    };
                    
                    const targetPage = dashboardPages[session.role] || 'dashboard-user.html';
                    window.location.href = targetPage;
                    return true;
                }
            } catch (error) {
                // Очищаем поврежденную сессию
                localStorage.removeItem('currentSession');
                sessionStorage.removeItem('isLoggedIn');
            }
            
            return false;
        }

        // Инициализация
        document.addEventListener('DOMContentLoaded', () => {
            // Проверяем существующую сессию
            if (!checkExistingSession()) {
                // Если сессии нет, инициализируем систему авторизации
                new AuthSystem();
            }
        });

        // Автозаполнение демо-аккаунтов
        document.querySelectorAll('.demo-account').forEach(account => {
            account.addEventListener('click', () => {
                const credentials = account.querySelector('span').textContent.split(' / ');
                document.getElementById('login').value = credentials[0];
                document.getElementById('password').value = credentials[1];
            });
        });
