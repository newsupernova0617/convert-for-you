// 테스트 실행 중 에러 핸들링 테스트의 의도적인 console.error 메시지 억제
// 모든 테스트에서 console.error를 스파이하여 자동으로 억제
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});
// 필요시 특정 테스트에서는 복원 가능:
// beforeEach(() => {
//   console.error.mockRestore();
//   console.log.mockRestore();
// });
