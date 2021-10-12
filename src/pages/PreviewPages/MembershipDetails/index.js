import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Spin, Typography, message, Affix, Drawer } from 'antd';
import {
  ArrowLeftOutlined,
  BarsOutlined,
  ScheduleOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import SubscriptionsListView from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListView';
import ContainerCard, { generateCardHeadingStyle } from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { deepCloneObject } from 'utils/helper';
import { generateColorPalletteForProfile, getNewProfileUIMaxWidth } from 'utils/colors';
import { generateBaseCreditsText, generateSubscriptionDuration } from 'utils/subscriptions';
import {
  getShadeForHexColor,
  preventDefaults,
  isAPISuccess,
  getUsernameFromUrl,
  reservedDomainName,
} from 'utils/helper';

import styles from './style.module.scss';

const { Title, Text } = Typography;

// TODO: This is an old version of UI. Change this to use new version
const MembershipDetailPreview = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [otherSubscriptions, setOtherSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [moreView, setMoreView] = useState('sessions');
  const [bottomSheetsVisible, setBottomSheetsVisible] = useState(false);

  const fetchCreatorDetails = useCallback(async (creatorUsername) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch creator profile');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const creatorUsername = getUsernameFromUrl();

    if (creatorUsername && !reservedDomainName.includes(creatorUsername)) {
      fetchCreatorDetails(creatorUsername);
    }
  }, [fetchCreatorDetails]);

  useEffect(() => {
    if (match.params.membership_id && creatorProfile) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      const subsData = deepCloneObject(dummy[templateData].SUBSCRIPTIONS);
      const targetSubs = subsData.find((subs) => subs.external_id === match.params.membership_id);

      if (targetSubs) {
        setSelectedSubscription(targetSubs);
        setOtherSubscriptions(subsData.filter((subs) => subs.external_id !== targetSubs.external_id));
      } else {
        message.error('Invalid membership ID');
      }
    }
  }, [match.params, creatorProfile]);

  useEffect(() => {
    let profileStyleObject = {};
    if (creatorProfile && creatorProfile?.profile?.new_profile) {
      profileStyleObject = { ...profileStyleObject, ...getNewProfileUIMaxWidth() };
    }

    if (creatorProfile && creatorProfile?.profile?.color) {
      profileStyleObject = {
        ...profileStyleObject,
        ...generateColorPalletteForProfile(creatorProfile?.profile?.color, creatorProfile?.profile?.new_profile),
      };
    }

    Object.entries(profileStyleObject).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    return () => {
      if (profileStyleObject) {
        Object.keys(profileStyleObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  //#region Start of UI Handlers

  const openPurchaseModal = (e) => {
    preventDefaults(e);
    message.info('This page is just a preview, so you cannot buy this product');
  };

  const handleBackClicked = (e) => {
    preventDefaults(e);
    history.push(Routes.root);
  };

  const handleMoreSessionsClicked = (e) => {
    preventDefaults(e);

    setMoreView('sessions');
    setBottomSheetsVisible(true);
  };

  const handleMoreVideoClicked = (e) => {
    preventDefaults(e);

    setMoreView('videos');
    setBottomSheetsVisible(true);
  };

  const handleCloseBottomSheets = () => {
    setBottomSheetsVisible(false);
  };

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const renderContainerComponent = (props, children) => {
    const ContainingComponent = creatorProfile?.profile?.new_profile ? DynamicProfileComponentContainer : ContainerCard;

    return <ContainingComponent {...props}>{children}</ContainingComponent>;
  };

  const sessionsItemLimit = 5;

  const renderSessionsComponent = (sessions = []) => {
    if (!sessions.length) {
      return null;
    }

    const componentChild = (
      <Row gutter={[16, 16]} className={styles.itemListContainer}>
        {sessions.slice(0, sessionsItemLimit).map((session) => (
          <Col
            xs={!creatorProfile?.profile?.new_profile ? 24 : 18}
            md={12}
            lg={!creatorProfile?.profile?.new_profile ? 12 : 8}
            key={session.session_external_id}
          >
            <SessionListCard session={session} />
          </Col>
        ))}
        {sessions?.length > sessionsItemLimit && (
          <Col
            className={styles.fadedItemContainer}
            xs={!creatorProfile?.profile?.new_profile ? 24 : 18}
            md={12}
            lg={!creatorProfile?.profile?.new_profile ? 12 : 8}
          >
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleMoreSessionsClicked}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <SessionListCard session={sessions[sessionsItemLimit]} />
            </div>
          </Col>
        )}
      </Row>
    );

    const commonContainerProps = {
      title: 'SESSIONS INCLUDED',
      icon: <VideoCameraOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const videoItemLimit = 5;

  const renderVideosComponent = (videos = []) => {
    if (!videos.length) {
      return null;
    }

    const componentChild = (
      <Row gutter={[16, 16]} className={styles.itemListContainer}>
        {videos.slice(0, videoItemLimit).map((video) => (
          <Col
            xs={!creatorProfile?.profile?.new_profile ? 24 : 18}
            md={12}
            lg={!creatorProfile?.profile?.new_profile ? 12 : 8}
            key={video.external_id}
          >
            <VideoListCard video={video} />
          </Col>
        ))}
        {videos?.length > videoItemLimit && (
          <Col
            className={styles.fadedItemContainer}
            xs={!creatorProfile?.profile?.new_profile ? 24 : 18}
            md={12}
            lg={!creatorProfile?.profile?.new_profile ? 12 : 8}
          >
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleMoreVideoClicked}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <VideoListCard video={videos[videoItemLimit]} />
            </div>
          </Col>
        )}
      </Row>
    );

    const commonContainerProps = {
      title: 'VIDEOS INCLUDED',
      icon: <PlayCircleOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const renderOtherSubscriptionsList = () => {
    if (!otherSubscriptions.length) {
      return null;
    }

    const componentChild = (
      <SubscriptionsListView subscriptions={otherSubscriptions} isContained={!creatorProfile?.profile?.new_profile} />
    );

    const commonContainerProps = {
      title: 'OTHER MEMBERSHIPS',
      icon: <ScheduleOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const moreVideosListView = (
    <Row gutter={[16, 16]}>
      {selectedSubscription?.product_details?.VIDEO?.map((video) => (
        <Col xs={24} md={12} lg={8} key={`more_${video.external_id}`}>
          <VideoListCard video={video} />
        </Col>
      ))}
    </Row>
  );

  const moreSessionsListView = (
    <Row gutter={[16, 16]}>
      {selectedSubscription?.product_details?.SESSION?.map((session) => (
        <Col xs={24} md={12} lg={8} key={`more_${session.session_external_id}`}>
          <SessionListCard session={session} />
        </Col>
      ))}
    </Row>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.membershipDetailsContainer}>
      <Spin spinning={isLoading} tip="Fetching membership details..." size="large">
        <div className={styles.pageContent}>
          <Row gutter={[8, 16]} justify="center">
            {/* Membership Card */}
            {selectedSubscription && (
              <Col
                xs={24}
                style={{
                  '--primary-color': `${selectedSubscription?.color_code ?? '#1890ff'}80`,
                  '--primary-color-pale': `${selectedSubscription?.color_code ?? '#1890ff'}40`,
                  '--secondary-color': getShadeForHexColor(selectedSubscription?.color_code ?? '#1890ff', 1),
                  '--ternary-color': getShadeForHexColor(selectedSubscription?.color_code ?? '#1890ff', 2),
                }}
              >
                <Row className={styles.highlightedMembershipCard} gutter={[8, 8]} justify="end" align="bottom">
                  <Col xs={24}>
                    <Title level={5} className={styles.highlightedMembershipName}>
                      {selectedSubscription?.name}
                    </Title>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={8} align="bottom">
                      <Col xs={14} className={styles.highlightedMembershipDetails}>
                        {generateBaseCreditsText(selectedSubscription, false)}
                      </Col>
                      <Col xs={10} className={styles.highlightedMembershipPrice}>
                        {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.total_price} /{' '}
                        {generateSubscriptionDuration(selectedSubscription)}
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Col>
            )}

            {/* Sessions List */}
            {selectedSubscription?.product_details?.SESSION && (
              <Col xs={24}>{renderSessionsComponent(selectedSubscription?.product_details?.SESSION)}</Col>
            )}

            {/* Videos List */}
            {selectedSubscription?.product_details?.VIDEO && (
              <Col xs={24}>{renderVideosComponent(selectedSubscription?.product_details?.VIDEO)}</Col>
            )}

            {/* Other Memberships List */}
            {otherSubscriptions.length > 0 && <Col xs={24}>{renderOtherSubscriptionsList()}</Col>}
          </Row>
        </div>
      </Spin>
      {/* Bottom Sheets List */}
      <Drawer
        visible={bottomSheetsVisible}
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          <Text style={{ color: 'var(--passion-profile-darker-color, #0050B3)' }}>
            {`${moreView[0].toUpperCase()}${moreView.slice(1)} included in this membership`}
          </Text>
        }
        headerStyle={generateCardHeadingStyle()}
        onClose={handleCloseBottomSheets}
        className={styles.detailsDrawer}
      >
        {moreView === 'videos' ? moreVideosListView : moreSessionsListView}
      </Drawer>

      {/* Sticky Bottom Buy UI */}
      {selectedSubscription && (
        <Affix offsetBottom={0}>
          <div className={styles.stickyBottomBar}>
            <Row gutter={8} align="middle">
              <Col xs={3}>
                <Button
                  className={styles.backButton}
                  ghost
                  block
                  size="large"
                  type="primary"
                  onClick={handleBackClicked}
                  icon={<ArrowLeftOutlined />}
                />
              </Col>
              <Col xs={11}>
                <div className={styles.bottomBarPrice}>
                  {selectedSubscription?.currency?.toUpperCase()} {selectedSubscription?.total_price} /{' '}
                  {generateSubscriptionDuration(selectedSubscription)}
                </div>
              </Col>
              <Col xs={10}>
                <Button block size="large" type="primary" className={styles.greenBtn} onClick={openPurchaseModal}>
                  SUBSCRIBE
                </Button>
              </Col>
            </Row>
          </div>
        </Affix>
      )}
    </div>
  );
};

export default MembershipDetailPreview;
