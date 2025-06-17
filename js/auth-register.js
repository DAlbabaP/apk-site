/**
 * Система регистрации - полностью новая реализация
 * Только API, без localStorage
 * Создано: 2025-06-16
 */

class RegisterManager {
    constructor() {
        this.form = null;
        this.isLoading = false;
        this.validationTimers = new Map();
        this.init();
    }

    // Инициализация
    init() {
        this.form = document.getElementById('registerForm');
        if (!this.form) {
            console.error('Register form not found');
            return;
        }

        this.setupEventListeners();
        this.setupPhoneMask();
        this.checkExistingAuth();
        this.focusFirstField();
    }    // Проверка существующей авторизации
    checkExistingAuth() {
        // Временно отключаем автоматическое перенаправление
        // чтобы пользователь мог зарегистрировать новый аккаунт
        console.log('🔍 Checking existing auth on register page...');
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
                        Выйти и зарегистрировать новый аккаунт
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
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Основная форма
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Валидация полей в реальном времени
        this.setupFieldValidation('fullName', this.validateFullName.bind(this));
        this.setupFieldValidation('login', this.validateLogin.bind(this), true); // с debounce
        this.setupFieldValidation('email', this.validateEmail.bind(this), true); // с debounce
        this.setupFieldValidation('phone', this.validatePhone.bind(this));
        this.setupFieldValidation('password', this.validatePassword.bind(this));
        this.setupFieldValidation('confirmPassword', this.validateConfirmPassword.bind(this));

        // Смена роли
        const roleSelect = document.getElementById('role');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => this.handleRoleChange());
        }

        // Дополнительные поля для менеджера
        this.setupFieldValidation('department', this.validateRequired.bind(this));
        this.setupFieldValidation('position', this.validateRequired.bind(this));
        this.setupFieldValidation('positionCode', this.validateRequired.bind(this));
    }

    // Настройка валидации для поля
    setupFieldValidation(fieldId, validator, useDebounce = false) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const handler = useDebounce 
            ? this.debounce((e) => validator(e.target), 500)
            : (e) => validator(e.target);

        field.addEventListener('input', handler);
        field.addEventListener('blur', (e) => validator(e.target));
    }

    // Debounce функция
    debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(this.timeout);
                func(...args);
            };
            clearTimeout(this.timeout);
            this.timeout = setTimeout(later, wait);
        };
    }

    // Обработка отправки формы
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;

        const isValid = await this.validateAllFields();
        if (!isValid) {
            this.showError('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        const formData = this.getFormData();
        await this.performRegistration(formData);
    }

    // Получение данных формы
    getFormData() {
        const formData = new FormData(this.form);
        const fullName = formData.get('fullName')?.trim() || '';
        const nameParts = fullName.split(/\s+/).filter(part => part.length > 0);

        return {
            username: formData.get('login')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            password: formData.get('password') || '',
            first_name: nameParts[1] || nameParts[0] || '', // Имя
            last_name: nameParts[0] || '', // Фамилия
            role: formData.get('role') || 'user',
            // Дополнительные поля можно добавить позже
            phone: formData.get('phone')?.replace(/\D/g, '') || '',
            department: formData.get('department')?.trim() || '',
            position: formData.get('position')?.trim() || '',
            positionCode: formData.get('positionCode')?.trim() || ''
        };
    }

    // Выполнение регистрации
    async performRegistration(userData) {
        this.setLoadingState(true);

        try {
            // Проверяем готовность AuthManager
            if (!window.AuthManager) {
                throw new Error('Система авторизации не готова. Перезагрузите страницу.');
            }

            console.log('📝 Attempting registration for user:', userData.username);
            
            const response = await AuthManager.register(userData);
            
            console.log('✅ Registration successful:', response);

            this.showSuccess('Регистрация прошла успешно!');
              // Перенаправление на страницу входа
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('❌ Registration failed:', error.message);
            this.handleRegistrationError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Обработка ошибок регистрации
    handleRegistrationError(error) {
        let message = 'Ошибка регистрации';

        if (error.message.includes('already exists') || error.message.includes('User already exists')) {
            message = 'Пользователь с таким логином или email уже существует';
        } else if (error.message.includes('Invalid')) {
            message = 'Некорректные данные. Проверьте введенную информацию';
        } else if (error.message.includes('Network')) {
            message = 'Ошибка сети. Проверьте подключение к интернету';
        } else if (error.message) {
            message = error.message;
        }

        this.showError(message);
    }

    // Валидация всех полей
    async validateAllFields() {
        const validations = [
            this.validateFullName(document.getElementById('fullName')),
            this.validateLogin(document.getElementById('login')),
            this.validateEmail(document.getElementById('email')),
            this.validatePhone(document.getElementById('phone')),
            this.validatePassword(document.getElementById('password')),
            this.validateConfirmPassword(document.getElementById('confirmPassword')),
            this.validateRole()
        ];

        // Дополнительные поля для менеджера
        const roleSelect = document.getElementById('role');
        if (roleSelect?.value === 'manager') {
            validations.push(
                this.validateRequired(document.getElementById('department')),
                this.validateRequired(document.getElementById('position')),
                this.validateRequired(document.getElementById('positionCode'))
            );
        }

        const results = await Promise.all(validations);
        return results.every(result => result === true);
    }

    // Валидация ФИО
    validateFullName(field) {
        if (!field) return false;

        const value = field.value.trim();
        const errorId = 'fullNameError';

        if (!value) {
            this.showFieldError(errorId, 'ФИО обязательно для заполнения');
            this.setFieldState(field, 'error');
            return false;
        }

        const nameParts = value.split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length < 2) {
            this.showFieldError(errorId, 'Введите фамилию и имя');
            this.setFieldState(field, 'error');
            return false;
        }

        if (value.length < 5) {
            this.showFieldError(errorId, 'ФИО слишком короткое');
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        return true;
    }

    // Валидация логина
    async validateLogin(field) {
        if (!field) return false;

        const value = field.value.trim();
        const errorId = 'loginError';

        if (!value) {
            this.showFieldError(errorId, 'Логин обязателен для заполнения');
            this.setFieldState(field, 'error');
            return false;
        }

        if (!/^[a-zA-Z0-9_\-]+$/.test(value)) {
            this.showFieldError(errorId, 'Логин может содержать только латинские буквы, цифры, дефис и подчеркивание');
            this.setFieldState(field, 'error');
            return false;
        }

        if (value.length < 3) {
            this.showFieldError(errorId, 'Логин должен содержать не менее 3 символов');
            this.setFieldState(field, 'error');
            return false;
        }

        // Проверка доступности (упрощенная)
        try {
            // Проверяем готовность API
            if (!window.api) {
                this.hideFieldError(errorId);
                this.setFieldState(field, 'success');
                return true; // Пропускаем проверку если API не готов
            }

            this.showFieldError(errorId, 'Проверка доступности...');
            this.setFieldState(field, 'checking');

            // Попытка входа с dummy паролем для проверки существования
            await api.post('/login', { login: value, password: 'dummy_check_12345' });
            
            // Если дошли сюда - пользователь существует
            this.showFieldError(errorId, 'Этот логин уже занят');
            this.setFieldState(field, 'error');
            return false;

        } catch (error) {
            if (error.message.includes('Invalid credentials')) {
                // Логин свободен
                this.hideFieldError(errorId);
                this.showFieldSuccess('loginSuccess', 'Логин доступен');
                this.setFieldState(field, 'success');
                return true;
            } else {
                // Другая ошибка
                this.showFieldError(errorId, 'Ошибка проверки логина');
                this.setFieldState(field, 'error');
                return false;
            }
        }
    }

    // Валидация email
    validateEmail(field) {
        if (!field) return false;

        const value = field.value.trim();
        const errorId = 'emailError';

        if (!value) {
            this.showFieldError(errorId, 'Email обязателен для заполнения');
            this.setFieldState(field, 'error');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            this.showFieldError(errorId, 'Введите корректный email адрес');
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        return true;
    }

    // Валидация телефона
    validatePhone(field) {
        if (!field) return false;

        const value = field.value.replace(/\D/g, '');
        const errorId = 'phoneError';

        if (!value) {
            this.showFieldError(errorId, 'Номер телефона обязателен для заполнения');
            this.setFieldState(field, 'error');
            return false;
        }

        if (value.length !== 11) {
            this.showFieldError(errorId, 'Номер телефона должен содержать 11 цифр');
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        return true;
    }

    // Валидация пароля
    validatePassword(field) {
        if (!field) return false;

        const value = field.value;
        const errorId = 'passwordError';

        if (!value) {
            this.showFieldError(errorId, 'Пароль обязателен для заполнения');
            this.setFieldState(field, 'error');
            return false;
        }

        if (value.length < 6) {
            this.showFieldError(errorId, 'Пароль должен содержать не менее 6 символов');
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        
        // Перепроверяем подтверждение пароля
        const confirmField = document.getElementById('confirmPassword');
        if (confirmField?.value) {
            this.validateConfirmPassword(confirmField);
        }
        
        return true;
    }

    // Валидация подтверждения пароля
    validateConfirmPassword(field) {
        if (!field) return false;

        const value = field.value;
        const password = document.getElementById('password')?.value || '';
        const errorId = 'confirmPasswordError';

        if (!value) {
            this.showFieldError(errorId, 'Подтверждение пароля обязательно');
            this.setFieldState(field, 'error');
            return false;
        }

        if (value !== password) {
            this.showFieldError(errorId, 'Пароли не совпадают');
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        return true;
    }

    // Валидация роли
    validateRole() {
        const roleSelect = document.getElementById('role');
        if (!roleSelect) return false;

        const value = roleSelect.value;
        const errorId = 'roleError';

        if (!value) {
            this.showFieldError(errorId, 'Выберите роль');
            return false;
        }

        this.hideFieldError(errorId);
        return true;
    }

    // Валидация обязательного поля
    validateRequired(field) {
        if (!field) return false;

        const value = field.value.trim();
        const fieldName = field.getAttribute('placeholder') || field.name || 'Поле';
        const errorId = field.id + 'Error';

        if (!value) {
            this.showFieldError(errorId, `${fieldName} обязательно для заполнения`);
            this.setFieldState(field, 'error');
            return false;
        }

        this.hideFieldError(errorId);
        this.setFieldState(field, 'success');
        return true;
    }

    // Обработка смены роли
    handleRoleChange() {
        const roleSelect = document.getElementById('role');
        const managerFields = document.getElementById('managerFields');
        
        if (!roleSelect || !managerFields) return;

        if (roleSelect.value === 'manager') {
            managerFields.classList.add('show');
            // Делаем поля обязательными
            ['department', 'position', 'positionCode'].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.required = true;
            });
        } else {
            managerFields.classList.remove('show');
            // Убираем обязательность и очищаем
            ['department', 'position', 'positionCode'].forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    field.required = false;
                    field.value = '';
                    this.setFieldState(field, 'normal');
                    this.hideFieldError(id + 'Error');
                }
            });
        }
    }

    // Настройка маски телефона
    setupPhoneMask() {
        const phoneField = document.getElementById('phone');
        if (!phoneField) return;

        phoneField.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            
            if (value.startsWith('7')) {
                value = value.slice(0, 11);
                const formatted = value.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
                e.target.value = formatted;
            }
        });
    }

    // Установка состояния поля
    setFieldState(field, state) {
        if (!field) return;

        field.classList.remove('error', 'success', 'checking');
        
        if (state === 'error' || state === 'success' || state === 'checking') {
            field.classList.add(state);
        }
    }

    // Показать ошибку поля
    showFieldError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Скрыть ошибку поля
    hideFieldError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Показать успех поля
    showFieldSuccess(successId, message) {
        const successElement = document.getElementById(successId);
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.add('show');
        }
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

    // Показать общую ошибку
    showError(message) {
        if (window.Utils?.showNotification) {
            Utils.showNotification(message, 'error');
        }
    }

    // Показать общий успех
    showSuccess(message) {
        if (window.Utils?.showNotification) {
            Utils.showNotification(message, 'success');
        }
    }    // Перенаправление на дашборд
    redirectToUserDashboard(role) {
        const dashboardUrls = {
            'admin': 'dashboard-admin.html',
            'manager': 'dashboard-manager.html',
            'user': 'dashboard-user.html'
        };

        const targetUrl = dashboardUrls[role] || dashboardUrls.user;
        window.location.href = targetUrl;
    }

    // Фокус на первое поле
    focusFirstField() {
        setTimeout(() => {
            const firstField = document.getElementById('fullName');
            if (firstField) {
                firstField.focus();
            }
        }, 100);
    }
}

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
    console.log('🔧 Initializing new registration system...');
    
    // Ждем готовности AuthManager
    await waitForAuthManager();
    console.log('✅ AuthManager ready, starting registration system');
    
    window.registerManager = new RegisterManager();
});