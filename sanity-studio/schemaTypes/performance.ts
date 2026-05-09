import {defineField, defineType} from 'sanity'

const IMAGE_MAX_SIZE = 2000

function validateImageSize(image: any) {
  const assetRef = image?.asset?._ref
  if (!assetRef) return true

  const dimensions = assetRef.split('-')[2]
  const [width, height] = dimensions.split('x').map(Number)

  if (width > IMAGE_MAX_SIZE || height > IMAGE_MAX_SIZE) {
    return `画像サイズが大きすぎます（${width}x${height}px）。${IMAGE_MAX_SIZE}px 以下にしてください。`
  }

  return true
}

function validateImageArraySize(images: any[] | undefined) {
  if (!Array.isArray(images)) return true

  for (const image of images) {
    const validationResult = validateImageSize(image)
    if (validationResult !== true) return validationResult
  }

  return true
}

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
      description: 'このページのURLパスに使用されます。',
      type: 'slug'
    }),
    defineField({
      name: 'specialSiteEnabled',
      title: '特設サイトフラグ',
      description: 'オンの場合、URLパスを /special/{slug} に切り替えます。\n これにより、特設サイト用のデザインやコンテンツを用意できます。事前に開発者が特設サイト用のルーティングとテンプレートを実装しておく必要があります。',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'performanceDate',
      title: '公演日時',
      type: 'text',
    }),
    defineField({
      name: 'displayMode',
      title: '表示モード',
      description: 'トップページなどでの表示スタイルを選択します。',
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
      validation: (Rule) => Rule.custom((value) => validateImageSize(value)),
    }),
    defineField({
      name: 'additionalImages',
      title: '公演画像2〜4',
      description: '追加の公演画像を最大3枚まで設定できます。上限は縦横2000pxです。',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
      validation: (Rule) => Rule.max(3).custom((images) => validateImageArraySize(images)),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'performanceDate',
      media: 'mainImage',
      specialSiteEnabled: 'specialSiteEnabled',
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
