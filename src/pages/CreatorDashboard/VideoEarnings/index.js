import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, Empty, message } from 'antd';
import { useHistory } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import Loader from 'components/Loader';
import ShowAmount from 'components/ShowAmount';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, getPaymentStatus } from 'utils/helper';

import { mixPanelEventTags, trackSimpleEvent } from 'services/integrations/mixpanel';

import styles from './styles.module.scss';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const {
  formatDate: { toLongDateWithTime },
} = dateUtil;
const { creator } = mixPanelEventTags;

const VideoEarnings = ({ match }) => {
  const { t: translate } = useTranslation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);

  const getEarningData = useCallback(
    async (video_id) => {
      try {
        const { status, data } = await apis.videos.getEarningsByVideoId(video_id);
        if (isAPISuccess(status)) {
          setIsLoading(false);
          setEarnings(data);
        }
      } catch (error) {
        message.error(error.response?.data?.message || translate('UNABLE_TO_FETCH_VIDEO_EARNING_DETAILS'));
        setTimeout(() => {
          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount);
        }, 1500);
      }
    },
    [history]
  );

  useEffect(() => {
    if (match?.params?.video_id) {
      getEarningData(match?.params?.video_id);
    } else {
      message.error(translate('UNABLE_FIND_VIDEO'));
      setTimeout(() => {
        history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount);
      }, 1500);
    }
  }, [getEarningData, history, match.params.video_id]);

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
  };

  const showVideoLayout = (title, details) => (
    <div className={styles.box2}>
      <Row>
        <Col xs={24}>
          <Text type="secondary">{title}</Text>
        </Col>
        <Col xs={24}>{details}</Col>
      </Row>
    </div>
  );

  const showVideoName = showVideoLayout(
    translate('VIDEO_NAME'),
    <Title level={isMobileDevice ? 5 : 3}>{earnings?.name}</Title>
  );

  const showVideoEarnings = showVideoLayout(
    translate('TOTAL_EARNING'),
    <ShowAmount amount={earnings?.total_earned} currency={earnings?.currency.toUpperCase()} />
  );

  let videoColumns = [
    {
      title: translate('ATTENDEE_NAME'),
      key: 'name',
      width: '12%',
      render: (record) => <Text className={styles.textAlignLeft}>{record.name}</Text>,
    },
    {
      title: translate('DATE'),
      dataIndex: 'booking_time',
      key: 'booking_time',
      width: '5%',
      render: (text, record) => <Text>{toLongDateWithTime(record.booking_time)}</Text>,
    },
    {
      title: translate('AMOUNT'),
      dataIndex: 'total_price',
      key: 'total_price',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.total_price}
        </Text>
      ),
    },
    {
      title: translate('FEES'),
      dataIndex: 'platform_fees',
      key: 'platform_fees',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.platform_fees}
        </Text>
      ),
    },
    {
      title: translate('FEES'),
      dataIndex: 'net_price',
      key: 'net_price',
      width: '5%',
      render: (text, record) => (
        <Text>
          {record.currency.toUpperCase()} {record.net_price}
        </Text>
      ),
    },
    {
      title: translate('STATUS'),
      dataIndex: 'status',
      key: 'status',
      width: '5%',
      render: (text, record) => <Text>{getPaymentStatus(record.status)}</Text>,
    },
  ];

  const renderVideoItem = (item) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card className={styles.card} title={<Text>{item.name}</Text>}>
        {layout(translate('DATE'), <Text>{toLongDateWithTime(item.booking_time)}</Text>)}
        {layout(
          translate('AMOUNT'),
          <Text>
            {item.currency.toUpperCase()} {item.total_price}
          </Text>
        )}
        {layout(
          translate('FEES'),
          <Text>
            {item.currency.toUpperCase()} {item.platform_fees}
          </Text>
        )}
        {layout(
          translate('NET'),
          <Text>
            {item.currency.toUpperCase()} {item.net_price}
          </Text>
        )}
        {layout(translate('STATUS'), <Text>{getPaymentStatus(item.status)}</Text>)}
      </Card>
    );
  };

  return (
    <Loader loading={isLoading} size="large" text={translate('LOADING_EARNING_DETAILS')}>
      <div className={styles.box}>
        <Row justify="start" className={classNames(styles.mt20, styles.mb20)}>
          <Col xs={24} md={4}>
            <Button
              className={styles.headButton}
              onClick={() =>
                trackAndNavigate(
                  Routes.creatorDashboard.rootPath + Routes.creatorDashboard.paymentAccount,
                  creator.click.payment.backToEarningDashboard
                )
              }
              icon={<ArrowLeftOutlined />}
            >
              {translate('ALL_EARNINGS')}
            </Button>
          </Col>
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}>{translate('VIDEO_EARNING_DETAILS')}</Title>
          </Col>
          <Col xs={24} md={16}>
            {showVideoName}
          </Col>
          <Col xs={24} md={8}>
            {showVideoEarnings}
          </Col>
        </Row>
        <Row className={styles.mt50}>
          <Col xs={24} md={24}>
            <Title level={5}>Attendee Details</Title>
          </Col>
          <Col xs={24} md={24}>
            {isMobileDevice ? (
              <>
                {earnings?.details?.length > 0 ? (
                  earnings.details.map(renderVideoItem)
                ) : (
                  <div className={classNames(styles.textAlignCenter, 'text-empty')}>
                    <Empty description={translate('NO_DATA')} />
                  </div>
                )}
              </>
            ) : (
              <Table columns={videoColumns} data={earnings?.details} loading={isLoading} />
            )}
          </Col>
        </Row>
      </div>
    </Loader>
  );
};

export default VideoEarnings;
