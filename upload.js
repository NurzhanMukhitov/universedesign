const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: 'dxkkbif27',
  api_key: '361952828639262',
  api_secret: 'Qpc44kAiKxYsBHZzE0mLMT4Py38'
});

// Функция для загрузки файла на Cloudinary
async function uploadToCloudinary(filePath, publicId, folderName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: folderName,
      overwrite: true,
      resource_type: 'auto'
    });
    console.log('Uploaded:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// Функция для обновления meta.json файла проекта
function updateProjectMeta(projectId, coverUrl, galleryUrls) {
  const metaFilePath = `projects/project_${projectId}/meta.json`;
  let metaData = {};

  // Читаем текущий meta.json файл, если он существует
  if (fs.existsSync(metaFilePath)) {
    const metaJson = fs.readFileSync(metaFilePath, 'utf8');
    metaData = JSON.parse(metaJson);
  }

  // Обновляем URL'ы изображений
  metaData.coverUrl = coverUrl;
  metaData.galleryUrls = galleryUrls;

  // Сохраняем обновленный meta.json файл
  const updatedMetaJson = JSON.stringify(metaData, null, 2);
  fs.writeFileSync(metaFilePath, updatedMetaJson);
}

// Главная функция для загрузки изображений проекта
async function uploadProjectImages(projectId) {
  const projectDir = `projects/project_${projectId}`;
  const coverFileName = 'cover.jpg';
  const coverFilePath = path.join(projectDir, 'covers', coverFileName);
  const galleryDir = path.join(projectDir, 'gallery');

  // Загружаем обложку проекта
  const coverUrl = await uploadToCloudinary(coverFilePath, `project_${projectId}_cover`, `project_${projectId}/covers`);

  // Загружаем галерейные изображения проекта
  const galleryFiles = fs.readdirSync(galleryDir);
  const galleryUrls = await Promise.all(
    galleryFiles.map(async (fileName, index) => {
      const filePath = path.join(galleryDir, fileName);
      const publicId = `project_${projectId}_gallery_${index + 1}`;
      const url = await uploadToCloudinary(filePath, publicId, `project_${projectId}/gallery`);
      return url;
    })
  );

  // Обновляем meta.json файл проекта
  updateProjectMeta(projectId, coverUrl, galleryUrls);
}

// Пример использования
(async () => {
  console.log('Uploading images for project 1...');
  await uploadProjectImages(1);
})(); 