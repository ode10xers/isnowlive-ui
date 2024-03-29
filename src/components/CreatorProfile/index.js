import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { useLocation } from 'react-router-dom';

import { Row, Col, Button, Image, Space, Typography, Grid, Switch } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import Share from 'components/Share';
import DefaultImage from 'components/Icons/DefaultImage';
import NewsletterModal from 'components/NewsletterModal';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { getExternalLink, generateUrlFromUsername } from 'utils/url';
import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const CreatorProfile = ({ profile, profileImage, showCoverImage = false, coverImage }) => {
  const { lg } = useBreakpoint();

  let { search } = useLocation();
  const query = new URLSearchParams(search);
  localStorage.setItem('invite', JSON.stringify(query.get('invite')));

  const [showNewsletterModalVisible, setNewsletterModalVisible] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(profile || null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldExpandCreatorBio, setShouldExpandCreatorBio] = useState(false);

  const isInCreatorDashboard = window.location.pathname.includes('/creator/dashboard');

  const closeNewsletterModal = () => {
    setNewsletterModalVisible(false);
  };

  const showNewsletterModal = () => {
    setNewsletterModalVisible(true);
    resetBodyStyle();
  };

  const renderCreatorName = () => {
    const creatorName = `${creatorProfile?.first_name} ${creatorProfile?.last_name}`;

    let headingLevel = 2;

    if (!lg) {
      headingLevel = 4;

      if (creatorName.length > 15) {
        headingLevel = 5;
      }
    } else {
      if (creatorName.length > 15) {
        headingLevel = 3;
      }
    }

    return <Title level={headingLevel}>{creatorName}</Title>;
  };

  const updateCollectEmailFlag = async (checked) => {
    setIsLoading(true);
    const creatorProfileData = creatorProfile;

    try {
      const payload = {
        ...creatorProfileData,
        profile: {
          ...creatorProfileData?.profile,
          collect_emails: checked,
        },
      };

      const { status } = await apis.user.updateProfile(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Successfully updated newsletter signup settings');
        setCreatorProfile(payload);
      }
    } catch (error) {
      showErrorModal(
        'Failed updating newsletter signup setting',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (profile) {
      setCreatorProfile(profile);
    }
  }, [profile]);

  const showMoreCreatorBio = () => {
    setShouldExpandCreatorBio(true);
  };

  return (
    <Row className={styles.imageWrapper} gutter={[8, 8]} justify="space-around">
      {showCoverImage && (
        <Col xs={24} className={styles.coverImageWrapper}>
          <Image
            loading="lazy"
            preview={false}
            width={coverImage ? '100%' : 200}
            className={styles.coverImage}
            src={coverImage ? coverImage : 'error'}
            fallback={DefaultImage()}
          />
        </Col>
      )}
      <Col
        xs={24}
        className={classNames(styles.profileImageWrapper, showCoverImage && coverImage ? styles.withCover : undefined)}
      >
        <div className={styles.profileImage}>
          <Image
            loading="lazy"
            preview={false}
            width={'100%'}
            src={profileImage || 'error'}
            fallback={DefaultImage()}
          />
          <div className={styles.userName}>{renderCreatorName()}</div>
          <div className={styles.shareButton}>
            <Share
              label="Share"
              shareUrl={generateUrlFromUsername(creatorProfile?.username)}
              title={`${creatorProfile?.first_name} ${creatorProfile?.last_name}`}
            />
          </div>
        </div>
      </Col>
      <Col xs={24} md={{ span: 22 }}>
        {shouldExpandCreatorBio ? (
          <div className={styles.bio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
        ) : (
          <>
            <div className={styles.collapsedBio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
            <div className={styles.readMoreText} onClick={showMoreCreatorBio}>
              Read More
            </div>
          </>
        )}
      </Col>
      <Col xs={24} md={{ span: 22 }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={7}>
            {creatorProfile?.profile?.social_media_links && (
              <Space size={'middle'}>
                {creatorProfile.profile.social_media_links.website && (
                  <a
                    href={getExternalLink(creatorProfile?.profile?.social_media_links?.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlobalOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.facebook_link && (
                  <a
                    href={getExternalLink(creatorProfile.profile.social_media_links.facebook_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FacebookOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.twitter_link && (
                  <a
                    href={getExternalLink(creatorProfile.profile.social_media_links.twitter_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TwitterOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.instagram_link && (
                  <a
                    href={getExternalLink(creatorProfile.profile.social_media_links.instagram_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InstagramOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.linkedin_link && (
                  <a
                    href={getExternalLink(creatorProfile.profile.social_media_links.linkedin_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkedinOutlined className={styles.socialIcon} />
                  </a>
                )}
              </Space>
            )}
          </Col>

          <Col xs={24} md={17}>
            <Row gutter={[8, 8]} justify="end">
              {isInCreatorDashboard && (
                <>
                  <Col xs={20} md={10} className={styles.textAlignRight}>
                    Show newsletter signup button here?
                  </Col>
                  <Col xs={4} md={2}>
                    <Switch
                      loading={isLoading}
                      checked={creatorProfile?.profile?.collect_emails}
                      onChange={updateCollectEmailFlag}
                    />
                  </Col>
                </>
              )}
              {(isInCreatorDashboard || creatorProfile?.profile?.collect_emails) && (
                <Col xs={24} md={8}>
                  <NewsletterModal visible={showNewsletterModalVisible} closeModal={closeNewsletterModal} />
                  <Button
                    block
                    type="primary"
                    disabled={isInCreatorDashboard && !creatorProfile?.profile?.collect_emails}
                    onClick={() => showNewsletterModal()}
                  >
                    Subscribe to newsletter
                  </Button>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default CreatorProfile;
