// Скрипты из project-presentation.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;

        function showSlide(n) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (n + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');
            
            // Обновляем счетчик
            document.querySelector('.slide.active .slide-counter').textContent = `${currentSlide + 1} / ${totalSlides}`;
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function previousSlide() {
            showSlide(currentSlide - 1);
        }

        // Клавиатурная навигация
        document.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowRight' || event.key === ' ') {
                nextSlide();
            } else if (event.key === 'ArrowLeft') {
                previousSlide();
            } else if (event.key === 'Home') {
                showSlide(0);
            } else if (event.key === 'End') {
                showSlide(totalSlides - 1);
            }
        });

        // Автопереключение слайдов (опционально)
        let autoSlide = false;
        if (autoSlide) {
            setInterval(() => {
                nextSlide();
            }, 15000); // 15 секунд на слайд
        }

        // Gesture support для мобильных устройств
        let startX = null;
        let startY = null;

        document.addEventListener('touchstart', function(event) {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
        });

        document.addEventListener('touchend', function(event) {
            if (startX === null || startY === null) return;
            
            let endX = event.changedTouches[0].clientX;
            let endY = event.changedTouches[0].clientY;
            
            let diffX = startX - endX;
            let diffY = startY - endY;
            
            // Проверяем, что это горизонтальный свайп
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 50) {
                    nextSlide(); // Свайп влево - следующий слайд
                } else if (diffX < -50) {
                    previousSlide(); // Свайп вправо - предыдущий слайд
                }
            }
            
            startX = null;
            startY = null;
        });

        // Добавляем индикаторы слайдов
        function createSlideIndicators() {
            const navigation = document.querySelector('.navigation');
            const indicators = document.createElement('div');
            indicators.style.display = 'flex';
            indicators.style.gap = '0.5rem';
            indicators.style.margin = '0 1rem';
            
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('div');
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = i === 0 ? 'var(--primary-color)' : 'var(--gray-light)';
                dot.style.cursor = 'pointer';
                dot.addEventListener('click', () => showSlide(i));
                indicators.appendChild(dot);
            }
            
            navigation.insertBefore(indicators, navigation.children[1]);
            
            // Обновляем индикаторы при смене слайда
            const originalShowSlide = showSlide;
            showSlide = function(n) {
                originalShowSlide.call(this, n);
                indicators.children.forEach((dot, index) => {
                    dot.style.backgroundColor = index === currentSlide ? 'var(--primary-color)' : 'var(--gray-light)';
                });
            };
        }

        // Инициализация
        document.addEventListener('DOMContentLoaded', function() {
            createSlideIndicators();
        });
