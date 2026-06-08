import { Component } from 'react'
import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const HOME_GRAY = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5NDllIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjBhMSAxIDAgMDEtMSAxSDRhMSAxIDAgMDEtMS0xVjEwLjV6Ii8+PHBhdGggZD0iTTkgMjFWMTNoNnY4Ii8+PC9zdmc+'
const HOME_GREEN = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBiODk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAxMC41TDEyIDNsOSA3LjVWMjBhMSAxIDAgMDEtMSAxSDRhMSAxIDAgMDEtMS0xVjEwLjV6Ii8+PHBhdGggZD0iTTkgMjFWMTNoNnY4Ii8+PC9zdmc+'
const REPORT_GRAY = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5NDllIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSI1IiB5PSIzIiB3aWR0aD0iMTQiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PGxpbmUgeDE9IjkiIHkxPSI4IiB4Mj0iMTUiIHkyPSI4Ii8+PGxpbmUgeDE9IjkiIHkxPSIxMiIgeDI9IjE1IiB5Mj0iMTIiLz48bGluZSB4MT0iOSIgeTE9IjE2IiB4Mj0iMTMiIHkyPSIxNiIvPjwvc3ZnPg=='
const REPORT_GREEN = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBiODk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSI1IiB5PSIzIiB3aWR0aD0iMTQiIGhlaWdodD0iMTgiIHJ4PSIyIi8+PGxpbmUgeDE9IjkiIHkxPSI4IiB4Mj0iMTUiIHkyPSI4Ii8+PGxpbmUgeDE9IjkiIHkxPSIxMiIgeDI9IjE1IiB5Mj0iMTIiLz48bGluZSB4MT0iOSIgeTE9IjE2IiB4Mj0iMTMiIHkyPSIxNiIvPjwvc3ZnPg=='
const PROFILE_GRAY = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5NDllIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz48cGF0aCBkPSJNNCAyMGMwLTMuOSAzLjYtNyA4LTdzOCAzLjEgOCA3Ii8+PC9zdmc+'
const PROFILE_GREEN = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBiODk2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz48cGF0aCBkPSJNNCAyMGMwLTMuOSAzLjYtNyA4LTdzOCAzLjEgOCA3Ii8+PC9zdmc+'

const TABS = [
  { text: '首页',  url: '/pages/home/index',    icon: HOME_GRAY,    activeIcon: HOME_GREEN },
  { text: '报告',  url: '/pages/reports/index', icon: REPORT_GRAY,  activeIcon: REPORT_GREEN },
  { text: '我的',  url: '/pages/profile/index', icon: PROFILE_GRAY, activeIcon: PROFILE_GREEN },
]

interface State { selected: number }

export default class CustomTabBar extends Component<{}, State> {
  state: State = { selected: 0 }

  setSelected(index: number) {
    this.setState({ selected: index })
  }

  handleTap(index: number, url: string) {
    Taro.switchTab({ url })
  }

  render() {
    const { selected } = this.state
    return (
      <View className='ctb'>
        {TABS.map((tab, i) => (
          <View
            key={i}
            className={`ctb-item${selected === i ? ' ctb-active' : ''}`}
            onClick={() => this.handleTap(i, tab.url)}
          >
            <Image className='ctb-icon' src={selected === i ? tab.activeIcon : tab.icon} />
            <Text className='ctb-label'>{tab.text}</Text>
          </View>
        ))}
      </View>
    )
  }
}
