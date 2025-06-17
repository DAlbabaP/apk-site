// Общие JavaScript утилиты для всего проекта
// Обновлено для работы с API - 2025-06-16

// API Configuration and Utilities
const API_CONFIG = {
    baseURL: '',
    endpoints: {
        auth: {
            login: '/api/login.php',
            register: '/api/users.php'
        },
        users: '/api/users.php',
        applications: '/api/applications.php', 
        products: '/api/products.php',
        sets: '/api/sets.php',
        stats: '/api/stats.php'
    }
};

// API Client class for handling HTTP requests
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Get default headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const url = new URL(this.baseURL + endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Global API client instance
const api = new APIClient();
// Делаем api доступным глобально
window.api = api;

// Authentication utilities
const AuthManager = {    // Login user
    async login(credentials) {
        try {
            console.log('AuthManager.login called with:', credentials);
            console.log('API endpoint:', API_CONFIG.endpoints.auth.login);
            
            const response = await api.post(API_CONFIG.endpoints.auth.login, credentials);
            console.log('API response:', response);
            
            if (response.success) {
                api.setToken(response.token);
                localStorage.setItem('current_user', JSON.stringify(response.user));
                return response;
            }
            
            throw new Error(response.error || 'Login failed');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // Register user
    async register(userData) {
        try {
            const response = await api.post(API_CONFIG.endpoints.auth.register, userData);
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },    // Logout user
    logout() {
        api.setToken(null);
        localStorage.removeItem('current_user');
        localStorage.removeItem('auth_token');
        // Очищаем также старые ключи для избежания конфликтов
        localStorage.removeItem('currentSession'); 
        localStorage.removeItem('users'); 
        localStorage.removeItem('requests');
        window.location.href = 'login.html';
    },

    // Get current user
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('current_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            // Очищаем поврежденные данные
            localStorage.removeItem('current_user');
            return null;
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getCurrentUser() && !!localStorage.getItem('auth_token');
    },

    // Check user role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        const user = this.getCurrentUser();
        return user && roles.includes(user.role);
    }
};

// Делаем AuthManager доступным глобально
window.AuthManager = AuthManager;

// Applications API
const ApplicationsAPI = {
    // Get all applications
    async getAll(filters = {}) {
        return api.get(API_CONFIG.endpoints.applications, filters);
    },

    // Create new application
    async create(applicationData) {
        return api.post(API_CONFIG.endpoints.applications, applicationData);
    },

    // Update application
    async update(id, applicationData) {
        return api.put(`${API_CONFIG.endpoints.applications}?id=${id}`, applicationData);
    },

    // Delete application
    async delete(id) {
        return api.delete(`${API_CONFIG.endpoints.applications}?id=${id}`);
    },

    // Get application by ID
    async getById(id) {
        return api.get(`${API_CONFIG.endpoints.applications}?id=${id}`);
    }
};

// Products API
const ProductsAPI = {
    async getAll() {
        return api.get(API_CONFIG.endpoints.products);
    },

    async create(productData) {
        return api.post(API_CONFIG.endpoints.products, productData);
    },

    async update(id, productData) {
        return api.put(`${API_CONFIG.endpoints.products}?id=${id}`, productData);
    },

    async delete(id) {
        return api.delete(`${API_CONFIG.endpoints.products}?id=${id}`);
    }
};

// Users API
const UsersAPI = {
    // Get all users (admin only)
    async getAll(filters = {}) {
        return api.get(API_CONFIG.endpoints.users, filters);
    },

    // Create new user (admin only)
    async create(userData) {
        return api.post(API_CONFIG.endpoints.users, userData);
    },

    // Update user (admin only)
    async update(id, userData) {
        return api.put(`${API_CONFIG.endpoints.users}?id=${id}`, userData);
    },

    // Delete user (admin only)
    async delete(id) {
        return api.delete(`${API_CONFIG.endpoints.users}?id=${id}`);
    },    // Get current user profile
    async getProfile() {
        return api.get(`${API_CONFIG.endpoints.users}?action=profile`);
    },

    // Update current user profile
    async updateProfile(userData) {
        return api.put(`${API_CONFIG.endpoints.users}?action=profile`, userData);
    }
};

// Stats API
const StatsAPI = {
    // Get dashboard statistics
    async getDashboardStats() {
        return api.get(API_CONFIG.endpoints.stats);
    },

    // Get admin statistics
    async getAdminStats() {
        return api.get(API_CONFIG.endpoints.stats + '?type=admin');
    },

    // Get manager statistics
    async getManagerStats() {
        return api.get(API_CONFIG.endpoints.stats + '?type=manager');
    },

    // Get user statistics
    async getUserStats() {
        return api.get(API_CONFIG.endpoints.stats + '?type=user');
    }
};

// DOM and Display utilities
const Utils = {
    // Плавная прокрутка к элементу
    scrollTo(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            const top = element.offsetTop - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    },

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    },

    // Format currency
    formatCurrency(amount) {
        if (!amount) return '0 ₽';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    },

    // Get status display text
    getStatusText(status) {
        const statusMap = {
            'pending': 'В ожидании',
            'in_progress': 'В работе',
            'completed': 'Выполнено',
            'cancelled': 'Отменено'
        };
        return statusMap[status] || status;
    },

    // Get priority display text
    getPriorityText(priority) {
        const priorityMap = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'urgent': 'Срочный'
        };
        return priorityMap[priority] || priority;
    },

    // Get category display text
    getCategoryText(category) {
        const categoryMap = {
            'seeds': 'Семена',
            'fertilizers': 'Удобрения',
            'equipment': 'Оборудование',
            'consultation': 'Консультация',
            'other': 'Прочее'
        };
        return categoryMap[category] || category;
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                }
                .notification-info { background-color: #2196F3; }
                .notification-success { background-color: #4CAF50; }
                .notification-warning { background-color: #FF9800; }
                .notification-error { background-color: #F44336; }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Добавление класса с анимацией
    addClass(element, className, delay = 0) {
        setTimeout(() => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (element) {
                element.classList.add(className);
            }
        }, delay);
    },

    // Удаление класса
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.remove(className);
        }
    },

    // Переключение класса
    toggleClass(element, className) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.toggle(className);
        }
    }
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем API модули в window.api после загрузки всех классов
    window.api.users = UsersAPI;
    window.api.applications = ApplicationsAPI;
    window.api.products = ProductsAPI;
    window.api.stats = StatsAPI;
    
    console.log('✅ API modules initialized:', Object.keys(window.api));
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Current page:', currentPage);
    
    // Только для публичных страниц - никаких проверок авторизации
    // Дашборды сами проверяют свою авторизацию
    const publicPages = ['login.html', 'register.html', 'index.html', 'simple-login.html', 'test-api.html'];
    if (publicPages.includes(currentPage)) {
        console.log('✅ Public page detected, no auth check needed');
        return;
    }
    
    // Для защищенных страниц только логируем, но не перенаправляем
    // Сами страницы должны выполнять свои проверки
    console.log('🔍 Protected page detected:', currentPage);
    console.log('🔐 Auth status:', AuthManager.isAuthenticated());
});
