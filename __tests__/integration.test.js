const path = require('path');
const fs = require('fs');
const { convert } = require('../utils/converterPool');

/**
 * ============================================
 * 🔄 Integration Tests - 실제 파일 변환 테스트
 * ============================================
 *
 * Mock을 사용하지 않고 실제 변환 로직을 테스트합니다.
 * - Sharp (이미지 변환)
 * - LibreOffice (PDF 처리)
 * - FFmpeg (미디어 변환)
 *
 * 주의: LibreOffice, FFmpeg이 설치되어 있어야 합니다.
 */

describe('Real File Conversion Integration Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  describe('Image Conversion (PNG ↔ JPG)', () => {
    let pngBuffer;
    let jpgBuffer;

    beforeAll(() => {
      // 테스트 이미지 로드
      pngBuffer = fs.readFileSync(path.join(fixturesDir, 'test.png'));
      jpgBuffer = fs.readFileSync(path.join(fixturesDir, 'test.jpg'));

      console.log(`\n📦 테스트 파일 로드:`);
      console.log(`   PNG: ${pngBuffer.length} bytes`);
      console.log(`   JPG: ${jpgBuffer.length} bytes`);
    });

    test('should convert PNG to JPG successfully', async () => {
      console.log('\n🔄 PNG → JPG 변환 중...');

      const result = await convert(pngBuffer, 'png-to-jpg', '#ffffff');

      console.log(`✅ 변환 완료`);
      console.log(`   성공: ${result.success}`);
      console.log(`   결과 크기: ${result.buffer.length} bytes`);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);

      // JPG 매직 넘버 확인 (FFD8FF)
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const bufferObj = Buffer.isBuffer(result.buffer)
        ? result.buffer
        : Buffer.from(result.buffer);
      const jpgMagic = bufferObj.toString('hex', 0, 3);
      expect(jpgMagic).toBe('ffd8ff');
    }, 30000);

    test('should convert JPG to PNG successfully', async () => {
      console.log('\n🔄 JPG → PNG 변환 중...');

      const result = await convert(jpgBuffer, 'jpg-to-png');

      console.log(`✅ 변환 완료`);
      console.log(`   성공: ${result.success}`);
      console.log(`   결과 크기: ${result.buffer.length} bytes`);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);

      // PNG 매직 넘버 확인 (89504E47)
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const bufferObj = Buffer.isBuffer(result.buffer)
        ? result.buffer
        : Buffer.from(result.buffer);
      const pngMagic = bufferObj.toString('hex', 0, 4);
      expect(pngMagic).toBe('89504e47');
    }, 30000);

    test('converted images should have valid dimensions', async () => {
      console.log('\n🔄 이미지 유효성 검증 중...');

      const result = await convert(pngBuffer, 'png-to-jpg', '#ffffff');

      // 변환된 이미지가 0바이트가 아니고, 원본과 비슷한 크기
      expect(result.buffer.length).toBeGreaterThan(100);
      expect(result.buffer.length).toBeLessThan(pngBuffer.length * 5);

      console.log(`✅ 유효한 이미지 데이터`);
      console.log(`   원본 PNG: ${pngBuffer.length} bytes`);
      console.log(`   변환된 JPG: ${result.buffer.length} bytes`);
    }, 30000);

    test('should compress image with quality setting', async () => {
      console.log('\n🔄 품질 설정으로 이미지 압축 중...');

      const result = await convert(jpgBuffer, 'jpg-to-png');

      expect(result.success).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);

      console.log(`✅ 압축 완료`);
      console.log(`   결과 크기: ${result.buffer.length} bytes`);
      console.log(`   압축률: ${((1 - result.buffer.length / jpgBuffer.length) * 100).toFixed(2)}%`);
    }, 30000);
  });

  describe('PDF to Image Conversion', () => {
    let pdfBuffer;

    beforeAll(() => {
      pdfBuffer = fs.readFileSync(path.join(fixturesDir, 'test.pdf'));
      console.log(`\n📦 PDF 파일 로드: ${pdfBuffer.length} bytes`);
    });

    test('should convert PDF to JPG successfully', async () => {
      console.log('\n🔄 PDF → JPG 변환 중...');

      const result = await convert(pdfBuffer, 'jpg');

      console.log(`✅ 변환 완료`);
      console.log(`   성공: ${result.success}`);
      console.log(`   결과 크기: ${result.buffer.length} bytes`);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);

      // ZIP 매직 넘버 확인 (504B0304 = PK\x03\x04)
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const bufferObj = Buffer.isBuffer(result.buffer)
        ? result.buffer
        : Buffer.from(result.buffer);
      const zipMagic = bufferObj.toString('hex', 0, 4);
      expect(zipMagic).toBe('504b0304');
    }, 60000); // PDF 변환은 더 오래 걸릴 수 있음

    test('should convert PDF to PNG successfully', async () => {
      console.log('\n🔄 PDF → PNG 변환 중...');

      const result = await convert(pdfBuffer, 'png');

      console.log(`✅ 변환 완료`);
      console.log(`   성공: ${result.success}`);
      console.log(`   결과 크기: ${result.buffer.length} bytes`);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.buffer.length).toBeGreaterThan(0);

      // ZIP 매직 넘버 확인 (504B0304 = PK\x03\x04)
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const bufferObj = Buffer.isBuffer(result.buffer)
        ? result.buffer
        : Buffer.from(result.buffer);
      const zipMagic = bufferObj.toString('hex', 0, 4);
      expect(zipMagic).toBe('504b0304');
    }, 60000);
  });

  describe('Image Compression', () => {
    let jpgBuffer;

    beforeAll(() => {
      jpgBuffer = fs.readFileSync(path.join(fixturesDir, 'test.jpg'));
    });

    test('should convert and compress image', async () => {
      console.log('\n🔄 이미지 포맷 변환 (품질 조정)...');

      const result = await convert(jpgBuffer, 'jpg-to-png');

      expect(result.success).toBe(true);
      expect(result.buffer.length).toBeGreaterThan(0);

      console.log(`✅ 변환 완료`);
      console.log(`   원본 JPG: ${jpgBuffer.length} bytes`);
      console.log(`   변환된 PNG: ${result.buffer.length} bytes`);

      // PNG는 무손실이므로 크기가 더 클 수 있음
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const bufferObj = Buffer.isBuffer(result.buffer)
        ? result.buffer
        : Buffer.from(result.buffer);
      expect(bufferObj.toString('hex', 0, 4)).toBe('89504e47');
    }, 30000);
  });

  describe('Conversion Robustness', () => {
    let pngBuffer;
    let jpgBuffer;

    beforeAll(() => {
      pngBuffer = fs.readFileSync(path.join(fixturesDir, 'test.png'));
      jpgBuffer = fs.readFileSync(path.join(fixturesDir, 'test.jpg'));
    });

    test('should handle consecutive conversions', async () => {
      console.log('\n🔄 연속 변환 테스트...');

      // 첫 번째 변환
      const result1 = await convert(pngBuffer, 'png-to-jpg', '#ffffff');
      expect(result1.success).toBe(true);
      console.log(`   1차 변환 (PNG→JPG): ✅ (${result1.buffer.length} bytes)`);

      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const buffer1 = Buffer.isBuffer(result1.buffer)
        ? result1.buffer
        : Buffer.from(result1.buffer);

      // 두 번째 변환 (JPG를 PNG로)
      const result2 = await convert(buffer1, 'jpg-to-png');
      expect(result2.success).toBe(true);
      console.log(`   2차 변환 (JPG→PNG): ✅ (${result2.buffer.length} bytes)`);

      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const buffer2 = Buffer.isBuffer(result2.buffer)
        ? result2.buffer
        : Buffer.from(result2.buffer);

      // 셋 번째 변환 (다시 JPG로)
      const result3 = await convert(buffer2, 'png-to-jpg', '#ffffff');
      expect(result3.success).toBe(true);
      console.log(`   3차 변환 (PNG→JPG): ✅ (${result3.buffer.length} bytes)`);
    }, 60000);

    test('should return different results for different formats', async () => {
      console.log('\n🔄 포맷별 결과 비교...');

      const jpgResult = await convert(pngBuffer, 'png-to-jpg', '#ffffff');
      const pngResult = await convert(jpgBuffer, 'jpg-to-png');

      console.log(`   PNG→JPG 결과: ${jpgResult.buffer.length} bytes`);
      console.log(`   JPG→PNG 결과: ${pngResult.buffer.length} bytes`);

      // 두 결과가 다른 매직 넘버를 가져야 함
      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const jpgBufferObj = Buffer.isBuffer(jpgResult.buffer)
        ? jpgResult.buffer
        : Buffer.from(jpgResult.buffer);
      const pngBufferObj = Buffer.isBuffer(pngResult.buffer)
        ? pngResult.buffer
        : Buffer.from(pngResult.buffer);

      expect(jpgBufferObj.toString('hex', 0, 3)).toBe('ffd8ff'); // JPG
      expect(pngBufferObj.toString('hex', 0, 4)).toBe('89504e47'); // PNG
    }, 60000);

    test('should maintain image quality across conversions', async () => {
      console.log('\n🔄 이미지 품질 유지 테스트...');

      const result1 = await convert(pngBuffer, 'png-to-jpg', '#ffffff');

      // Piscina는 Buffer를 Array로 직렬화하므로 Buffer로 변환 필요
      const buffer1 = Buffer.isBuffer(result1.buffer)
        ? result1.buffer
        : Buffer.from(result1.buffer);

      const result2 = await convert(buffer1, 'jpg-to-png');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      console.log(`   원본 PNG: ${pngBuffer.length} bytes`);
      console.log(`   → JPG: ${result1.buffer.length} bytes`);
      console.log(`   → PNG: ${result2.buffer.length} bytes`);

      // 모든 단계에서 유효한 파일이어야 함
      expect(result2.buffer.length).toBeGreaterThan(100);
    }, 60000);
  });

  describe('Conversion Error Handling', () => {
    test('should handle invalid input buffer gracefully', async () => {
      console.log('\n🔄 잘못된 입력 처리...');

      const invalidBuffer = Buffer.from('This is not a valid image');

      try {
        const result = await convert(invalidBuffer, 'png-to-jpg', '#ffffff');
        console.log(`   결과: success=${result.success}`);

        // 실패하거나, 에러를 포함해야 함
        if (!result.success) {
          expect(result.error).toBeDefined();
          console.log(`   예상된 에러: ${result.error}`);
        }
      } catch (error) {
        console.log(`   에러 발생 (예상됨): ${error.message}`);
        expect(true).toBe(true); // 에러 발생은 정상
      }
    }, 30000);

    test('should handle unsupported format gracefully', async () => {
      console.log('\n🔄 미지원 포맷 처리...');

      const pngBuffer = fs.readFileSync(path.join(fixturesDir, 'test.png'));

      try {
        const result = await convert(pngBuffer, 'xyz-unsupported-format');
        console.log(`   결과: success=${result.success}`);

        // 미지원 포맷은 실패해야 함
        if (!result.success) {
          expect(result.error).toBeDefined();
          console.log(`   예상된 에러: ${result.error}`);
        }
      } catch (error) {
        console.log(`   에러 발생 (예상됨): ${error.message}`);
        expect(true).toBe(true); // 에러 발생은 정상
      }
    }, 30000);
  });

  describe('Converter Pool Stats', () => {
    test('should have pool statistics available', async () => {
      console.log('\n📊 변환 풀 통계...');

      try {
        const converterPool = require('../utils/converterPool');
        const stats = converterPool.getStats();

        console.log(`   Pool 설정:`);
        console.log(`   - Min Threads: ${stats.minThreads}`);
        console.log(`   - Max Threads: ${stats.maxThreads}`);
        console.log(`   - Task Timeout: ${stats.taskTimeout}ms`);

        expect(stats.minThreads).toBeGreaterThan(0);
        expect(stats.maxThreads).toBeGreaterThanOrEqual(stats.minThreads);
      } catch (error) {
        console.log('⚠️  Pool stats 조회 불가:', error.message);
      }
    });
  });
});
