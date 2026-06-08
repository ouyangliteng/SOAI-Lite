export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/upload/index',
    'pages/analysis/index',
    'pages/report-detail/index',
    'pages/reports/index',
    'pages/profile/index',
  ],
  window: {
    navigationBarTitleText: 'SOAI',
    navigationBarBackgroundColor: '#0d1117',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0d1117',
  },
  tabBar: {
    color: '#8b949e',
    selectedColor: '#00b896',
    backgroundColor: '#0d1117',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index',    text: '首页',  iconPath: 'assets/tab-home.png',    selectedIconPath: 'assets/tab-home-on.png' },
      { pagePath: 'pages/reports/index', text: '报告',  iconPath: 'assets/tab-report.png',  selectedIconPath: 'assets/tab-report-on.png' },
      { pagePath: 'pages/profile/index', text: '我的',  iconPath: 'assets/tab-profile.png', selectedIconPath: 'assets/tab-profile-on.png' },
    ],
  },
})
