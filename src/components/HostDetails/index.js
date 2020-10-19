import React from 'react';
import { Row, Col, Image, Space, Typography } from 'antd';
import { GlobalOutlined, FacebookOutlined, TwitterOutlined, InstagramOutlined } from '@ant-design/icons';

import DefaultImage from '../Icons/DefaultImage/index';
import { isMobileDevice } from '../../utils/device';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const HostDetails = ({ host }) => {
  return (
    <div className={styles.box}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={5}>Host</Title>
        </Col>
        <Col xs={12} md={12}>
          <Image
            className={isMobileDevice ? styles.profileImageSmall : styles.profileImage}
            width={isMobileDevice ? 80 : 120}
            height={isMobileDevice ? 80 : 120}
            src={host?.profile.profile_image_url ? host?.profile.profile_image_url : 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col xs={12} md={12}>
          <Title className={styles.mt10} level={4}>
            {host?.first_name} {host?.last_name}
          </Title>
          <Title level={5}>Full Profile</Title>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Text>{host?.profile?.description}</Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Space size={'middle'}>
            <a href="#/" target="_blank" rel="noopener noreferrer">
              <GlobalOutlined className={styles.socialIcon} />
            </a>
            <a href="#/" target="_blank" rel="noopener noreferrer">
              <FacebookOutlined className={styles.socialIcon} />
            </a>
            <a href="#/" target="_blank" rel="noopener noreferrer">
              <TwitterOutlined className={styles.socialIcon} />
            </a>
            <a href="#/" target="_blank" rel="noopener noreferrer">
              <InstagramOutlined className={styles.socialIcon} />
            </a>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default HostDetails;
