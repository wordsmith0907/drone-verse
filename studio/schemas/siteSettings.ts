import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings & Announcements',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Brand Name',
      type: 'string',
      initialValue: 'DroneVerse',
    }),
    defineField({
      name: 'announcementBar',
      title: 'Top Announcement Banner Text',
      type: 'string',
      initialValue: '⚡ FREE SHIPPING! ₹100 OFF ON ₹999 | ₹200 OFF ON ₹2500 | ₹400 OFF ON ₹4900 | Bulk Enquiries / B2B',
    }),
    defineField({
      name: 'supportPhone',
      title: 'Support Phone Number',
      type: 'string',
      initialValue: '+91 8123057137',
    }),
    defineField({
      name: 'supportEmail',
      title: 'Support Email Address',
      type: 'string',
      initialValue: 'care@robocraze.com',
    }),
    defineField({
      name: 'b2bWhatsapp',
      title: 'B2B WhatsApp Number',
      type: 'string',
      initialValue: '+91 8123057137',
    }),
    defineField({
      name: 'address',
      title: 'Registered Office Address',
      type: 'text',
      rows: 2,
      initialValue: 'Ground Floor, 912/10, Survey no. 104, 4th G Street, Chelekare, Kalyan Nagar, Bengaluru, Karnataka 560043',
    }),
  ],
})
