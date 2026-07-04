import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { AgreementContent } from './content'
import './index.scss'

type Props = {
  content: AgreementContent
}

export default function AgreementPage({ content }: Props) {
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: content.title })
  }, [content.title])

  return (
    <View className='agreement-page'>
      <View className='agreement-header'>
        <Text className='agreement-title'>{content.title}</Text>
        {content.version && <Text className='agreement-version'>{content.version}</Text>}
      </View>

      {content.intro?.map((line) => (
        <Text key={line} className='agreement-intro'>{line}</Text>
      ))}

      {content.sections.map((section) => (
        <View key={section.title} className='agreement-section'>
          <Text className='agreement-section-title'>{section.title}</Text>
          {section.items.map((item) => (
            <View key={item} className='agreement-item'>
              <Text className='agreement-dot'>•</Text>
              <Text className='agreement-text'>{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
