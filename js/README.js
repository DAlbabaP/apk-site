// Скрипты из README.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
function toggleFaq(element) {
            const answer = element.nextElementSibling;
            const arrow = element.querySelector('span:last-child');
            
            if (answer.classList.contains('active')) {
                answer.classList.remove('active');
                arrow.textContent = '▼';
            } else {
                // Закрываем все другие FAQ
                document.querySelectorAll('.faq-answer').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelectorAll('.faq-question span:last-child').forEach(arrow => {
                    arrow.textContent = '▼';
                });
                
                // Открываем текущий
                answer.classList.add('active');
                arrow.textContent = '▲';
            }
        }

        // Автоматическое обновление статистики
        function updateStats() {
            try {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const requests = JSON.parse(localStorage.getItem('requests') || '[]');
                const products = JSON.parse(localStorage.getItem('agro_products') || '[]');
                
                console.log(`Статистика системы:
                - Пользователей: ${users.length}
                - Заявок: ${requests.length}
                - Товаров: ${products.length}`);
            } catch (error) {
                console.log('Данные системы пока не созданы');
            }
        }

        // Проверяем статистику при загрузке
        document.addEventListener('DOMContentLoaded', updateStats);
