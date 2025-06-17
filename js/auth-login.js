/**
 * Система авторизации - полностью новая реализация
 * Только API, без localStorage
 * Создано: 2025-06-16
 */

class LoginManager {
    constructor() {
        this.form = null;
        this.isLoading = false;
        this.init();
    }

    // Инициализация
    init() {
        this.form = document.getElementById('loginForm');
        if (!this.form) {
            console.error('Login form not found');
            return;
        }

        this.setupEventListeners();
        this.setupQuickLoginButtons();
        this.focusFirstField();
        this.checkExistingAuth();
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Основная форма
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Поля ввода
        const loginField = document.getElementById('login');
        const passwordField = document.getElementById('password');

        if (loginField) {
            loginField.addEventListener('input', () => this.clearErrors());
            loginField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    passwordField?.focus();
                }
            });
        }

        if (passwordField) {
            passwordField.addEventListener('input', () => this.clearErrors());
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.form.dispatchEvent(new Event('submit'));
                }
            });
        }
    }    // Проверка существующей авторизации
    checkExistingAuth() {
        // Временно отключаем автоматическое перенаправление
        // чтобы пользователь мог выйти и войти под другим аккаунтом
        console.log('🔍 Checking existing auth...');
        try {
            if (window.AuthManager && AuthManager.isAuthenticated()) {
                const user = AuthManager.getCurrentUser();
                console.log('⚠️ User already authenticated:', user?.username, 'role:', user?.role);
                // Показываем предупреждение вместо автоматического перенаправления
                this.showExistingAuthWarning(user);
            }
        } catch (error) {
            console.log('AuthManager not ready yet, skipping auth check');
        }
    }

    // Показать предупреждение о существующей авторизации
    showExistingAuthWarning(user) {
        const warningHtml = `
            <div class="existing-auth-warning" style="
                margin-bottom: 20px; 
                padding: 15px; 
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1)); 
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px; 
                text-align: center;
            ">
                <h4 style="color: #F57C00; margin-bottom: 10px; font-size: 14px;">⚠️ Вы уже авторизованы</h4>
                <p style="margin: 5px 0; font-size: 13px;">
                    Пользователь: <strong>${user.username}</strong> (${user.role})
                </p>
                <div style="margin-top: 10px;">
                    <button type="button" id="goToDashboard" style="
                        padding: 8px 16px; 
                        background: #4CAF50; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        margin-right: 10px;
                        font-size: 12px;
                    ">
                        Перейти в панель
                    </button>
                    <button type="button" id="logoutAndStay" style="
                        padding: 8px 16px; 
                        background: #f44336; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        Выйти
                    </button>
                </div>
            </div>
        `;
        
        this.form.insertAdjacentHTML('beforebegin', warningHtml);
        
        // Обработчики кнопок
        document.getElementById('goToDashboard')?.addEventListener('click', () => {
            this.redirectToUserDashboard(user.role);
        });
        
        document.getElementById('logoutAndStay')?.addEventListener('click', () => {
            AuthManager.logout();
            // После logout перезагружаем страницу чтобы убрать предупреждение
            window.location.reload();
        });
    }// Обработка отправки формы
    async handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isLoading) {
            console.log('Login already in progress, ignoring submit');
            return;
        }

        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;

        await this.performLogin(formData);
    }

    // Получение данных формы
    getFormData() {
        const formData = new FormData(this.form);
        return {
            login: formData.get('login')?.trim() || '',
            password: formData.get('password') || ''
        };
    }

    // Валидация данных формы
    validateFormData(data) {
        this.clearErrors();

        if (!data.login) {
            this.showError('Введите логин');
            document.getElementById('login')?.focus();
            return false;
        }

        if (!data.password) {
            this.showError('Введите пароль');
            document.getElementById('password')?.focus();
            return false;
        }

        if (data.login.length < 2) {
            this.showError('Логин слишком короткий');
            document.getElementById('login')?.focus();
            return false;
        }

        return true;
    }    // Выполнение входа
    async performLogin(credentials) {
        this.setLoadingState(true);

        try {
            // Проверяем готовность AuthManager
            if (!window.AuthManager) {
                throw new Error('Система авторизации не готова. Перезагрузите страницу.');
            }

            console.log('🔐 Attempting login for user:', credentials.login);
            
            const response = await AuthManager.login(credentials);
            
            console.log('✅ Login successful:', {
                user: response.user.username,
                role: response.user.role,
                token: response.token ? 'received' : 'missing'
            });

            this.showSuccess('Вход выполнен успешно!');
            
            // Увеличиваем задержку и добавляем проверку
            setTimeout(() => {
                console.log('🔄 Starting redirect...');
                try {
                    this.redirectToUserDashboard(response.user.role);
                } catch (redirectError) {
                    console.error('❌ Redirect failed:', redirectError);
                    this.showError('Ошибка перенаправления. Попробуйте войти снова.');
                }
            }, 1500);

        } catch (error) {
            console.error('❌ Login failed:', error.message);
            this.handleLoginError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Обработка ошибок входа
    handleLoginError(error) {
        let message = 'Ошибка входа в систему';

        if (error.message.includes('Invalid credentials')) {
            message = 'Неверный логин или пароль';
            // Очищаем пароль при неверных данных
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.value = '';
                passwordField.focus();
            }
        } else if (error.message.includes('Network')) {
            message = 'Ошибка сети. Проверьте подключение к интернету';
        } else if (error.message.includes('Server')) {
            message = 'Ошибка сервера. Попробуйте позже';
        } else if (error.message) {
            message = error.message;
        }

        this.showError(message);
    }    // Перенаправление на дашборд пользователя
    redirectToUserDashboard(role) {
        const dashboardUrls = {
            'admin': 'dashboard-admin.html',
            'manager': 'dashboard-manager.html',
            'user': 'dashboard-user.html'
        };

        const targetUrl = dashboardUrls[role] || dashboardUrls.user;
        
        console.log('🔄 Redirecting to:', targetUrl);
        window.location.href = targetUrl;
    }

    // Установка состояния загрузки
    setLoadingState(loading) {
        this.isLoading = loading;
        
        const submitBtn = document.getElementById('submitBtn');
        const spinner = document.getElementById('loadingSpinner');
        
        if (submitBtn) {
            submitBtn.disabled = loading;
        }
        
        if (spinner) {
            spinner.style.display = loading ? 'inline-block' : 'none';
        }
    }

    // Показать ошибку
    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.add('show');
        }

        // Также используем общую систему уведомлений
        if (window.Utils?.showNotification) {
            Utils.showNotification(message, 'error');
        }
    }

    // Показать успех
    showSuccess(message) {
        if (window.Utils?.showNotification) {
            Utils.showNotification(message, 'success');
        }
    }

    // Очистить ошибки
    clearErrors() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Фокус на первое поле
    focusFirstField() {
        setTimeout(() => {
            const loginField = document.getElementById('login');
            if (loginField) {
                loginField.focus();
            }
        }, 100);
    }

    // Настройка кнопок быстрого входа
    setupQuickLoginButtons() {
        const quickLoginHtml = `
            <div class="demo-quick-login" style="
                margin-top: 20px; 
                padding: 15px; 
                background: linear-gradient(135deg, rgba(46, 125, 50, 0.05), rgba(76, 175, 80, 0.05)); 
                border: 1px solid rgba(46, 125, 50, 0.1);
                border-radius: 8px; 
                text-align: center;
            ">
                <h4 style="color: #2E7D32; margin-bottom: 10px; font-size: 14px;">🚀 Быстрый вход (демо)</h4>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px;">
                    <button type="button" class="quick-btn quick-admin" data-role="admin" style="
                        padding: 8px 16px; 
                        background: linear-gradient(135deg, #D32F2F, #F44336); 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer; 
                        font-size: 12px; 
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 4px rgba(211, 47, 47, 0.3);
                    ">
                        👑 Администратор
                    </button>
                    <button type="button" class="quick-btn quick-manager" data-role="manager" style="
                        padding: 8px 16px; 
                        background: linear-gradient(135deg, #1976D2, #2196F3); 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer; 
                        font-size: 12px; 
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
                    ">
                        👔 Менеджер
                    </button>
                    <button type="button" class="quick-btn quick-user" data-role="user" style="
                        padding: 8px 16px; 
                        background: linear-gradient(135deg, #388E3C, #4CAF50); 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer; 
                        font-size: 12px; 
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 4px rgba(56, 142, 60, 0.3);
                    ">
                        👤 Пользователь
                    </button>
                </div>
                <p style="font-size: 11px; color: #666; margin: 0;">Все пароли: <code>password</code></p>
            </div>
        `;

        this.form.insertAdjacentHTML('afterend', quickLoginHtml);

        // Настройка обработчиков для кнопок
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const role = btn.dataset.role;
                this.quickLogin(role);
            });

            // Hover эффекты
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = btn.style.boxShadow.replace('0 2px 4px', '0 4px 12px');
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = btn.style.boxShadow.replace('0 4px 12px', '0 2px 4px');
            });
        });
    }

    // Быстрый вход
    async quickLogin(role) {
        const credentials = {
            'admin': { login: 'admin', password: 'password' },
            'manager': { login: 'manager', password: 'password' },
            'user': { login: 'user', password: 'password' }
        };

        const creds = credentials[role];
        if (!creds) return;

        // Заполняем поля
        const loginField = document.getElementById('login');
        const passwordField = document.getElementById('password');

        if (loginField) loginField.value = creds.login;
        if (passwordField) passwordField.value = creds.password;

        // Выполняем вход
        await this.performLogin(creds);
    }
}

// Глобальная функция для совместимости (если нужна)
window.quickLogin = function(role) {
    if (window.loginManager) {
        window.loginManager.quickLogin(role);
    }
};

// Функция проверки готовности AuthManager
function waitForAuthManager() {
    return new Promise((resolve) => {
        if (window.AuthManager && window.api) {
            resolve();
        } else {
            console.log('⏳ Waiting for AuthManager...');
            setTimeout(() => waitForAuthManager().then(resolve), 100);
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Initializing new login system...');
    
    // Ждем готовности AuthManager
    await waitForAuthManager();
    console.log('✅ AuthManager ready, starting login system');
    
    window.loginManager = new LoginManager();
});