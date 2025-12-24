// Скрипты из login.html
// Обновлено для работы с API и SQLite БД

// Система авторизации через API
class AuthSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.apiBase = '/ApkSite/api';
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
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
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

            // Отправляем запрос на API
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showError(data.error || 'Ошибка входа');
                return;
            }

            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Создаём сессию для совместимости
            const session = {
                userId: data.user.id,
                login: data.user.login,
                fullName: data.user.full_name,
                role: data.user.role,
                token: data.token,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('currentSession', JSON.stringify(session));
            sessionStorage.setItem('isLoggedIn', 'true');
            
            this.showNotification('Вход выполнен успешно! Перенаправление...', 'success');
            
            // Перенаправление в зависимости от роли
            setTimeout(() => {
                this.redirectToDashboard(data.user.role);
            }, 1000);

        } catch (error) {
            this.showError('Ошибка сети. Проверьте подключение к серверу');
            console.error('Login error:', error);
        } finally {
            submitBtn.disabled = false;
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
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

    // Показ ошибки
    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        // Подсвечиваем поля
        document.getElementById('login')?.classList.add('error');
        document.getElementById('password')?.classList.add('error');
    }

    // Скрытие ошибки
    hideError() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
        
        // Убираем подсветку
        document.getElementById('login')?.classList.remove('error');
        document.getElementById('password')?.classList.remove('error');
    }

    // Показ уведомлений
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');

            setTimeout(() => {
                notification.classList.remove('show');
            }, 4000);
        }
    }
}

// Проверка сессии при загрузке
function checkExistingSession() {
    try {
        const token = localStorage.getItem('token');
        const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
        
        if (token && session && new Date(session.expiresAt) > new Date()) {
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
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
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
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');
        
        // Заполняем поля
        loginInput.value = credentials[0].trim();
        passwordInput.value = credentials[1].trim();
        
        // Убираем классы ошибок и успеха, если они есть
        loginInput.classList.remove('error', 'success');
        passwordInput.classList.remove('error', 'success');
        
        // Скрываем сообщения об ошибках
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
        
        // Фокусируемся на поле логина
        loginInput.focus();
    });
});
