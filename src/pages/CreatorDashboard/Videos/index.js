import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card, Image } from 'antd';
import { EditOutlined, CloudUploadOutlined, DownOutlined, UpOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { isMobileDevice } from 'utils/device';
import dateUtil from 'utils/date';
import DefaultImage from 'components/Icons/DefaultImage';
import UploadVideoModal from 'components/UploadVideoModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const Videos = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showUploadVideoModal = (video = null) => {
    if (video !== null) {
      setSelectedVideo(video);
    }
    setCreateModalVisible(true);
  };

  const hideUploadVideoModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setSelectedVideo(null);

    if (shouldRefresh) {
      getVideosForCreator();
    }
  };

  const publishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.publishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Published');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.unpublishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Unpublished');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.videos.getCreatorVideos();
      console.log(data);
      setVideos([
        {
          title: 'Test Video 1',
          description:
            '\u003cp\u003e\u003cspan style="color: rgb(0,0,0);background-color: rgb(255,255,255);font-size: 14px;font-family: Open Sans", Arial, sans-serif;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. Cras molestie diam id varius tristique. In felis nisi, lacinia ac urna vitae, pulvinar dapibus mauris. Integer consectetur ultricies arcu, nec elementum leo bibendum a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ultricies arcu ex, vulputate congue ante tempor ut. Phasellus ut risus eu justo egestas lobortis nec at lectus. Pellentesque at orci purus. Nam eleifend lectus ante, vel vulputate enim lobortis id. Morbi ut libero vitae risus porta interdum eu eget nulla. Nam porta efficitur magna, quis elementum elit viverra id. Donec sagittis dapibus felis eu imperdiet. Donec ut urna egestas, venenatis ex vitae, pretium diam. Aenean rutrum justo sit amet commodo scelerisque.\u003c/span\u003e\u003c/p\u003e\n',
          validity: 24,
          price: 10,
          currency: 'SGD',
          thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/mbzyHe0nLTcCMArD_difpsf3i2n68p22m_op.jpg',
          sessions: [
            {
              session_id: 62,
              price: 0,
              currency: '',
              max_participants: 2,
              group: true,
              name: 'test sesison',
              description: 'some session details',
              session_image_url:
                'https://dkfqbuenrrvge.cloudfront.net/image/cudRIEOMNoFVnyWD_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
              category: '',
              sub_category: '',
              duration: 0,
              document_url: '',
              beginning: '0001-01-01 00:00:00 +0000 +0000',
              expiry: '0001-01-01 00:00:00 +0000 +0000',
              prerequisites: '',
              pay_what_you_want: false,
              recurring: false,
              is_active: true,
              is_refundable: false,
              refund_before_hours: 0,
              color_code: '',
            },
            {
              session_id: 72,
              price: 10,
              currency: 'SGD',
              max_participants: 2,
              group: true,
              name: 'New session',
              description:
                '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
              session_image_url:
                'https://dkfqbuenrrvge.cloudfront.net/image/55eQ4KNcglY5ipnc_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
              category: '',
              sub_category: '',
              duration: 0,
              document_url: 'https://dkfqbuenrrvge.cloudfront.net/document/lc1nnjFflOFV4fW4_test.pdf',
              beginning: '2020-12-01 00:00:00 +0000 +0000',
              expiry: '2020-12-31 00:00:00 +0000 +0000',
              prerequisites:
                '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
              pay_what_you_want: false,
              recurring: true,
              is_active: true,
              is_refundable: false,
              refund_before_hours: 24,
              color_code: '',
            },
          ],
          external_id: '7a4a977f-4504-4ac6-b22e-be4571c23ce0',
          is_published: true,
          video_url: '',
          video_uid: '',
          duration: 0,
          status: '',
        },
        {
          title: 'Test Video 1',
          description:
            '\u003cp\u003e\u003cspan style="color: rgb(0,0,0);background-color: rgb(255,255,255);font-size: 14px;font-family: Open Sans", Arial, sans-serif;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. Cras molestie diam id varius tristique. In felis nisi, lacinia ac urna vitae, pulvinar dapibus mauris. Integer consectetur ultricies arcu, nec elementum leo bibendum a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ultricies arcu ex, vulputate congue ante tempor ut. Phasellus ut risus eu justo egestas lobortis nec at lectus. Pellentesque at orci purus. Nam eleifend lectus ante, vel vulputate enim lobortis id. Morbi ut libero vitae risus porta interdum eu eget nulla. Nam porta efficitur magna, quis elementum elit viverra id. Donec sagittis dapibus felis eu imperdiet. Donec ut urna egestas, venenatis ex vitae, pretium diam. Aenean rutrum justo sit amet commodo scelerisque.\u003c/span\u003e\u003c/p\u003e\n',
          validity: 24,
          price: 10,
          currency: 'SGD',
          thumbnail_url: 'https://dkfqbuenrrvge.cloudfront.net/image/mbzyHe0nLTcCMArD_difpsf3i2n68p22m_op.jpg',
          sessions: [
            {
              session_id: 62,
              price: 0,
              currency: '',
              max_participants: 2,
              group: true,
              name: 'test sesison',
              description: 'some session details',
              session_image_url:
                'https://dkfqbuenrrvge.cloudfront.net/image/cudRIEOMNoFVnyWD_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
              category: '',
              sub_category: '',
              duration: 0,
              document_url: '',
              beginning: '0001-01-01 00:00:00 +0000 +0000',
              expiry: '0001-01-01 00:00:00 +0000 +0000',
              prerequisites: '',
              pay_what_you_want: false,
              recurring: false,
              is_active: true,
              is_refundable: false,
              refund_before_hours: 0,
              color_code: '',
            },
            {
              session_id: 73,
              price: 10,
              currency: 'SGD',
              max_participants: 2,
              group: true,
              name: 'New session',
              description:
                '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
              session_image_url:
                'https://dkfqbuenrrvge.cloudfront.net/image/55eQ4KNcglY5ipnc_bsyh8th6gydes21e_mg-cthu--1h_nn3nqzi-unsplash.jpg',
              category: '',
              sub_category: '',
              duration: 0,
              document_url: 'https://dkfqbuenrrvge.cloudfront.net/document/lc1nnjFflOFV4fW4_test.pdf',
              beginning: '2020-12-01 00:00:00 +0000 +0000',
              expiry: '2020-12-31 00:00:00 +0000 +0000',
              prerequisites:
                '\u003cp\u003e\u003cspan style="color: rgba(0,0,0,0.45);background-color: rgb(255,255,255);font-size: 14px;font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji;"\u003eLorem ipsum dolor sit amet, consectetur adipiscing elit. In velit neque, pharetra sit amet interdum eu, sollicitudin sit amet mi. Integer porta auctor mauris nec pellentesque. Mauris egestas, justo non porta venenatis, mauris dui luctus odio, quis pharetra neque dui viverra leo. Morbi vitae semper ante. Cras convallis nisl luctus lorem rutrum, a bibendum ligula ultrices. Phasellus est arcu, porta eget velit vel, porta tempus justo. Integer leo nibh, vestibulum at risus vitae, tempus malesuada tortor. Vestibulum a odio quis metus hendrerit tristique. Sed nec laoreet eros. Curabitur facilisis justo eget est faucibus, et vulputate purus maximus. Donec maximus velit enim, et blandit nisi ornare eget. Suspendisse vel pretium risus, vel tincidunt tortor. Nam congue, odio et pellentesque laoreet, quam diam luctus purus, sit amet dictum massa justo et metus. Cras tincidunt lectus sed dapibus luctus. Duis sit amet dui quam. Suspendisse iaculis, enim id condimentum condimentum, lacus nunc tempor erat, id auctor felis elit dictum nulla. Nunc tincidunt, risus ut venenatis interdum, enim ex lacinia eros, id volutpat quam nisi et odio. Aliquam imperdiet sem ligula, eu mollis sapien auctor sit amet. Integer at maximus urna, quis vehicula lorem. Praesent eu semper risus, ut tincidunt erat. Nulla finibus urna orci, ac viverra tortor consequat a. Duis commodo commodo massa id vehicula. Vestibulum a gravida urna. Donec purus orci, congue nec fringilla quis, porta tempus nulla. Maecenas mollis orci nibh, nec hendrerit metus interdum ac. Nunc suscipit scelerisque pellentesque. Mauris aliquam lectus in blandit vestibulum. Nunc pretium dui non metus tincidunt pretium. Praesent eleifend mauris vel malesuada varius.\u003c/span\u003e\u003c/p\u003e\n',
              pay_what_you_want: false,
              recurring: true,
              is_active: true,
              is_refundable: false,
              refund_before_hours: 24,
              color_code: '',
            },
          ],
          external_id: '7a4a977f-4504-4ac6-b22e-be4571c23ce0',
          is_published: true,
          video_url: '',
          video_uid: '',
          duration: 0,
          status: '',
        },
      ]);

      // if (data) {
      //   setVideos(
      //     data.map((classPass, index) => ({
      //       index,
      //       key: classPass.id,
      //       id: classPass.id,
      //       name: classPass.name,
      //       price: classPass.price,
      //       limited: classPass.limited,
      //       currency: classPass.currency,
      //       validity: classPass.validity,
      //       class_count: classPass.class_count,
      //       is_published: classPass.is_published,
      //       session_ids: classPass.session_ids,
      //       sales: classPass.sales.map((subs) => ({ ...subs, currency: classPass.currency })),
      //       color_code: classPass.color_code,
      //     }))
      //   );
      // }
    } catch (error) {
      showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getVideosForCreator();
    //eslint-disable-next-line
  }, []);

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(videos.map((video) => video.id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const videosColumns = [
    {
      title: '',
      dataIndex: 'thumnail_url',
      key: 'thumnail_url',
      align: 'center',
      width: '12%',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: (
            <Image
              src={record.thumbnail_url || 'error'}
              alt={record.title}
              height={50}
              width={100}
              fallback={DefaultImage()}
            />
          ),
        };
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
      render: (text, record) => (
        <>
          {record.is_published ? null : <EyeInvisibleOutlined />}
          <Text> {record.title} </Text>
        </>
      ),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} Hour${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '10%',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={4}>
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={5}>
            {record.is_published ? (
              <Tooltip title="Hide Session">
                <Button type="link" danger onClick={() => unpublishVideo(record.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Session">
                <Button type="link" className={styles.successBtn} onClick={() => publishVideo(record.id)}>
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={6}>
            {expandedRowKeys.includes(record.id) ? (
              <Button type="link" onClick={() => collapseRow(record.id)}>
                {`${record?.sales?.length || 0} Sales `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.id)}>
                {`${record?.sales?.length || 0} Sales`} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const salesColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '30%',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: 'Net Price',
      dataIndex: 'price_paid',
      key: 'price_paid',
      render: (text, record) => `${record.price_paid} ${record.currency}`,
    },
  ];

  const renderSalesList = (record) => {
    return (
      <div className={styles.mb20}>
        <Table
          columns={salesColumns}
          data={record.sales}
          loading={isLoading}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileSubscriberCards = (subscriber) => (
    <Card>
      <Row>
        <Col xs={24}>
          <Title level={5}> {subscriber.name} </Title>
        </Col>
        <Col xs={24}>
          <Text> Purchased at {toDateAndTime(subscriber.date_of_purchase)} </Text>
        </Col>
        <Col xs={24}>
          <Text> {`${subscriber.price_paid} ${subscriber.currency}`} </Text>
        </Col>
      </Row>
    </Card>
  );

  const renderVideoItem = (video) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          className={styles.card}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${video.color_code || '#FFF'}` }}>
              <Text>{video.name}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            video.is_published ? (
              <Tooltip title="Hide Session">
                <Button type="link" danger onClick={() => unpublishVideo(video.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Session">
                <Button type="link" className={styles.successBtn} onClick={() => publishVideo(video.id)}>
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(video.id) ? (
              <Button type="link" onClick={() => collapseRow(video.id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(video.id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout('Validity', <Text>{`${video.validity} days`}</Text>)}
          {layout('Price', <Text>{`${video.price} ${video.currency}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(video.id) && (
          <Row className={styles.cardExpansion}>
            <div className={styles.mb20}>{video.sales.map(renderMobileSubscriberCards)}</div>
          </Row>
        )}
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <UploadVideoModal
        visible={createModalVisible}
        closeModal={hideUploadVideoModal}
        editedVideo={selectedVideo}
        updateEditedVideo={setSelectedVideo}
      />
      <Row gutter={[8, 24]}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> Videos </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24} md={8} lg={6}>
          <Button block type="primary" onClick={() => showUploadVideoModal()} icon={<CloudUploadOutlined />}>
            Upload New Video
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading Videos">
              <Row gutter={[8, 16]}>{videos.map(renderVideoItem)}</Row>
            </Loader>
          ) : (
            <Table
              sticky={true}
              columns={videosColumns}
              data={videos}
              loading={isLoading}
              rowKey={(record) => record.external_id}
              expandable={{
                expandedRowRender: (record) => renderSalesList(record),
                expandRowByClick: true,
                expandIconColumnIndex: -1,
                expandedRowKeys: expandedRowKeys,
              }}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
