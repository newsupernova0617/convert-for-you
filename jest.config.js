module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'config/**/*.js',
    'utils/**/*.js',
    '!utils/converterPool.js', // Piscina 워커는 테스트하기 복잡함
    '!utils/scheduler.js', // 스케줄러는 별도 테스트
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/public/'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
};
