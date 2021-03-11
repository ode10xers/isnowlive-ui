import React from 'react';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Image, Space, Typography } from 'antd';
import {
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';

import Share from 'components/Share';
import DefaultImage from 'components/Icons/DefaultImage';

import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Title } = Typography;

const CreatorProfile = ({ profile, profileImage, showCoverImage = false, coverImage }) => {
  return (
    <Row className={styles.imageWrapper} gutter={[8, 8]}>
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
          <div className={styles.userName}>
            <Title level={isMobileDevice ? 4 : 2}>
              {profile?.first_name} {profile?.last_name}
            </Title>
          </div>
          <div className={styles.shareButton}>
            <Share
              label="Share"
              shareUrl={generateUrlFromUsername(profile.username)}
              title={`${profile.first_name} ${profile.last_name}`}
            />
          </div>
        </div>
      </Col>
      <Col xs={24} md={{ span: 22, offset: 1 }}>
        <div className={styles.bio}>{ReactHtmlParser(profile?.profile?.bio)}</div>
      </Col>
      <Col xs={24} md={{ span: 22, offset: 1 }}>
        {profile?.profile?.social_media_links && (
          <Space size={'middle'}>
            {profile.profile.social_media_links.website && (
              <a href={`//${profile.profile.social_media_links.website}`} target="_blank" rel="noopener noreferrer">
                <GlobalOutlined className={styles.socialIcon} />
              </a>
            )}
            {profile.profile.social_media_links.facebook_link && (
              <a href={`${profile.profile.social_media_links.facebook_link}`} target="_blank" rel="noopener noreferrer">
                <FacebookOutlined className={styles.socialIcon} />
              </a>
            )}
            {profile.profile.social_media_links.twitter_link && (
              <a href={`${profile.profile.social_media_links.twitter_link}`} target="_blank" rel="noopener noreferrer">
                <TwitterOutlined className={styles.socialIcon} />
              </a>
            )}
            {profile.profile.social_media_links.instagram_link && (
              <a
                href={`${profile.profile.social_media_links.instagram_link}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramOutlined className={styles.socialIcon} />
              </a>
            )}
            {profile.profile.social_media_links.linkedin_link && (
              <a href={`${profile.profile.social_media_links.linkedin_link}`} target="_blank" rel="noopener noreferrer">
                <LinkedinOutlined className={styles.socialIcon} />
              </a>
            )}
          </Space>
        )}
      </Col>
    </Row>
  );
};

export default CreatorProfile;
