import React, { useState, useEffect } from 'react';
import { Row, Col, Image, Space, Typography } from 'antd';
import ReactHtmlParser from 'react-html-parser';

import DefaultImage from '../Icons/DefaultImage/index';
import { isMobileDevice } from 'utils/device';

import { getExternalLink } from 'utils/url';
import { socialMediaIcons } from 'utils/constants';

import styles from './styles.module.scss';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';

const { Title, Text } = Typography;

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

  const generateCreatorProfileLink = () => {
    const creatorUsername = host?.username || getUsernameFromUrl();
    return generateUrlFromUsername(creatorUsername);
  };

  const renderCreatorExternalLinks = () => {
    if (!host || !host.profile || !host.profile.social_media_links) {
      return null;
    }

    const creatorSocialMediaLinks = Object.entries(host.profile.social_media_links).filter(
      ([socialMedia, link]) => link
    );

    if (creatorSocialMediaLinks.length <= 0) {
      return null;
    }

    return (
      <Col xs={24} className={styles.socialIconWrapper}>
        <Space size={36} align="center" className={styles.socialIconsList}>
          {creatorSocialMediaLinks.map(([socialMedia, link]) => {
            const IconElement = socialMediaIcons[socialMedia];

            return (
              <a href={getExternalLink(link)} target="_blank" rel="noopener noreferrer">
                <IconElement />
              </a>
            );
          })}
        </Space>
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <Row>
        <Col>
          <Title level={5} className={styles.creatorName}>
            Host
          </Title>
          <Row>
            <Col xs={24} lg={6} md={6}>
              <Image
                preview={false}
                className={isMobileDevice ? styles.profileImageSmall : styles.profileImage}
                width={isMobileDevice ? 80 : 120}
                height={isMobileDevice ? 80 : 120}
                src={host?.profile_image_url ? host?.profile_image_url : 'error'}
                fallback={DefaultImage()}
                onClick={() => {
                  window.location.href = generateCreatorProfileLink();
                }}
              />
            </Col>
            <Col xs={24} lg={18} md={18}>
              <Text className={styles.creatorName}>
                {host?.first_name} {host?.last_name}
              </Text>
              <Text className={styles.creatorNameTitle}>Frontend Deveoloper | Programming Enthusiast</Text>
            </Col>
          </Row>
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
          {renderCreatorExternalLinks()}
        </Col>
      </Row>
    </div>
  );
};

export default HostDetails;
