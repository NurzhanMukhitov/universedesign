const cloudinaryConfig = {
    cloudName: 'dxkkbif27',
    uploadPreset: 'universedesign_preset',
    folder: 'universedesign',
    
    // Настройки для изображений проектов
    projectImageTransforms: {
        cover: {
            width: 640,
            height: 360,
            crop: 'fill',
            quality: 'auto',
            format: 'auto',
        },
        gallery: {
            width: 1920,
            height: 1080,
            crop: 'fill',
            quality: 'auto',
            format: 'auto',
        }
    }
};

// Функция для получения URL изображения с трансформациями
function getCloudinaryUrl(publicId, transform) {
    const { width, height, crop, quality, format } = transform;
    return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/c_${crop},w_${width},h_${height},q_${quality},f_${format}/${publicId}`;
}

// Функция для загрузки изображения
function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const uploadWidget = window.cloudinary.createUploadWidget({
            cloudName: cloudinaryConfig.cloudName,
            uploadPreset: cloudinaryConfig.uploadPreset,
            folder: cloudinaryConfig.folder,
            sources: ['local'],
            multiple: false
        }, (error, result) => {
            if (error) {
                console.error('Upload error:', error);
                reject(error);
                return;
            }
            if (result.event === 'success') {
                console.log('Upload success:', result.info);
                resolve(result.info);
            }
        });
        
        uploadWidget.open();
    });
}

// Экспортируем конфигурацию и функции
window.cloudinaryConfig = cloudinaryConfig;
window.getCloudinaryUrl = getCloudinaryUrl;
window.uploadToCloudinary = uploadToCloudinary; 