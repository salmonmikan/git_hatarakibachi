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
      name: 'slug',
      title: 'スラッグ',
      description: '公演詳細ページへのURLに使用されます。',
      type: 'slug'
    }),
    defineField({
      name: 'performanceDate',
      title: '公演日時',
      type: 'text',
    }),
    defineField({
      name: 'displayMode',
      title: '表示モード',
      type: 'string',
      options: {
        list: [
          {title: '通常（詳細あり）', value: 'standard'},
          {title: '画像のみ', value: 'imageOnly'},
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'cast',
      title: 'キャスト・スタッフ',
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
      title: '公演画像1',
      type: 'image',
      description: '上限は縦横2000pxです。',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.custom((value) => {
        if (!value?.asset?._ref) return true;
        // アセットID（例: image-abc123-1200x800-jpg）からサイズを抽出
        const dimensions = value.asset._ref.split('-')[2];
        const [width, height] = dimensions.split('x').map(Number);
        if (width > 2000 || height > 2000) {
          return `画像サイズが大きすぎます（${width}x${height}px）。2000px 以下にしてください。`;
        }
        return true;
      }),
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
