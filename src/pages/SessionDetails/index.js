import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography } from 'antd';
import classNames from 'classnames';

import Routes from 'routes';
import apis from 'apis';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import SessionRegistration from 'components/SessionRegistration';
import Loader from 'components/Loader';
import DefaultImage from 'components/Icons/DefaultImage/index';
import HostDetails from 'components/HostDetails';
import Share from 'components/Share';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './style.module.scss';

const reservedDomainName = ['app', 'localhost'];
const { Title } = Typography;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);

  const getDetails = useCallback(
    async (username, inventory_id) => {
      try {
        const inventoryDetails = await apis.session.getPublicInventoryById(inventory_id);
        const userDetails = await apis.user.getProfileByUsername(username);
        setSession(inventoryDetails.data);
        setCreator(userDetails.data);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.root);
      }
    },
    [history]
  );

  useEffect(() => {
    if (match.params.inventory_id) {
      const username = window.location.hostname.split('.')[0];
      if (username && !reservedDomainName.includes(username)) {
        getDetails(username, match.params.inventory_id);
      }
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }
  }, [match.params.inventory_id, getDetails]);

  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            width={'100%'}
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
          <SessionDate schedule={session} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} md={12}>
          <SessionInfo session={session} />
        </Col>
        <Col xs={24} md={9}></Col>
        {creator && (
          <Col xs={24} md={3}>
            <Share
              label="Share"
              shareUrl={`${generateUrlFromUsername(creator?.username)}/inventory/${session.inventory_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
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
          <HostDetails host={creator} />
        </Col>
        <Col xs={24} md={15} className={styles.mt50}>
          <SessionRegistration onFinish={onFinish} />
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
