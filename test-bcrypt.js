const bcrypt = require('bcryptjs');
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6K';
console.log('Hash:', hash);
console.log('Compare result:', bcrypt.compareSync('admin123', hash));
