const bcrypt = require('bcryptjs');

// Создаём новый хеш
const newHash = bcrypt.hashSync('admin123', 12);
console.log('New hash:', newHash);
console.log('New hash compare:', bcrypt.compareSync('admin123', newHash));

// Проверим старый хеш
const oldHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6K';
console.log('Old hash:', oldHash);
console.log('Old hash compare:', bcrypt.compareSync('admin123', oldHash));

// Проверим совместимость - может проблема в префиксе $2b$ vs $2a$
const oldHash2 = oldHash.replace('$2b$', '$2a$');
console.log('Old hash with $2a$:', oldHash2);
console.log('Old hash with $2a$ compare:', bcrypt.compareSync('admin123', oldHash2));
