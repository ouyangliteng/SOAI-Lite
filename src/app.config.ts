export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/upload/index',
    'pages/analysis/index',
    'pages/report-detail/index',
    'pages/reports/index',
    'pages/profile/index',
    'pages/agreement/user/index',
    'pages/agreement/privacy/index',
    'pages/agreement/minor/index',
  ],
  window: {
    navigationBarTitleText: 'SOAI',
    navigationBarBackgroundColor: '#0d1117',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0d1117',
  },
  tabBar: {
    custom: true,
    color: '#8b949e',
    selectedColor: '#00b896',
    backgroundColor: '#0d1117',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index',    text: '首页' },
      { pagePath: 'pages/reports/index', text: '报告' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
})
