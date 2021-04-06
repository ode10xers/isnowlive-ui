import React, { useState, useEffect } from 'react';
import { Row, Col, Image, Space, Typography } from 'antd';
import { GlobalOutlined, FacebookOutlined, TwitterOutlined, InstagramOutlined } from '@ant-design/icons';
import ReactHtmlParser from 'react-html-parser';

import DefaultImage from '../Icons/DefaultImage/index';
import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';

const { Title } = Typography;

const HostDetails = ({ host }) => {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    // Timeout need as it take some time to paint the dom
    setTimeout(() => {
      if (document.getElementsByClassName('ant-typography-expand').length) {
        for (let i = 0; i < document.getElementsByClassName('ant-typography-expand').length; i++) {
          document.getElementsByClassName('ant-typography-expand')[i].innerText = 'Read more';
        }
      }
    }, 200);
  }, [host]);

  const redirectToCreatorProfile = () => {
    const creatorUsername = host?.username || getUsernameFromUrl();
    window.location.href = generateUrlFromUsername(creatorUsername);
  };

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
            onClick={() => redirectToCreatorProfile()}
          />
        </Col>
        <Col xs={24}>
          <Title className={styles.creatorName} level={4} onClick={() => redirectToCreatorProfile()}>
            {host?.first_name} {host?.last_name}
          </Title>
          <Title level={5} className={styles.fullProfile} onClick={() => redirectToCreatorProfile()}>
            Full Profile
          </Title>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          {showMore ? (
            <div className={styles.longTextExpanded}>{ReactHtmlParser(host?.profile?.bio)}</div>
          ) : (
            <>
              <div className={styles.creatorBio}>{ReactHtmlParser(host?.profile?.bio)}</div>
              <div className={styles.readMoreText} onClick={() => setShowMore(true)}>
                Read More
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
