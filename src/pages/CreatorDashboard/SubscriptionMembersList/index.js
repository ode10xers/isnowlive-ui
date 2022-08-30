import React, { useCallback, useState, useEffect } from 'react';

import { Row, Col, PageHeader, Space, Typography } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { isUnlimitedMembership } from 'utils/subscriptions';

import styles from './styles.module.scss';

const { Text } = Typography;
const {
  formatDate: { toShortDateWithYear },
} = dateUtil;

const SubscriptionMembersList = ({ history, match }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionMembers, setSubscriptionMembers] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  const subscriptionId = match.params.subscription_id;

  const fetchSubscriptionDetails = useCallback(async (subscriptionExtId) => {
    try {
      const { status, data } = await apis.subscriptions.getSubscriptionById(subscriptionExtId);
      if (isAPISuccess(status) && data) {
        setSubscriptionDetails(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch membership details', error?.response?.data?.message ?? 'Something went wrong');
    }
  }, []);

  const fetchSubscriptionMembers = useCallback(async (subscriptionExtId) => {
    try {
      // TODO: Implement this API
      // const { status, data } = await apis.subscriptions.getSubscriptionMembers(subscriptionExtId);
      const { status, data } = {
        status: 200,
        data: [
          {
            subscription_order: {
              subscription_order_id: 'tcsa9gnbUssD41p7',
              subscription_name: 'Daily Membership',
              price: 12,
              currency: 'sgd',
              status: 'PAYMENT_COMPLETED',
              subscription_id: '3515ebc0-c5b6-43be-a3a7-cec6ffff06d9',
              platform_fees: 2.4,
              purchase_date: '2021-10-03T06:15:44Z',
              expiry: '2021-10-04T06:15:44Z',
              recurring: false,
              payment_required: false,
              creator_username: 'ellianto',
              product_details: {
                VIDEO: [
                  {
                    title: 'TubeU on Stage',
                    description:
                      '<p>Desc (again, videos are courtesy of fireship.io)</p>\n!~!~!~https://dkfqbuenrrvge.cloudfront.net/document/6N4pNYD3pD4hVQfO_utm-tracking-cheatsheet.pdf',
                    validity: 1,
                    price: 15,
                    pay_what_you_want: false,
                    thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/cqz5GTcS9mUzTHcP_iceland waterfall.jpg',
                    watch_limit: 1,
                    is_course: false,
                    source: 'YOUTUBE',
                    video_url: 'https://www.youtube.com/watch?v=JSURzPQnkl0',
                    currency: 'sgd',
                    external_id: 'd602765d-88cc-4727-998a-1286ec8922db',
                    is_published: true,
                    duration: 1,
                    status: '',
                    creator_username: 'ellianto',
                    tags: [],
                    total_price: 15,
                  },
                  {
                    title: 'Fees on Mees',
                    description: '<p>Testing</p>\n',
                    validity: 1,
                    price: 20,
                    pay_what_you_want: false,
                    thumbnail_url:
                      'https://dkfqbuenrrvge.cloudfront.net/image/kV0U0f8MH8Bnju8F_desert safari facebook cover.png',
                    watch_limit: 1,
                    is_course: false,
                    source: 'CLOUDFLARE',
                    video_uid: '57a8d23c72d4cf603a97f9fb76522039',
                    currency: 'sgd',
                    external_id: '95a3ed95-66bc-4a9e-a0be-71d23ed12254',
                    is_published: true,
                    duration: 489,
                    status: '',
                    creator_username: 'ellianto',
                    tags: [],
                    total_price: 20,
                  },
                ],
              },
              tag: {
                name: '',
                external_id: '',
              },
              product_credits: 15,
              product_credits_used: 0,
              course_credits: 0,
              course_credits_used: 0,
            },
            user: {
              external_id: '852e2683-8291-4398-ad5e-16d01f85ec20',
              first_name: 'Elli',
              last_name: 'Anto',
              email: 'ellianto+101@10xers.co',
              phone: '',
              location: '',
              timezone_info: '',
              email_verified: true,
              gender: '',
              is_creator: true,
              date_of_birth: '',
              cover_image_url: 'https://dkfqbuenrrvge.cloudfront.net/image/gucdwbZLZkpEsFUR_iceland waterfall.jpg',
              profile_image_url: 'https://dkfqbuenrrvge.cloudfront.net/image/2ZypG4Nkedq7xt06_hero-image.jpg',
              username: 'ellianto',
              profile: {
                bio:
                  '\u003cp style="text-align:justify;"\u003eChanging this\u003cbr\u003e\u003cspan style="color: rgb(102,102,102);background-color: transparent;font-size: 12px;font-family: arial;"\u003eDanka Bednárová is an Ashtanga and Vinyasa Krama yoga and shiatsu practitioner from Slovakia. She has been studying and teaching yoga and shiatsu internationally for over a decade, including with Vijay Kumar in India, Matthew Sweeney in Bali and\u003c/span\u003e \u003cspan style="color: rgb(102,102,102);background-color: transparent;font-size: 12px;font-family: arial;"\u003eZuna Vesan Kozankova from Slovakia. In 2008 she opened her own yoga centre in Slovakia. Now based in Leipzig, she regularly teaches at Ashtanga Yoga Loft Leipzig as well as privately and online. She holds teaching qualifications in Ashtanga Vinyasa yoga, hatha yoga, shiatsu and ayurvedic yoga massage\u003c/span\u003e\u003c/p\u003e\n',
                testimonials: [],
                social_media_links: {
                  website: '',
                  instagram_link: '',
                  facebook_link: '',
                  linkedin_link: '',
                  twitter_link: '',
                },
                collect_emails: false,
                allow_donations: false,
                sections: [
                  {
                    key: 'OTHER_LINKS',
                    title: 'Link Preview',
                    values: [
                      {
                        backgroundColor: '1890ff',
                        textColor: 'ffffff',
                        title: 'Test very long link description here that so long',
                        url: 'https://google.com',
                      },
                      {
                        backgroundColor: 'cc0000',
                        textColor: 'ffffff',
                        title: 'Some short ones',
                        url: 'https://youtube.com',
                      },
                      {
                        backgroundColor: '0000cc',
                        textColor: 'ffffff',
                        title: 'another moderately long one',
                        url: 'https://en.wikipedia.org',
                      },
                    ],
                  },
                  { key: 'SESSIONS', title: 'My Sessions', values: null },
                  {
                    key: 'AVAILABILITY',
                    title: 'My Appointment times',
                    values: null,
                  },
                  { key: 'VIDEOS', title: 'My Videos', values: null },
                  {
                    key: 'PRODUCTS',
                    title: '',
                    values: [
                      { key: 'SESSIONS', title: 'My Sessions', values: null },
                      { key: 'COURSES', title: 'My Courses', values: null },
                      { key: 'VIDEOS', title: 'My Videos', values: null },
                    ],
                  },
                  { key: 'COURSES', title: 'My Courses', values: null },
                  { key: 'SUBSCRIPTIONS', title: 'Member Ships', values: null },
                  { key: 'PASSES', title: 'My Passes', values: null },
                ],
                color: '#ffc60a',
                new_profile: true,
                category: '',
                custom_domain: 'testing.site',
                connect_account_id: 'acct_1K9qpmQ2tY2SKHdo',
                zoom_connected: 'JWT',
                payment_account_status: 'CONNECTED',
                ga_data: { payment_verified: true },
                currency: 'sgd',
                country: 'SG',
                payment_provider: 'STRIPE',
                live_mode: true,
                allow_gifting_products: false,
              },
              profile_complete: true,
              signup_date: '2020-12-15T07:35:35Z',
              referral_code: 'ellianto',
            },
          },
        ],
      };
      if (isAPISuccess(status) && data) {
        setSubscriptionMembers(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch membership details', error?.response?.data?.message ?? 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (subscriptionId) {
      Promise.allSettled([fetchSubscriptionMembers(subscriptionId), fetchSubscriptionDetails(subscriptionId)])
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [subscriptionId, fetchSubscriptionMembers, fetchSubscriptionDetails]);

  const generateRemainingCreditsText = useCallback((subscription, isCourse = false) => {
    let remainingCredits = 0;
    let totalCredits = 0;
    let isUnlimited = isUnlimitedMembership(subscription, isCourse);
    let productText = '';

    if (isCourse) {
      totalCredits = subscription?.course_credits ?? 0;
      remainingCredits = totalCredits - (subscription?.course_credits_used ?? 0);
      productText = 'Course';
    } else {
      totalCredits = subscription?.product_credits ?? 0;
      remainingCredits = totalCredits - (subscription?.product_credits_used ?? 0);
      productText = 'Session or Video';
    }

    return isUnlimited ? (
      <Text>Unlimited {productText}</Text>
    ) : (
      <Text>
        {remainingCredits}/{totalCredits} {productText} credits left
      </Text>
    );
  }, []);

  const renderRemainingCreditsForSubscription = useCallback(
    (subscriptionOrder) => (
      <Space size="small" direction="vertical" align="left">
        {(subscriptionOrder.product_details['SESSION'] || subscriptionOrder.product_details['VIDEO']) &&
          generateRemainingCreditsText(subscriptionOrder, false)}
        {subscriptionOrder.product_details['COURSE'] && generateRemainingCreditsText(subscriptionOrder, true)}
      </Space>
    ),
    [generateRemainingCreditsText]
  );

  const memberColumns = [
    {
      title: 'First Name',
      dataIndex: ['user', 'first_name'],
      width: '150px',
    },
    {
      title: 'Last Name',
      dataIndex: ['user', 'last_name'],
      width: '150px',
      render: (text, record) => record.user.last_name || '-',
    },
    {
      title: 'Purchase/Renew Date',
      dataIndex: ['subscription_order', 'purchase_date'],
      render: (text) => (text ? toShortDateWithYear(text) : '-'),
    },
    {
      title: 'Expiry Date',
      dataIndex: ['subscription_order', 'expiry'],
      render: (text) => toShortDateWithYear(text),
    },
    {
      title: 'Remaining Credits',
      dataIndex: ['subscription_order', 'subscription_order_id'],
      render: (text, record) => renderRemainingCreditsForSubscription(record.subscription_order),
    },
  ];

  return (
    <div className={styles.box}>
      <Loader loading={isLoading}>
        <PageHeader
          onBack={() => history.goBack()}
          title={`${subscriptionDetails ? subscriptionDetails.name : 'Subscription'} Members`}
        />

        <Row gutter={[12, 12]}>
          <Col xs={24}>
            <Table
              columns={memberColumns}
              data={subscriptionMembers}
              loading={isLoading}
              rowKey={(record) => record.user.external_id}
            />
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default SubscriptionMembersList;
