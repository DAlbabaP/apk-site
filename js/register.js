// Скрипты из register.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
// Система валидации и регистрации
        class RegistrationSystem {
            constructor() {
                this.form = document.getElementById('registerForm');
                this.initEventListeners();
                this.existingUsers = this.getExistingUsers();
            }

            initEventListeners() {
                // Обработка отправки формы
                this.form.addEventListener('submit', (e) => this.handleSubmit(e));

                // Валидация в реальном времени
                document.getElementById('fullName').addEventListener('input', (e) => this.validateFullName(e.target));
                document.getElementById('login').addEventListener('input', (e) => this.validateLogin(e.target));
                document.getElementById('phone').addEventListener('input', (e) => this.validatePhone(e.target));
                document.getElementById('email').addEventListener('input', (e) => this.validateEmail(e.target));
                document.getElementById('password').addEventListener('input', (e) => this.validatePassword(e.target));
                document.getElementById('confirmPassword').addEventListener('input', (e) => this.validateConfirmPassword(e.target));
                document.getElementById('role').addEventListener('change', (e) => this.handleRoleChange(e.target));

                // Дополнительные поля для менеджера
                document.getElementById('department').addEventListener('input', (e) => this.validateDepartment(e.target));
                document.getElementById('position').addEventListener('input', (e) => this.validatePosition(e.target));
                document.getElementById('positionCode').addEventListener('input', (e) => this.validatePositionCode(e.target));

                // Маска для телефона
                document.getElementById('phone').addEventListener('input', (e) => this.formatPhone(e.target));
            }

            getExistingUsers() {
                try {
                    return JSON.parse(localStorage.getItem('users') || '[]');
                } catch {
                    return [];
                }
            }

            // Валидация ФИО
            validateFullName(input) {
                const value = input.value.trim();
                const regex = /^[а-яёА-ЯЁ\s\-]+$/;
                
                if (!value) {
                    this.showError('fullNameError', 'ФИО обязательно для заполнения');
                    input.classList.add('error');
                    return false;
                }
                
                if (!regex.test(value)) {
                    this.showError('fullNameError', 'ФИО должно содержать только кириллицу, дефис и пробелы');
                    input.classList.add('error');
                    return false;
                }

                if (value.length < 2) {
                    this.showError('fullNameError', 'ФИО слишком короткое');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('fullNameError');
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Валидация логина
            async validateLogin(input) {
                const value = input.value.trim();
                const regex = /^[a-zA-Z\-]+$/;
                
                if (!value) {
                    this.showError('loginError', 'Логин обязателен для заполнения');
                    input.classList.add('error');
                    return false;
                }
                
                if (!regex.test(value)) {
                    this.showError('loginError', 'Логин должен содержать только латинские буквы и дефис');
                    input.classList.add('error');
                    return false;
                }

                if (value.length < 3) {
                    this.showError('loginError', 'Логин должен содержать не менее 3 символов');
                    input.classList.add('error');
                    return false;
                }

                // Проверка уникальности (имитация серверной проверки)
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const isUnique = !this.existingUsers.some(user => user.login === value);
                
                if (!isUnique) {
                    this.showError('loginError', 'Этот логин уже занят');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('loginError');
                this.showSuccess('loginSuccess', 'Логин доступен');
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Валидация телефона
            validatePhone(input) {
                const value = input.value.replace(/\D/g, '');
                
                if (!value) {
                    this.showError('phoneError', 'Номер телефона обязателен для заполнения');
                    input.classList.add('error');
                    return false;
                }
                
                if (value.length !== 11) {
                    this.showError('phoneError', 'Номер телефона должен содержать 11 цифр');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('phoneError');
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Форматирование телефона
            formatPhone(input) {
                let value = input.value.replace(/\D/g, '');
                
                if (value.startsWith('8')) {
                    value = '7' + value.slice(1);
                }
                
                if (value.startsWith('7')) {
                    value = value.slice(0, 11);
                    const formatted = value.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
                    input.value = formatted;
                } else if (value.length > 0) {
                    input.value = '+7 (' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 8) + '-' + value.slice(8, 10);
                }
            }

            // Валидация email
            validateEmail(input) {
                const value = input.value.trim();
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (!value) {
                    this.showError('emailError', 'Email обязателен для заполнения');
                    input.classList.add('error');
                    return false;
                }
                
                if (!regex.test(value)) {
                    this.showError('emailError', 'Введите корректный email адрес');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('emailError');
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Валидация пароля
            validatePassword(input) {
                const value = input.value;
                
                if (!value) {
                    this.showError('passwordError', 'Пароль обязателен для заполнения');
                    input.classList.add('error');
                    return false;
                }
                
                if (value.length < 6) {
                    this.showError('passwordError', 'Пароль должен содержать не менее 6 символов');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('passwordError');
                input.classList.remove('error');
                input.classList.add('success');
                
                // Перепроверяем подтверждение пароля
                const confirmInput = document.getElementById('confirmPassword');
                if (confirmInput.value) {
                    this.validateConfirmPassword(confirmInput);
                }
                
                return true;
            }

            // Валидация подтверждения пароля
            validateConfirmPassword(input) {
                const value = input.value;
                const password = document.getElementById('password').value;
                
                if (!value) {
                    this.showError('confirmPasswordError', 'Подтверждение пароля обязательно');
                    input.classList.add('error');
                    return false;
                }
                
                if (value !== password) {
                    this.showError('confirmPasswordError', 'Пароли не совпадают');
                    input.classList.add('error');
                    return false;
                }

                this.hideError('confirmPasswordError');
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Обработка смены роли
            handleRoleChange(select) {
                const managerFields = document.getElementById('managerFields');
                
                if (select.value === 'manager') {
                    managerFields.classList.add('show');
                    // Делаем поля обязательными
                    ['department', 'position', 'positionCode'].forEach(id => {
                        document.getElementById(id).required = true;
                    });
                } else {
                    managerFields.classList.remove('show');
                    // Убираем обязательность
                    ['department', 'position', 'positionCode'].forEach(id => {
                        const input = document.getElementById(id);
                        input.required = false;
                        input.value = '';
                        input.classList.remove('error', 'success');
                        this.hideError(id + 'Error');
                    });
                }
            }

            // Валидация дополнительных полей
            validateDepartment(input) {
                return this.validateRequiredText(input, 'departmentError', 'Участок обязателен для заполнения');
            }

            validatePosition(input) {
                return this.validateRequiredText(input, 'positionError', 'Должность обязательна для заполнения');
            }

            validatePositionCode(input) {
                return this.validateRequiredText(input, 'positionCodeError', 'Код должности обязателен для заполнения');
            }

            validateRequiredText(input, errorId, message) {
                const value = input.value.trim();
                
                if (!value) {
                    this.showError(errorId, message);
                    input.classList.add('error');
                    return false;
                }

                this.hideError(errorId);
                input.classList.remove('error');
                input.classList.add('success');
                return true;
            }

            // Обработка отправки формы
            async handleSubmit(e) {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const loadingSpinner = document.getElementById('loadingSpinner');
                
                // Показываем индикатор загрузки
                submitBtn.disabled = true;
                if (loadingSpinner) loadingSpinner.style.display = 'inline-block';

                try {
                    // Валидация всех полей
                    const isValid = await this.validateAllFields();
                    
                    if (!isValid) {
                        this.showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
                        return;
                    }

                    // Отправка на API
                    await this.registerUser();

                } catch (error) {
                    this.showNotification('Произошла ошибка при регистрации: ' + error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                }
            }

            // Валидация всех полей
            async validateAllFields() {
                const fields = [
                    () => this.validateFullName(document.getElementById('fullName')),
                    () => this.validateLogin(document.getElementById('login')),
                    () => this.validatePhone(document.getElementById('phone')),
                    () => this.validateEmail(document.getElementById('email')),
                    () => this.validatePassword(document.getElementById('password')),
                    () => this.validateConfirmPassword(document.getElementById('confirmPassword'))
                ];

                const role = document.getElementById('role').value;
                if (!role) {
                    this.showError('roleError', 'Выберите статус');
                    return false;
                }
                this.hideError('roleError');

                // Дополнительные поля для менеджера
                if (role === 'manager') {
                    fields.push(
                        () => this.validateDepartment(document.getElementById('department')),
                        () => this.validatePosition(document.getElementById('position')),
                        () => this.validatePositionCode(document.getElementById('positionCode'))
                    );
                }

                // Выполняем все проверки
                const results = await Promise.all(fields.map(fn => fn()));
                return results.every(result => result);
            }

            // Регистрация пользователя через API
            async registerUser() {
                const formData = new FormData(this.form);
                const userData = {
                    full_name: formData.get('fullName').trim(),
                    login: formData.get('login').trim(),
                    phone: formData.get('phone').replace(/\D/g, ''),
                    email: formData.get('email').trim(),
                    password: formData.get('password'),
                    role: formData.get('role')
                };

                const response = await fetch('/ApkSite/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Ошибка регистрации');
                }

                this.showNotification('Регистрация прошла успешно! Перенаправление...', 'success');
                
                // Перенаправление на страницу входа
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }

            // Сохранение пользователя (устаревший метод, оставлен для совместимости)
            saveUser() {
                // Теперь используется registerUser() для работы с API
                console.warn('saveUser() is deprecated, use registerUser() instead');
            }

            // Создание администратора по умолчанию
            createDefaultAdmin() {
                const hasAdmin = this.existingUsers.some(user => user.login === 'admin');
                
                if (!hasAdmin) {
                    const adminUser = {
                        id: this.generateId(),
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

                    this.existingUsers.push(adminUser);
                    localStorage.setItem('users', JSON.stringify(this.existingUsers));
                }
            }

            // Генерация ID
            generateId() {
                return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            // Простое хеширование пароля
            hashPassword(password) {
                // В реальном приложении использовать bcrypt
                let hash = 0;
                for (let i = 0; i < password.length; i++) {
                    const char = password.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return 'hashed_' + Math.abs(hash).toString(36);
            }

            // Утилиты для работы с сообщениями
            showError(elementId, message) {
                const element = document.getElementById(elementId);
                element.textContent = message;
                element.classList.add('show');
            }

            hideError(elementId) {
                const element = document.getElementById(elementId);
                element.textContent = '';
                element.classList.remove('show');
            }

            showSuccess(elementId, message) {
                const element = document.getElementById(elementId);
                element.textContent = message;
                element.classList.add('show');
            }

            showNotification(message, type = 'success') {
                const notification = document.getElementById('notification');
                notification.textContent = message;
                notification.className = `notification ${type}`;
                notification.classList.add('show');

                setTimeout(() => {
                    notification.classList.remove('show');
                }, 5000);
            }
        }

        // Инициализация системы регистрации
        document.addEventListener('DOMContentLoaded', () => {
            new RegistrationSystem();
        });
