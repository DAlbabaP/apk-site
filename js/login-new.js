// Система авторизации для работы с API
// Обновлено для работы с базой данных - 2025-06-16

class AuthSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Убираем ошибки при вводе
        document.getElementById('login').addEventListener('input', () => this.hideError());
        document.getElementById('password').addEventListener('input', () => this.hideError());
    }

    // Обработка входа через API
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
            const credentials = {
                login: formData.get('login').trim(),
                password: formData.get('password')
            };

            // Валидация
            if (!credentials.login || !credentials.password) {
                this.showError('Заполните все поля');
                return;
            }

            // Авторизация через API
            const response = await AuthManager.login(credentials);
            
            this.showNotification('Вход выполнен успешно! Перенаправление...', 'success');
            
            // Перенаправление в зависимости от роли
            setTimeout(() => {
                this.redirectToDashboard(response.user.role);
            }, 1500);

        } catch (error) {
            this.showError(error.message || 'Произошла ошибка при входе. Попробуйте еще раз');
        } finally {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    // Перенаправление на дашборд в зависимости от роли
    redirectToDashboard(role) {
        const dashboards = {
            'admin': 'dashboard-admin.html',
            'manager': 'dashboard-manager.html', 
            'user': 'dashboard-user.html'
        };
        
        window.location.href = dashboards[role] || 'dashboard-user.html';
    }

    // Показать ошибку
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Скрыть ошибку
    hideError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }

    // Показать уведомление
    showNotification(message, type = 'success') {
        Utils.showNotification(message, type);
    }
}

// Быстрый вход для тестирования
function quickLogin(role) {
    const credentials = {
        'admin': { login: 'admin', password: 'password' },
        'manager': { login: 'manager', password: 'password' },
        'user': { login: 'user', password: 'password' }
    };
    
    if (credentials[role]) {
        document.getElementById('login').value = credentials[role].login;
        document.getElementById('password').value = credentials[role].password;
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
}

// Инициализация системы авторизации
document.addEventListener('DOMContentLoaded', () => {
    const authSystem = new AuthSystem();
    
    // Добавляем кнопки быстрого входа для демо
    const quickLoginHTML = `
        <div class="quick-login" style="margin-top: 20px; text-align: center;">
            <p style="font-size: 14px; color: #666;">Быстрый вход для демо:</p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button type="button" onclick="quickLogin('admin')" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Админ</button>
                <button type="button" onclick="quickLogin('manager')" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Менеджер</button>
                <button type="button" onclick="quickLogin('user')" style="padding: 5px 10px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">Пользователь</button>
            </div>
        </div>
    `;
    
    const form = document.getElementById('loginForm');
    if (form) {
        form.insertAdjacentHTML('afterend', quickLoginHTML);
    }
});

// Проверка, если пользователь уже авторизован
if (AuthManager.isAuthenticated()) {
    const user = AuthManager.getCurrentUser();
    if (user) {
        const dashboards = {
            'admin': 'dashboard-admin.html',
            'manager': 'dashboard-manager.html',
            'user': 'dashboard-user.html'
        };
        window.location.href = dashboards[user.role] || 'dashboard-user.html';
    }
}
