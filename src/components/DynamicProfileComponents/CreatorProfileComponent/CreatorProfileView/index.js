import React, { useState } from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { useLocation } from 'react-router-dom';

import { Row, Col, Image, Space, Typography, Divider, Skeleton } from 'antd';
import {
  GlobalOutlined,
  TwitterOutlined,
  CaretDownOutlined,
  FacebookFilled,
  InstagramFilled,
  LinkedinFilled,
} from '@ant-design/icons';

import styles from './styles.module.scss';

const { Title } = Typography;

const CreatorProfileView = ({ creatorProfile, isEditing }) => {
  let { search } = useLocation();
  const query = new URLSearchParams(search);
  localStorage.setItem('ref', JSON.stringify(query.get('ref')));

  const { cover_image_url, profile_image_url, profile: profileData } = creatorProfile ?? {};

  const [shouldExpandCreatorBio, setShouldExpandCreatorBio] = useState(false);

  const getExternalLink = (link = null) => {
    if (link) {
      if (link.includes('//')) {
        return link;
      } else {
        return '//' + link;
      }
    } else {
      return '';
    }
  };

  const showMoreCreatorBio = () => {
    setShouldExpandCreatorBio(true);
  };

  const checkSocialLinksExists = (linksObj) =>
    linksObj ? Object.entries(linksObj).filter(([key, val]) => val).length > 0 : false;

  return (
    <Row className={styles.creatorProfileWrapper}>
      <Col xs={24} className={styles.coverImageWrapper}>
        {cover_image_url ? (
          <Image preview={false} width="100%" className={styles.coverImage} src={cover_image_url ?? 'error'} />
        ) : (
          <Skeleton.Image height={320} />
        )}
      </Col>
      <Col
        xs={24}
        className={classNames(
          styles.creatorDetailsWrapper,
          checkSocialLinksExists(profileData?.social_media_links) ? undefined : styles.bottomBorderRadius
        )}
      >
        <Row gutter={[8, 8]}>
          <Col xs={24} className={styles.profileImageWrapper}>
            <Row justify="center">
              <Col>
                {profile_image_url ? (
                  <Image className={styles.profileImage} preview={false} src={profile_image_url || 'error'} />
                ) : (
                  <Skeleton avatar shape="circle" size="large" />
                )}
              </Col>
            </Row>
          </Col>
          <Col xs={24}>
            <Title level={3} className={styles.creatorUsername}>
              {creatorProfile?.first_name} {creatorProfile?.last_name}
            </Title>
          </Col>
          <Col xs={24}>
            <Divider className={styles.creatorProfileDivider} />
          </Col>
          <Col xs={24} className={styles.creatorBio}>
            {shouldExpandCreatorBio ? (
              <div className={styles.bio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
            ) : (
              <>
                <div className={styles.collapsedBio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
                <div className={styles.readMoreBio} onClick={showMoreCreatorBio}>
                  READ MORE <CaretDownOutlined />
                </div>
              </>
            )}
          </Col>
        </Row>
      </Col>
      {checkSocialLinksExists(profileData?.social_media_links) ? (
        <Col xs={24} className={styles.socialIconWrapper}>
          <Space size={36} align="center" className={styles.socialIconsList}>
            {profileData?.social_media_links.website && (
              <a
                href={getExternalLink(profileData?.social_media_links?.website)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlobalOutlined className={styles.socialIcon} />
              </a>
            )}
            {profileData?.social_media_links.facebook_link ? (
              <a
                href={getExternalLink(profileData?.social_media_links.facebook_link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookFilled className={styles.socialIcon} />
              </a>
            ) : null}
            {profileData?.social_media_links.twitter_link ? (
              <a
                href={getExternalLink(profileData?.social_media_links.twitter_link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterOutlined className={styles.socialIcon} />
              </a>
            ) : null}
            {profileData?.social_media_links.instagram_link ? (
              <a
                href={getExternalLink(profileData?.social_media_links.instagram_link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramFilled className={styles.socialIcon} />
              </a>
            ) : null}
            {profileData?.social_media_links.linkedin_link ? (
              <a
                href={getExternalLink(profileData?.social_media_links.linkedin_link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinFilled className={styles.socialIcon} />
              </a>
            ) : null}
          </Space>
        </Col>
      ) : null}
      {isEditing && <div className={styles.clickDisableOverlay} />}
    </Row>
  );
};

export default CreatorProfileView;
