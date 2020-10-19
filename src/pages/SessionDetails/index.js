import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Image, message, Typography, Button } from 'antd';
import apis from 'apis';
import { ShareAltOutlined } from '@ant-design/icons';

import Routes from '../../routes';
import SessionDate from '../../components/SessionDate';
import SessionInfo from '../../components/SessionInfo';
import SessionRegistration from '../../components/SessionRegistration';
import Loader from '../../components/Loader';
import DefaultImage from '../../components/Icons/DefaultImage/index';
import HostDetails from '../../components/HostDetails';
import { isMobileDevice } from '../../utils/device';

import styles from './style.module.scss';

const { Title } = Typography;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null);

  const getSessionDetails = useCallback(
    async (sessionId) => {
      try {
        const { data } = await apis.session.getDetails(sessionId);
        if (data?.session) {
          setSession(data.session);
          setStaff(data.staff);
          setIsLoading(false);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.session);
      }
    },
    [history]
  );

  useEffect(() => {
    if (match.params.id) {
      getSessionDetails(match.params.id);
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }
  }, [getSessionDetails, match.params.id]);

  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            width={session?.session_image_url ? '100%' : 200}
            height={300}
            className={classNames(styles.coverImage, styles.mb20)}
            src={session?.session_image_url || 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col xs={24} md={15}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
        <Col xs={24} md={9}>
          <SessionDate schedule={session?.schedules[0]} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} md={12}>
          <SessionInfo session={session} />
        </Col>
        <Col xs={24} md={9}></Col>
        <Col xs={24} md={3}>
          <Button icon={<ShareAltOutlined />}>Share</Button>
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} md={14}>
          <Title level={5}>Session Information</Title>
          <Title type="secondary" level={5}>
            {session?.description}
          </Title>
          <Title level={5} className={styles.mt50}>
            Session Prerequisite
          </Title>
          <Title type="secondary" level={5}>
            {session?.prerequisites}
          </Title>
        </Col>
        <Col xs={24} md={1}></Col>
        <Col xs={24} md={9}>
          <HostDetails host={staff} />
        </Col>
        <Col xs={24} md={15} className={styles.mt50}>
          <SessionRegistration onFinish={onFinish} />
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
