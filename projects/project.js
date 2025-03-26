document.addEventListener('DOMContentLoaded', function() {
    console.log("Project page JavaScript is running!");
    
    // Показываем меню и логотип при загрузке
    var menuBtn = document.querySelector('.menu-btn');
    var logoText = document.querySelector('.logo-text');
    
    setTimeout(function() {
        if (menuBtn) menuBtn.classList.add('visible');
        if (logoText) logoText.classList.add('visible');
    }, 500);
    
    // Обработчики для галереи
    const galleryImages = document.querySelectorAll('.gallery-image');
    let currentImageIndex = 0;
    const fullscreenView = document.querySelector('.fullscreen-view');
    const fullscreenMedia = document.querySelector('.fullscreen-media');
    const closeBtn = document.querySelector('.close-fullscreen');
    const nextBtn = document.querySelector('.next-fullscreen');
    
    // Открытие полноэкранного просмотра
    function openFullscreen(index) {
        currentImageIndex = index;
        const img = galleryImages[index].cloneNode();
        fullscreenMedia.innerHTML = '';
        fullscreenMedia.appendChild(img);
        fullscreenView.classList.add('active');
    }
    
    // Закрытие полноэкранного просмотра
    function closeFullscreen() {
        fullscreenView.classList.remove('active');
    }
    
    // Показ следующего изображения
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        const img = galleryImages[currentImageIndex].cloneNode();
        fullscreenMedia.innerHTML = '';
        fullscreenMedia.appendChild(img);
    }
    
    // Показ предыдущего изображения
    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        const img = galleryImages[currentImageIndex].cloneNode();
        fullscreenMedia.innerHTML = '';
        fullscreenMedia.appendChild(img);
    }
    
    // Добавляем обработчики событий
    if (galleryImages.length > 0) {
        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => openFullscreen(index));
        });
        
        if (closeBtn) closeBtn.addEventListener('click', closeFullscreen);
        if (nextBtn) nextBtn.addEventListener('click', showNextImage);
        
        // Обработка клавиш
        document.addEventListener('keydown', function(e) {
            if (fullscreenView && fullscreenView.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeFullscreen();
                } else if (e.key === 'ArrowRight') {
                    showNextImage();
                } else if (e.key === 'ArrowLeft') {
                    showPrevImage();
                }
            }
        });
        
        // Обработка свайпов
        if (fullscreenView) {
            let touchStartX = 0;
            fullscreenView.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            fullscreenView.addEventListener('touchend', function(e) {
                const touchEndX = e.changedTouches[0].screenX;
                const diff = touchEndX - touchStartX;
                
                if (Math.abs(diff) > 50) { // Минимальное расстояние для свайпа
                    if (diff > 0) {
                        showPrevImage(); // Свайп вправо - предыдущее изображение
                    } else {
                        showNextImage(); // Свайп влево - следующее изображение
                    }
                }
            }, { passive: true });
        }
    }
}); 