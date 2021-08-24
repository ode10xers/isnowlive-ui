import React, { useState, useCallback, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Button, Spin, Typography, Divider, Space, Drawer, Image, Statistic, message } from 'antd';
import { LikeOutlined, ScheduleOutlined, GiftOutlined, DollarOutlined } from '@ant-design/icons';

import apis from 'apis';
import dummy from 'data/dummy';

import ContainerCard, { generateCardHeadingStyle } from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';
import PassesListItem from 'components/DynamicProfileComponents/PassesProfileComponent/PassesListItem';
import SubscriptionsListView from 'components/DynamicProfileComponents/SubscriptionsProfileComponent/SubscriptionListView';

import dateUtil from 'utils/date';
import { generateColorPalletteForProfile, getNewProfileUIMaxWidth } from 'utils/colors';
import {
  isAPISuccess,
  preventDefaults,
  videoSourceType,
  getUsernameFromUrl,
  reservedDomainName,
  isBrightColorShade,
  convertHexToRGB,
} from 'utils/helper';

import styles from './style.module.scss';

const { Title, Text, Paragraph } = Typography;

const {
  formatDate: { getVideoMinutesDuration },
} = dateUtil;

const VideoDetailPreview = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);

  // Related Products State
  const [relatedSubscriptions, setRelatedSubscriptions] = useState([]);
  const [relatedPasses, setRelatedPasses] = useState([]);

  // Bottom Sheet States
  const [bottomSheetsView, setBottomSheetsView] = useState(null);
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

  const fetchRelatedSubscriptionsForVideo = useCallback(async (videoExternalId, templateData = 'YOGA') => {
    const relatedSubs = dummy[templateData].SUBSCRIPTIONS.filter(
      (subs) => subs.products['VIDEO'] && subs.products['VIDEO'].product_ids.includes(videoExternalId)
    );
    setRelatedSubscriptions(relatedSubs ?? []);
  }, []);

  const fetchRelatedPassesForVideo = useCallback(async (videoExternalId, templateData = 'YOGA') => {
    const passArr = dummy[templateData].PASSES.filter((pass) =>
      pass.videos.find((video) => video.external_id === videoExternalId)
    );
    setRelatedPasses(passArr ?? []);
  }, []);

  useEffect(() => {
    const creatorUsername = getUsernameFromUrl();

    if (creatorUsername && !reservedDomainName.includes(creatorUsername)) {
      fetchCreatorDetails(creatorUsername);
    }
  }, [fetchCreatorDetails]);

  useEffect(() => {
    if (match.params.video_id) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      const targetVideo = dummy[templateData].VIDEOS.find((video) => video.external_id === match.params.video_id);

      if (targetVideo) {
        setVideoData(targetVideo);
        fetchRelatedSubscriptionsForVideo(match.params.video_id, templateData);
        fetchRelatedPassesForVideo(match.params.video_id, templateData);
      } else {
        message.error('Invalid video ID');
      }
    }
  }, [match.params, creatorProfile, fetchRelatedPassesForVideo, fetchRelatedSubscriptionsForVideo]);

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

  //#region Start of UI Logics

  const handleMembershipBuyClicked = (e) => {
    preventDefaults(e);
    setBottomSheetsView('membership');
    setBottomSheetsVisible(true);
  };

  const handleVideoBuyClicked = (e) => {
    preventDefaults(e);
    message.info('This page is just a preview, so you cannot buy this product');
  };

  const handleBottomSheetsClosed = (e) => {
    preventDefaults(e);
    setBottomSheetsVisible(false);
  };

  //#endregion End of UI Logics

  //#region Start of UI Handlers

  const renderVideoDetailItem = (value) => <Text className={styles.videoDetailItem}>{value}</Text>;

  const renderPassItems = (pass) => (
    <Col xs={12} md={8} lg={!creatorProfile?.profile?.new_profile ? 8 : 6} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  const renderContainerComponent = (props, children) => {
    const ContainingComponent = creatorProfile?.profile?.new_profile ? DynamicProfileComponentContainer : ContainerCard;

    return (
      <Col xs={24}>
        <ContainingComponent {...props}>{children}</ContainingComponent>
      </Col>
    );
  };

  //#endregion End of UI Handlers

  //#region Start of UI Components

  const renderRelatedPassesComponent = () => {
    if (!relatedPasses.length) {
      return null;
    }

    const componentChild = <Row gutter={[10, 10]}>{relatedPasses.map(renderPassItems)}</Row>;

    const commonContainerProps = {
      title: 'Buy a pass and this video',
      icon: <LikeOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  const renderRelatedSubscriptionsComponent = () => {
    if (!relatedSubscriptions.length) {
      return null;
    }

    const componentChild = (
      <SubscriptionsListView subscriptions={relatedSubscriptions} isContained={!creatorProfile?.profile?.new_profile} />
    );

    const commonContainerProps = {
      title: 'Memberships',
      icon: <ScheduleOutlined className={styles.icon} />,
    };

    return renderContainerComponent(commonContainerProps, componentChild);
  };

  //#endregion End of UI Components

  return (
    <div className={styles.videoDetailsPage}>
      <Spin spinning={isLoading} tip="Fetching video details...">
        <Row gutter={[8, 8]}>
          {videoData && (
            <Col xs={24}>
              <Row gutter={[8, 8]} className={styles.videoDataContainer}>
                {/* Video Thumbnail */}
                <Col xs={24}>
                  <div className={styles.videoImageContainer}>
                    <Image preview={false} src={videoData.thumbnail_url} className={styles.videoImage} />
                  </div>
                </Col>

                {/* Video Title */}
                <Col xs={24}>
                  <Title level={3} className={styles.videoTitle}>
                    {videoData.title}
                  </Title>
                </Col>

                {/* Video Details */}
                <Col xs={24}>
                  <Space
                    size="large"
                    className={styles.videoDetailsContainer}
                    align="center"
                    split={<Divider type="vertical" className={styles.videoDetailsDivider} />}
                  >
                    <Statistic
                      title="Validity"
                      value={`${videoData?.validity} day${videoData?.validity > 1 ? 's' : ''}`}
                      formatter={renderVideoDetailItem}
                    />
                    {videoData.source === videoSourceType.CLOUDFLARE ? (
                      <Statistic
                        title="Duration"
                        value={getVideoMinutesDuration(videoData?.duration ?? 0)}
                        formatter={renderVideoDetailItem}
                      />
                    ) : null}
                  </Space>
                </Col>

                {/* Video Description */}
                <Col xs={24}>
                  <div className={styles.videoDescription}>{ReactHtmlParser(videoData?.description)}</div>
                </Col>
              </Row>
            </Col>
          )}

          {/* Related Products */}
          <>
            <Col xs={24}>
              <Row gutter={[8, 8]} justify="center" className={styles.buyContainer}>
                {relatedSubscriptions?.length > 0 && (
                  <Col xs={24} sm={12}>
                    <Row gutter={[12, 12]} justify="center" className={styles.buyMembershipContainer}>
                      <Col xs={24}>
                        <Button
                          block
                          type="primary"
                          size="large"
                          className={styles.buyMembershipBtn}
                          icon={<GiftOutlined />}
                          onClick={handleMembershipBuyClicked}
                        >
                          SUBSCRIBE AND BOOK
                        </Button>
                      </Col>
                      <Col xs={24}>
                        <Paragraph className={styles.buyMembershipDesc}>
                          Subscribe to a membership for discounted price.
                        </Paragraph>
                      </Col>
                    </Row>
                  </Col>
                )}
                <Col xs={24} sm={12}>
                  <Row gutter={[12, 12]} justify="center" className={styles.buyVideoContainer}>
                    <Col xs={24}>
                      <Button
                        block
                        type="primary"
                        size="large"
                        className={classNames(
                          styles.buyVideoBtn,
                          isBrightColorShade(convertHexToRGB(creatorProfile?.profile?.color ?? '#1890ff'))
                            ? styles.darkText
                            : styles.lightText
                        )}
                        icon={<DollarOutlined />}
                        onClick={handleVideoBuyClicked}
                      >
                        <Space
                          split={<Divider className={styles.buyBtnDivider} />}
                          className={styles.buyVideoBtnContent}
                        >
                          <Text className={styles.buyVideoBtnText}> ONE TIME PURCHASE </Text>
                          <Text className={styles.buyVideoBtnText}>
                            {videoData?.pay_what_you_want
                              ? 'Flexible'
                              : videoData?.total_price > 0
                              ? `${videoData?.currency?.toUpperCase()} ${videoData?.total_price}`
                              : 'Free'}
                          </Text>
                        </Space>
                      </Button>
                    </Col>
                    <Col xs={24}>
                      <Paragraph className={styles.buyVideoDesc}>Just buy this video</Paragraph>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
            {relatedPasses?.length > 0 && renderRelatedPassesComponent()}
            {relatedSubscriptions?.length > 0 && renderRelatedSubscriptionsComponent()}
          </>
        </Row>
      </Spin>
      <Drawer
        placement="bottom"
        height={560}
        bodyStyle={{ padding: 10 }}
        title={
          <Text style={{ color: 'var(--passion-profile-darker-color, #0050B3)' }}>
            {bottomSheetsView === 'membership' ? 'Select your plan' : 'Select the pass to buy'}
          </Text>
        }
        headerStyle={generateCardHeadingStyle()}
        visible={bottomSheetsVisible}
        onClose={handleBottomSheetsClosed}
        className={styles.videoBottomSheets}
      >
        {bottomSheetsView === 'membership' ? (
          <SubscriptionsListView
            subscriptions={relatedSubscriptions}
            isContained={!creatorProfile?.profile?.new_profile}
          />
        ) : null}
      </Drawer>
    </div>
  );
};

export default VideoDetailPreview;
