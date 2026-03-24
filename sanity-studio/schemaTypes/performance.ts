import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'performance',
  title: '公演情報',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '公演タイトル',
      type: 'string',
    }),
    defineField({
      name: 'performanceDate',
      title: '公演日時',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 15,
      },
    }),
    defineField({
      name: 'cast',
      title: 'キャスト',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'venue',
      title: '開催場所',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: '公演詳細説明',
      type: 'blockContent',
    }),
    defineField({
      name: 'mainImage',
      title: '公演メイン画像',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'performanceDate',
      media: 'mainImage',
    },
    prepare(selection) {
      const {date} = selection
      return {
        ...selection,
        subtitle: date ? new Date(date).toLocaleString('ja-JP') : '日時未設定',
      }
    },
  },
})
