/* eslint-disable */
export default {
  /* Production config here */
  server: {
    baseURL: 'https://api.app.passion.do',
  },
  client: {
    platformBaseURL: 'https://app.passion.do',
  },
  freshChat: {
    appToken: 'a30f40c7-e40a-4a1f-ade9-c66ee65c372d',
    hostUrl: 'https://wchat.in.freshchat.com',
  },
  mixPanel: {
    projectToken: '66d14eef944c59af0a94e7a20f7e0b2f',
  },
  stripe: {
    secretKey:
      // Old
      // 'pk_live_51HVgJAHZtrrEElwYpsua3HdxQREeNtDhwhDSO0SDnnaoVLLniZu26mWdSdNFwztw0323UZvWJv7Ruxom7mjPsnfW00INDUZFLe',
      // New
      'pk_live_51K8lTKLEVlohEunyGv8uk8CdV3novJTmtn08FbrLGsDBtUbgBan6CL8d2Eqv7RHc5curZim9wPeVJ5jWhQBRoZuo00TEQHIx6c',
    indianSecretKey:
      'pk_live_51JAUu3SAipO1KYDwWdjP06UkZLsCYOhKBrGrnuitypVg2vtHfjZjFiCqRU4oJHC1rlfR3ThS8T3S3psBNTD47RJ900UkLw82eH',
  },
  zoom: {
    oAuthURL: `https://zoom.us/oauth/authorize?response_type=code&client_id=brQnuitATty_4L23JGrIYg&redirect_uri=https://app.passion.do/creator/dashboard/livestream`,
  },
  paypal: {
    clientID: 'AYjnZ5fGLF35MhFWkadUyPxLroWjN4N8UcyJ7Vj33v9zMbw1k5h85scWvga_9kFZh5CwbElxXz4SiYSB',
  },
};
