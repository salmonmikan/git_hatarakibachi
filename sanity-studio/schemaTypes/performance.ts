import { defineField, defineType } from 'sanity'
import {validateAssetArrayMaxSize, validateAssetMaxSize} from './assetValidation'

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
  groups: [
    { name: 'basic', title: '基本情報', default: true },
    { name: 'extra', title: '追加設定' },
    { name: 'media', title: '画像' },
    { name: 'special', title: '特設表示' },
    { name: 'other', title: 'その他' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: '公演タイトル',
      description: '公演ページや一覧で表示するタイトルです。',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required().error('公演タイトルは必須です。'),
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      description: 'このページのURLパスに使用されます。手入力で設定してください。',
      type: 'slug',
      group: 'basic',
      validation: (Rule) => Rule.required().error('スラッグは必須です。'),
    }),
    defineField({
      name: 'description',
      title: '公演詳細説明',
      description: '通常の公演詳細ページに表示する本文です。特設サイトの補足情報も必要に応じてここへ自由入力で含めます。',
      type: 'blockContent',
      group: 'basic',
    }),
    defineField({
      name: 'cast',
      title: 'キャスト',
      description: '役名、役者名、顔写真を設定します。特設サイトでもこの内容を基本表示として使います。',
      type: 'array',
      of: [
        defineField({
          name: 'castMember',
          title: 'キャスト',
          type: 'object',
          fields: [
            defineField({
              name: 'roleName',
              title: '役名',
              description: '演じる役名を入力します。',
              type: 'string',
            }),
            defineField({
              name: 'actorName',
              title: '役者名',
              description: '出演者名を入力します。',
              type: 'string',
            }),
            defineField({
              name: 'photo',
              title: '顔写真',
              description: '表示する顔写真です。5MB以下の画像を設定してください。',
              type: 'image',
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '顔写真')),
            }),
          ],
          preview: {
            select: {
              title: 'actorName',
              subtitle: 'roleName',
              media: 'photo',
            },
            prepare(selection) {
              const { title, subtitle, media } = selection
              return {
                title: title || '役者名未設定',
                subtitle: subtitle || '役名未設定',
                media,
              }
            },
          },
        }),
      ],
      group: 'basic',
    }),
    defineField({
      name: 'staff',
      title: 'スタッフ',
      description: 'スタッフ情報を入力します。特設サイトでもこの内容を基本表示として使います。',
      type: 'blockContent',
      group: 'basic',
    }),
    defineField({
      name: 'venue',
      title: '開催場所',
      description: '会場名を入力します。',
      type: 'string',
      group: 'basic',
    }),
    defineField({
      name: 'performanceDate',
      title: '公演日時',
      description: '公演日程の概要を自由入力で記載します。特設サイトでもこの内容を基本表示として使います。',
      type: 'text',
      group: 'basic',
    }),
    defineField({
      name: 'displayMode',
      title: '表示モード',
      description: 'トップページなどでの表示スタイルを選択します。',
      type: 'string',
      options: {
        list: [
          { title: '通常（詳細あり）', value: 'standard' },
          { title: '画像のみ', value: 'imageOnly' },
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
      group: 'extra',
    }),
    defineField({
      name: 'mainImage',
      title: '公演画像1',
      type: 'image',
      description: '5MB以下の画像を設定してください。',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '公演画像1')),
      group: 'media',
    }),
    defineField({
      name: 'additionalImages',
      title: '公演画像2〜4',
      description: '追加の公演画像を最大3枚まで設定できます。各画像は5MB以下にしてください。',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
      validation: (Rule) => Rule.max(3).custom((images, context) => validateAssetArrayMaxSize(images, context, '公演画像')),
      group: 'media',
    }),
    defineField({
      name: 'specialRendererKey',
      title: '特設表示キー',
      description: '特設サイト表示に使うテンプレートキーです。未設定なら通常表示になります。',
      type: 'string',
      group: 'special',
    }),
    defineField({
      name: 'specialLead',
      title: '特設リード文',
      description: 'ファーストビュー付近に表示する短い導入文です。',
      type: 'text',
      rows: 3,
      group: 'special',
    }),
    defineField({
      name: 'specialSynopsisTitle',
      title: '特設あらすじ見出し',
      description: 'あらすじセクションの見出しとして表示する文言です。',
      type: 'string',
      group: 'special',
    }),
    defineField({
      name: 'specialGoogleMapEmbedUrl',
      title: '特設 Google Map 埋め込みURL',
      description: '特設サイトで表示する Google Map の埋め込み用URLです。',
      type: 'url',
      group: 'extra',
    }),
    defineField({
      name: 'specialGalleryImages',
      title: '特設メインビジュアル',
      description: '切り替え表示用の画像を設定します。各画像は5MB以下にしてください。',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
        },
      ],
      validation: (Rule) => Rule.custom((images, context) => validateAssetArrayMaxSize(images, context, '特設メインビジュアル')),
      group: 'special',
    }),
    defineField({
      name: 'specialCastPhotos',
      title: '特設キャスト写真',
      description: '特設サイトで表示するキャスト写真と補足情報を設定します。',
      type: 'array',
      of: [
        defineField({
          name: 'castPhoto',
          title: 'キャスト写真',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: '名前',
              description: '出演者名を入力します。',
              type: 'string',
            }),
            defineField({
              name: 'role',
              title: '役名・補足',
              description: '役名や所属などの補足情報を入力します。',
              type: 'string',
            }),
            defineField({
              name: 'image',
              title: '写真',
              description: '表示するキャスト写真です。5MB以下の画像を設定してください。',
              type: 'image',
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, '特設キャスト写真')),
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'role',
              media: 'image',
            },
          },
        }),
      ],
      group: 'special',
    }),
    defineField({
      name: 'archiveDisplayEnabled',
      title: 'Archive表示',
      description: 'オンの場合、この公演をArchiveに表示します。',
      type: 'boolean',
      initialValue: false,
      group: 'other',
    }),
    defineField({
      name: 'specialSeo',
      title: '特設 SEO / OGP',
      description: '特設サイト表示時の OGP まわりを上書きしたい場合に設定します。',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'title',
          title: 'OGPタイトル',
          description: 'SNS共有時などに使うタイトルです。',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'OGP説明文',
          description: 'SNS共有時などに使う説明文です。',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'image',
          title: 'OGP画像',
          description: 'SNS共有時に使う画像です。5MB以下の画像を設定してください。',
          type: 'image',
          options: {
            hotspot: true,
          },
          validation: (Rule) => Rule.custom((value, context) => validateAssetMaxSize(value, context, 'OGP画像')),
        }),
      ],
      group: 'other',
    })
  ],
  preview: {
    select: {
      title: 'title',
      date: 'performanceDate',
      media: 'mainImage',
      rendererKey: 'specialRendererKey',
    },
    prepare(selection) {
      const { date, rendererKey } = selection
      return {
        ...selection,
        subtitle: [date ? new Date(date).toLocaleString('ja-JP') : '日時未設定', rendererKey ? `特設: ${rendererKey}` : null].filter(Boolean).join(' / '),
      }
    },
  },
})
