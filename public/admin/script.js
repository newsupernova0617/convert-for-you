/**
 * 관리자 대시보드 메인 로직
 */

// 전역 차트 인스턴스
let hourlyChartInstance = null;
let formatChartInstance = null;

function adminDashboard() {
  return {
    // 인증 상태
    isAuthenticated: false,
    isLoggingIn: false,
    loginError: '',
    loginForm: {
      password: ''
    },

    // 탭 상태
    currentTab: 'overview',

    // 통계 데이터
    stats: {
      conversions: {
        total: 0,
        today: 0,
        yesterday: 0,
        last7Days: 0,
        last30Days: 0
      },
      formats: [],
      hourly: []
    },

    // 파일 데이터
    files: {
      data: {
        files: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    },

    // 시스템 상태
    systemStatus: {
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        fileCount: 0,
        activeFiles: 0,
        deletedFiles: 0,
        failedFiles: 0
      },
      storage: {
        dbFileSizeMB: 0,
        dbFileSizeBytes: 0
      },
      uptime: 0,
      memoryUsage: {
        rss: 0,
        heapUsed: 0,
        heapTotal: 0
      }
    },

    // 로딩 상태
    isLoadingStats: false,
    isLoadingFiles: false,
    isLoadingSystem: false,
    isDeletingFile: null,

    /**
     * 초기화
     */
    async init() {
      // localStorage에서 토큰 확인
      const token = localStorage.getItem('admin_token');
      if (token) {
        this.isAuthenticated = true;
        this.loadAllData();
        // 자동 새로고침 (1분마다)
        setInterval(() => {
          if (this.isAuthenticated) {
            this.loadAllData();
          }
        }, 60000);
      }
    },

    /**
     * 모든 데이터 로드
     */
    async loadAllData() {
      await Promise.all([
        this.loadStats(),
        this.loadFiles(),
        this.loadSystemStatus()
      ]);
    },

    /**
     * 로그인 처리
     */
    async handleLogin() {
      this.isLoggingIn = true;
      this.loginError = '';

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: this.loginForm.password
          })
        });

        const result = await response.json();

        if (!result.success) {
          this.loginError = result.error || '로그인 실패';
          return;
        }

        // 토큰 저장
        localStorage.setItem('admin_token', result.token);
        this.isAuthenticated = true;
        this.loginForm.password = '';

        // 데이터 로드
        await this.loadAllData();

        // 자동 새로고침
        setInterval(() => {
          if (this.isAuthenticated) {
            this.loadAllData();
          }
        }, 60000);
      } catch (error) {
        this.loginError = '로그인 중 오류가 발생했습니다.';
        console.error('Login error:', error);
      } finally {
        this.isLoggingIn = false;
      }
    },

    /**
     * 로그아웃
     */
    handleLogout() {
      localStorage.removeItem('admin_token');
      this.isAuthenticated = false;
      this.currentTab = 'overview';
      this.loginForm.password = '';
      this.loginError = '';

      // 차트 정리
      if (hourlyChartInstance) hourlyChartInstance.destroy();
      if (formatChartInstance) formatChartInstance.destroy();
    },

    /**
     * 토큰 포함 API 요청
     */
    async apiRequest(endpoint, options = {}) {
      const token = localStorage.getItem('admin_token');

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(endpoint, {
          ...options,
          headers
        });

        if (response.status === 401 || response.status === 403) {
          // 토큰 만료 - 로그아웃
          this.handleLogout();
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('API request error:', error);
        return null;
      }
    },

    /**
     * 통계 데이터 로드
     */
    async loadStats() {
      this.isLoadingStats = true;

      try {
        const result = await this.apiRequest('/api/admin/stats');

        if (result && result.success) {
          this.stats = {
            conversions: result.conversions,
            formats: result.formats,
            hourly: result.hourly
          };

          // 차트 업데이트
          this.$nextTick(() => {
            this.updateCharts();
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        this.isLoadingStats = false;
      }
    },

    /**
     * 파일 목록 로드
     */
    async loadFiles() {
      this.isLoadingFiles = true;

      try {
        const page = this.files.data.page || 1;
        const result = await this.apiRequest(
          `/api/admin/files?page=${page}&limit=20`
        );

        if (result && result.success) {
          this.files.data = result.data;
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        this.isLoadingFiles = false;
      }
    },

    /**
     * 시스템 상태 로드
     */
    async loadSystemStatus() {
      this.isLoadingSystem = true;

      try {
        const result = await this.apiRequest('/api/admin/system-status');

        if (result && result.success) {
          this.systemStatus = result.data;
        }
      } catch (error) {
        console.error('Error loading system status:', error);
      } finally {
        this.isLoadingSystem = false;
      }
    },

    /**
     * 파일 삭제
     */
    async deleteFile(fileId) {
      if (!confirm('정말 이 파일을 삭제하시겠습니까?')) {
        return;
      }

      this.isDeletingFile = fileId;

      try {
        const result = await this.apiRequest(
          `/api/admin/files/${fileId}`,
          { method: 'DELETE' }
        );

        if (result && result.success) {
          alert('파일이 삭제되었습니다.');
          await this.loadFiles();
        } else {
          alert('파일 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('파일 삭제 중 오류가 발생했습니다.');
      } finally {
        this.isDeletingFile = null;
      }
    },

    /**
     * 차트 업데이트
     */
    updateCharts() {
      this.updateHourlyChart();
      this.updateFormatChart();
    },

    /**
     * 시간별 변환 차트 업데이트
     */
    updateHourlyChart() {
      const ctx = document.getElementById('hourlyChart');
      if (!ctx) return;

      const labels = this.stats.hourly.map(h => h.hour);
      const data = this.stats.hourly.map(h => h.count);

      if (hourlyChartInstance) {
        hourlyChartInstance.destroy();
      }

      hourlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '변환 횟수',
            data: data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(75, 192, 192)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '변환 횟수'
              }
            }
          }
        }
      });
    },

    /**
     * 포맷별 변환 차트 업데이트
     */
    updateFormatChart() {
      const ctx = document.getElementById('formatChart');
      if (!ctx) return;

      const labels = this.stats.formats.map(f => f.format);
      const data = this.stats.formats.map(f => f.count);

      const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)',
        'rgb(201, 203, 207)',
        'rgb(255, 99, 132)'
      ];

      if (formatChartInstance) {
        formatChartInstance.destroy();
      }

      formatChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            }
          }
        }
      });
    },

    /**
     * 날짜 포맷팅
     */
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR');
      } catch {
        return '-';
      }
    },

    /**
     * 운영 시간 포맷팅
     */
    formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const mins = Math.floor((seconds % 3600) / 60);

      if (days > 0) {
        return `${days}일 ${hours}시간`;
      } else if (hours > 0) {
        return `${hours}시간 ${mins}분`;
      } else {
        return `${mins}분`;
      }
    }
  };
}
