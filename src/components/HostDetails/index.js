import React, { useState, useEffect } from 'react';
import { Row, Col, Image, Space, Typography } from 'antd';
import { GlobalOutlined, FacebookOutlined, TwitterOutlined, InstagramOutlined } from '@ant-design/icons';
import ReactHtmlParser from 'react-html-parser';
import { useTranslation } from 'react-i18next';

import DefaultImage from '../Icons/DefaultImage/index';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const { Title } = Typography;

const HostDetails = ({ host }) => {
  const { t } = useTranslation();

  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    // Timeout need as it take some time to paint the dom
    setTimeout(() => {
      if (document.getElementsByClassName('ant-typography-expand').length) {
        for (let i = 0; i < document.getElementsByClassName('ant-typography-expand').length; i++) {
          document.getElementsByClassName('ant-typography-expand')[i].innerText = t('READ_MORE');
        }
      }
    }, 200);
  }, [host, t]);

  return (
    <div className={styles.box}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={5}>Host</Title>
        </Col>
        <Col flex={isMobileDevice ? '80px' : '120px'}>
          <Image
            preview={false}
            className={isMobileDevice ? styles.profileImageSmall : styles.profileImage}
            width={isMobileDevice ? 80 : 120}
            height={isMobileDevice ? 80 : 120}
            src={host?.profile_image_url ? host?.profile_image_url : 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col
          flex="auto"
          className={styles.pl10}
          style={{
            height: isMobileDevice ? 80 : 120,
          }}
        >
          <Title className={styles.mt10} level={4}>
            {host?.first_name} {host?.last_name}
          </Title>
          <Title level={5}> {t('FULL_PROFILE')} </Title>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          {showMore ? (
            <div className={styles.longTextExpanded}>{ReactHtmlParser(host?.profile?.bio)}</div>
          ) : (
            <>
              <div className={styles.creatorBio}>{ReactHtmlParser(host?.profile?.bio)}</div>
              <div className={styles.readMoreText} onClick={() => setShowMore(true)}>
                {t('READ_MORE')}
              </div>
            </>
          )}
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Space size={'middle'}>
            {host?.profile?.social_media_links.website && (
              <a href={`//${host.profile.social_media_links.website}`} target="_blank" rel="noopener noreferrer">
                <GlobalOutlined className={styles.socialIcon} />
              </a>
            )}
            {host?.profile?.social_media_links.facebook_link && (
              <a href={`${host.profile.social_media_links.facebook_link}`} target="_blank" rel="noopener noreferrer">
                <FacebookOutlined className={styles.socialIcon} />
              </a>
            )}
            {host?.profile?.social_media_links.twitter_link && (
              <a href={`${host.profile.social_media_links.twitter_link}`} target="_blank" rel="noopener noreferrer">
                <TwitterOutlined className={styles.socialIcon} />
              </a>
            )}
            {host?.profile?.social_media_links.instagram_link && (
              <a href={`${host.profile.social_media_links.instagram_link}`} target="_blank" rel="noopener noreferrer">
                <InstagramOutlined className={styles.socialIcon} />
              </a>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default HostDetails;
