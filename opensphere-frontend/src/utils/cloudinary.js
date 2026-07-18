const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const getResourceType = (file) => {
  const type = file.type || '';
  const name = file.name?.toLowerCase() || '';

  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';

  // PDFs and all other docs → raw
  if (
    type === 'application/pdf' ||
    type.includes('document') ||
    type.includes('spreadsheet') ||
    type.includes('presentation') ||
    name.endsWith('.pdf') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    name.endsWith('.csv') ||
    name.endsWith('.zip') ||
    name.endsWith('.rar')
  ) return 'raw';

  return 'auto';
};

export const uploadToCloudinary = async (file) => {
  const resourceType = getResourceType(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    format: data.format,
    originalName: file.name,
    size: file.size,
  };
};

export const getFileIcon = (format) => {
  if (!format) return '📄';
  const f = format.toLowerCase();
  if (f === 'pdf') return '📕';
  if (['doc', 'docx'].includes(f)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(f)) return '📊';
  if (['ppt', 'pptx'].includes(f)) return '📋';
  if (['mp4', 'mov', 'avi', 'webm'].includes(f)) return '🎬';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f)) return '🖼️';
  if (['zip', 'rar', '7z'].includes(f)) return '🗜️';
  return '📄';
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};