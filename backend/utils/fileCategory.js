const getFileCategory = (mimeType = '', fileName = '') => {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  if (normalizedMime.startsWith('image/')) {
    return 'image';
  }

  if (
    normalizedMime.includes('pdf') ||
    normalizedMime.includes('document') ||
    normalizedMime.includes('text') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx') ||
    normalizedName.endsWith('.pdf') ||
    normalizedName.endsWith('.txt')
  ) {
    return 'document';
  }

  if (
    normalizedMime.includes('json') ||
    normalizedMime.includes('sql') ||
    normalizedName.endsWith('.json') ||
    normalizedName.endsWith('.bson') ||
    normalizedName.endsWith('.sql') ||
    normalizedName.endsWith('.dump')
  ) {
    return 'database';
  }

  return 'other';
};

module.exports = { getFileCategory };
