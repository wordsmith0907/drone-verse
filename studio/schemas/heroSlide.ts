import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'heroSlide',
  title: 'Hero Slides',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Slide Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle / Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'badgeText',
      title: 'Tag / Badge Text',
      type: 'string',
      description: 'e.g. Next-Gen Aerial Imaging, Autonomous Delivery, etc.',
    }),
    defineField({
      name: 'buttonText',
      title: 'CTA Button Text',
      type: 'string',
      initialValue: 'Explore Drones',
    }),
    defineField({
      name: 'buttonLink',
      title: 'CTA Link URL',
      type: 'string',
      initialValue: '/collections/drones-and-accessories.html',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Cloudinary Image URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Direct Image Asset',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active / Visible',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'badgeText',
      media: 'image',
    },
  },
})
