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
  // 테스트 중 console 출력 억제 (에러 핸들링 테스트의 의도적인 에러 메시지)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
