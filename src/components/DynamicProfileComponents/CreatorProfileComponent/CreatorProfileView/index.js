import React, { useState } from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { useLocation } from 'react-router-dom';

import { Row, Col, Image, Space, Typography, Divider, Skeleton } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import { getExternalLink } from 'utils/url';
import { socialMediaIcons } from 'utils/constants';

import styles from './styles.module.scss';

const { Title } = Typography;

const CreatorProfileView = ({ creatorProfile, isEditing, isContained }) => {
  let { search } = useLocation();
  const query = new URLSearchParams(search);
  localStorage.setItem('ref', JSON.stringify(query.get('ref')));

  const { cover_image_url, profile_image_url, profile: profileData } = creatorProfile ?? {};

  const [shouldExpandCreatorBio, setShouldExpandCreatorBio] = useState(false);

  const showMoreCreatorBio = () => {
    setShouldExpandCreatorBio(true);
  };

  const checkSocialLinksExists = (linksObj) =>
    linksObj ? Object.entries(linksObj).filter(([key, val]) => val).length > 0 : false;

  const renderCreatorExternalLinks = () => {
    if (!creatorProfile || !creatorProfile.profile || !creatorProfile.profile.social_media_links) {
      return null;
    }

    const creatorSocialMediaLinks = Object.entries(creatorProfile.profile.social_media_links).filter(
      ([socialMedia, link]) => link
    );

    if (creatorSocialMediaLinks.length <= 0) {
      return null;
    }

    return (
      <Col xs={24} className={styles.socialIconWrapper}>
        <Space size={36} align="center" className={isContained ? undefined : styles.socialIconsList}>
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
    <Row className={isContained ? styles.containedCreatorProfileWrapper : styles.creatorProfileWrapper}>
      <Col xs={24} className={styles.coverImageWrapper}>
        <Image
          placeholder={<Skeleton.Image loading={true} width="100%" className={styles.coverImage} />}
          preview={false}
          width="100%"
          className={styles.coverImage}
          src={cover_image_url ?? 'error'}
        />
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
                <Image
                  placeholder={
                    <Skeleton
                      loading={true}
                      avatar={{ shape: 'circle', size: 'large', className: styles.profileImage }}
                    />
                  }
                  className={styles.profileImage}
                  preview={false}
                  src={profile_image_url ?? 'error'}
                />
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
          {isContained && (
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
          )}
        </Row>
      </Col>
      {renderCreatorExternalLinks()}
      {isEditing && <div className={styles.clickDisableOverlay} />}
    </Row>
  );
};

export default CreatorProfileView;
