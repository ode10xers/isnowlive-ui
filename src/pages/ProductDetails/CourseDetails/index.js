const sampleCourseData = {
  course_image_url:
    'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
  course_name: 'Why hello there its a course',
  course_duration: 10,
  course_price: 75,
  course_description: '<p>Sample course description will show up here</p>\n',
  students_learn:
    '<p>What the students will learn will show up here</p>\n<p> This is just a sample text to show how it will be populated </p>',
  who_is_this_for:
    '<p>What the students will learn will show up here</p>\n<p> This is just a sample text to show how it will be populated </p>',
  modules: [
    {
      module_id: 'module_1',
      module_name: 'The first module',
      contents: [
        {
          content_id: 'scooby-dooby-doo',
          content_name: 'First modules first content',
          content_type: 'SESSION',
          // TODO: Confirm later whether it will be inventory/session
          // A sample Session Object (from GET Session API)
          content_data: {
            price: 30,
            currency: 'eur',
            max_participants: 25,
            name: 'Boris',
            description: '<p>test</p>\n',
            session_image_url:
              'https://dkfqbuenrrvge.cloudfront.net/image/1fWsqzwHDwQSwP3l_screenshot from 2021-06-05 20-54-40.png',
            document_urls: [],
            beginning: '2021-07-04T18:30:00Z',
            expiry: '2021-08-31T18:29:59Z',
            prerequisites: '',
            pay_what_you_want: false,
            recurring: true,
            is_refundable: true,
            refund_before_hours: 24,
            user_timezone_offset: 330,
            user_timezone: 'India Standard Time',
            color_code: '#009688',
            is_course: false,
            is_offline: false,
            session_id: 389,
            group: true,
            is_active: true,
            session_external_id: '0112baf0-8406-4fba-96fc-983e84ef6a2c',
            creator_username: 'zeebraman',
            tags: [],
            offline_event_address: '',
            Videos: null,
          },
        },
        {
          content_id: 'yabba-dabba-doo',
          content_name: 'First modules next content',
          content_type: 'VIDEO',
          content_data: {
            title: 'Create, Upload, Cancel after Fix',
            description: '<p>Test</p>\n',
            validity: 1,
            price: 8,
            pay_what_you_want: false,
            currency: 'sgd',
            thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/icpyj903a88nfzHZ_thumbnail.gif',
            external_id: 'cb4a9cd4-8dc7-4526-9fed-72fb43257a44',
            is_published: true,
            video_url: '',
            video_uid: '11458eea7ad9e069add75a2fb569df50',
            duration: 489,
            status: 'UPLOAD_SUCCESS',
            watch_limit: 1,
            creator_username: 'ellianto',
            is_course: false,
            tags: [],
            total_price: 9.6,
            sessions: [],
          },
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'What does the fox say?',
      answer: 'The quick brown fox',
    },
    {
      question: 'Wake me up?',
      answer: 'Wake me up inside',
    },
  ],
};
