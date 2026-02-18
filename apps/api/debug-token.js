const jwt = require('jsonwebtoken');

// Секрет из .env файла
const secret = 'your-super-secret-jwt-key-change-in-production';

// Пример токена из логов (обрезанный)
const tokenFromLogs = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYmIwNzFmZC0yMDZmLTQ2NjctOWI1Ni1lNmYyZjI2NWU5MDYiLCJlbWFpbCI6Im5ld3VzZXIxNzcwNjU0OTcxNjA0QHRlc3QuY29tIiwicm9sZSI6ImVuZ2luZWVyIiwiaWF0IjoxNzcwNjU0OTczLCJleHAiOjE3NzEyNTk3NzMsImF1ZCI6ImZlbGV0aS11c2VycyIsImlzcyI6ImZlbGV0aS1hcGkifQ.-5TpHAQQFMjQXfpLkw69NLhLT6hjgzrWN8TZL29X-wc';

console.warn('=== Debugging JWT Token ===\n');

console.warn('1. Проверка структуры токена:');
const parts = tokenFromLogs.split('.');
console.warn(`   Частей: ${parts.length}`);
console.warn(`   Header: ${parts[0]}`);
console.warn(`   Payload: ${parts[1]}`);
console.warn(`   Signature: ${parts[2].substring(0, 20)}...\n`);

console.warn('2. Декодирование payload (без проверки подписи):');
try {
  const decoded = jwt.decode(tokenFromLogs);
  console.warn('   Успешно декодирован:');
  console.warn(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error(`   Ошибка декодирования: ${error.message}`);
}

console.warn('\n3. Проверка подписи с секретом:');
try {
  const verified = jwt.verify(tokenFromLogs, secret, {
    issuer: 'feleti-api',
    audience: 'feleti-users'
  });
  console.warn('   Подпись ВЕРНА');
  console.warn('   Verified payload:', verified);
} catch (error) {
  console.error(`   Ошибка проверки подписи: ${error.message}`);
  console.error(`   Тип ошибки: ${error.name}`);
}

console.warn('\n4. Проверка с разными issuer/audience:');
const testCases = [
  { issuer: 'feleti-api', audience: 'feleti-users', desc: 'Правильные значения' },
  { issuer: 'wrong-issuer', audience: 'feleti-users', desc: 'Неправильный issuer' },
  { issuer: 'feleti-api', audience: 'wrong-audience', desc: 'Неправильный audience' },
  { issuer: undefined, audience: undefined, desc: 'Без проверки issuer/audience' }
];

testCases.forEach(test => {
  try {
    const options = {};
    if (test.issuer) options.issuer = test.issuer;
    if (test.audience) options.audience = test.audience;

    jwt.verify(tokenFromLogs, secret, options);
    console.warn(`   ${test.desc}: УСПЕХ`);
  } catch (error) {
    console.error(`   ${test.desc}: ОШИБКА - ${error.message}`);
  }
});

console.warn('\n=== Завершено ===');
