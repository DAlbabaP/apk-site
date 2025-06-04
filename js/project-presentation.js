// Скрипты из project-presentation.html
// Извлечено автоматически - 2025-05-31 09:05
// Подключите common.js для базовых утилит

// Блок скриптов #1
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function updateSlideCounter() {
    const activeSlide = document.querySelector('.slide.active');
    if (activeSlide) {
        const counter = activeSlide.querySelector('.slide-counter');
        if (counter) {
            counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        }
    }
}

function showSlide(n) {
    // Убираем active с текущего слайда
    slides[currentSlide].classList.remove('active');
    
    // Вычисляем новый индекс слайда
    currentSlide = (n + totalSlides) % totalSlides;
    
    // Добавляем active к новому слайду
    slides[currentSlide].classList.add('active');
    
    // Обновляем счетчик
    updateSlideCounter();
    
    // Обновляем индикаторы
    updateIndicators();
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
        });        // Добавляем индикаторы слайдов
        let indicators = null;
        
        function updateIndicators() {
            if (indicators) {
                Array.from(indicators.children).forEach((dot, index) => {
                    dot.style.backgroundColor = index === currentSlide ? 'var(--primary-color)' : 'var(--gray-light)';
                });
            }
        }
        
        function createSlideIndicators() {
            const navigation = document.querySelector('.navigation');
            if (!navigation) return;
            
            indicators = document.createElement('div');
            indicators.className = 'slide-indicators';
            indicators.style.display = 'flex';
            indicators.style.gap = '0.5rem';
            indicators.style.margin = '0 1rem';
            indicators.style.alignItems = 'center';
            
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('div');
                dot.className = 'indicator-dot';
                dot.style.width = '10px';
                dot.style.height = '10px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = i === 0 ? 'var(--primary-color)' : 'var(--gray-light)';
                dot.style.cursor = 'pointer';
                dot.style.transition = 'all 0.3s ease';
                dot.addEventListener('click', () => showSlide(i));
                indicators.appendChild(dot);
            }
            
            // Вставляем индикаторы между кнопками
            const nextBtn = navigation.querySelector('.nav-btn.primary');
            navigation.insertBefore(indicators, nextBtn);
        }        // Инициализация
        document.addEventListener('DOMContentLoaded', function() {
            createSlideIndicators();
            updateSlideCounter();
        });
