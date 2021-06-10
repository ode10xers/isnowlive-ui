import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';
import { Row, Col, Button, Image, Space, Typography, Switch } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';
import Share from 'components/Share';
import DefaultImage from 'components/Icons/DefaultImage';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess } from 'utils/helper';
import NewsletterModal from 'components/NewsletterModal';
import styles from './styles.module.scss';
import { useLocation } from 'react-router-dom';
import apis from 'apis';

const { Title } = Typography;

const CreatorProfile = ({ profile, profileImage, showCoverImage = false, coverImage }) => {
  let { search } = useLocation();
  const query = new URLSearchParams(search);
  localStorage.setItem('ref', JSON.stringify(query.get('ref')));

  const [showNewsletterModalVisible, setNewsletterModalVisible] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(profile || null);
  const [isLoading, setIsLoading] = useState(false);

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

    if (isMobileDevice) {
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

  return (
    <Row className={styles.imageWrapper} gutter={[8, 8]} justify="space-around">
      {showCoverImage && (
        <Col xs={24} className={styles.coverImageWrapper}>
          <Image
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
          <Image preview={false} width={'100%'} src={profileImage || 'error'} fallback={DefaultImage()} />
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
        <div className={styles.bio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
      </Col>
      <Col xs={24} md={{ span: 22 }}>
        <Row gutter={[8, 8]}>
          <Col xs={24} md={7}>
            {creatorProfile?.profile?.social_media_links && (
              <Space size={'middle'}>
                {creatorProfile.profile.social_media_links.website && (
                  <a
                    href={`${creatorProfile.profile.social_media_links.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlobalOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.facebook_link && (
                  <a
                    href={`${creatorProfile.profile.social_media_links.facebook_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FacebookOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.twitter_link && (
                  <a
                    href={`${creatorProfile.profile.social_media_links.twitter_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TwitterOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.instagram_link && (
                  <a
                    href={`${creatorProfile.profile.social_media_links.instagram_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InstagramOutlined className={styles.socialIcon} />
                  </a>
                )}
                {creatorProfile.profile.social_media_links.linkedin_link && (
                  <a
                    href={`${creatorProfile.profile.social_media_links.linkedin_link}`}
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
