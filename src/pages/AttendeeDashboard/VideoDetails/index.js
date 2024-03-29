import React, { useCallback, useState, useEffect } from 'react';
import { generatePath } from 'react-router';
import classNames from 'classnames';

import { Row, Col, Typography, Image, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import VideoCard from 'components/VideoCard';
import VideoPlayer from 'components/VideoPlayer';
import SessionCards from 'components/SessionCards';
import DocumentEmbed from 'components/DocumentEmbed';
import CreatorProfile from 'components/CreatorProfile';
import DefaultImage from 'components/Icons/DefaultImage';
import NextCourseContentButton from 'components/NextCourseContentButton';
import { showErrorModal, showWarningModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { getYoutubeVideoIDFromURL } from 'utils/video';
import { reservedDomainName, videoSourceType } from 'utils/constants';
import { isAPISuccess, isUnapprovedUserError, preventDefaults } from 'utils/helper';
import { localStorageActiveCourseContentDataKey, localStorageAttendeeCourseDataKey } from 'utils/course';

import styles from './style.module.scss';

const { Text, Title } = Typography;

const {
  timeCalculation: { isPresentOrFuture },
} = dateUtil;

const VideoDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [video, setVideo] = useState([]);
  const [videoOrderDetails, setVideoOrderDetails] = useState({ isExpired: true });
  const [videoToken, setVideoToken] = useState(null);
  const [startVideo, setStartVideo] = useState(false);

  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

  const getProfileDetails = useCallback(async (username) => {
    setIsLoading(true);
    try {
      const { status, data } = username ? await apis.user.getProfileByUsername(username) : await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
        setProfile(data);
        setProfileImage(data.profile_image_url);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        message.error('Failed to load profile details');
      }
    }
    setIsLoading(false);
  }, []);

  const getVideoDetails = useCallback(
    async (videoId) => {
      try {
        setIsLoading(true);
        const { status, data } = await apis.videos.getVideoById(videoId);

        if (isAPISuccess(status) && data) {
          setVideo(data);
          if (data.creator_username && !reservedDomainName.includes(data.creator_username)) {
            getProfileDetails(data.creator_username);
          }
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);

        if (error?.response?.status !== 404 && !isUnapprovedUserError(error.response)) {
          message.error('Failed to load video details');
        } else {
          if (videoOrderDetails) {
            getProfileDetails(videoOrderDetails?.creator_username);
          }
        }
      }
    },
    [getProfileDetails, videoOrderDetails]
  );

  const fetchVideoOrderDetails = useCallback(async (videoOrderId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.getAttendeeVideoOrderDetails(videoOrderId);

      if (isAPISuccess(status) && data) {
        const orderExpired = !isPresentOrFuture(data.expiry);
        setVideoOrderDetails({ ...data, isExpired: orderExpired });
        setVideoToken(null);
        setStartVideo(false);
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status !== 404) {
        message.error(error?.response?.data?.message || 'Failed fetching attendee order details');
      }
    }
    setIsLoading(false);
  }, []);

  const getVideoToken = async (videoOrderId) => {
    try {
      setIsLoading(true);
      const { data, status } = await apis.videos.getAttendeeVideoToken(videoOrderId);

      if (isAPISuccess(status) && data) {
        setVideoToken(data.token);
      }
    } catch (error) {
      if (error?.response?.data?.message === `cannot access video before it's scheduled time`) {
        showWarningModal(
          `Course hasn't started yet`,
          `This video is a part of a course which hasn't started yet. Please wait for the start date to watch this video`
        );
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal(
          'Failed to load video token. Either video is expired or you have reached viewing limit of video'
        );
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (match.params.video_id) {
      getVideoDetails(match.params.video_id);
    } else {
      setIsLoading(false);
      message.error('Video details not found.');
    }
  }, [match.params.video_id, getVideoDetails]);

  useEffect(() => {
    if (match.params.video_order_id) {
      fetchVideoOrderDetails(match.params.video_order_id);
    } else {
      setVideoOrderDetails({ isExpired: true });
    }
  }, [match.params.video_order_id, fetchVideoOrderDetails]);

  const playVideo = () => {
    setStartVideo(true);
    if (match.params.video_order_id) {
      getVideoToken(match.params.video_order_id);
    } else {
      message.error('Video token not found.');
    }
  };

  const handleShowDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview((prevState) => !prevState);
  };

  const handleHideDocumentPreview = (e) => {
    preventDefaults(e);
    setShowDocumentPreview(false);
  };

  const renderVideoDocumentUrl = () => {
    const isDownloadable = videoOrderDetails?.is_document_downloadable;
    const documentData = videoOrderDetails?.document;
    const documentUrl = documentData.url ?? '';
    const documentName = (documentData.name ?? '') || documentUrl.split('_').splice(1).join('_') || 'View';

    return (
      <>
        <Title level={5}> This video includes a PDF file </Title>
        <Space>
          <Button type="primary" icon={<FilePdfOutlined />} onClick={handleShowDocumentPreview}>
            {documentName}
          </Button>
          {isDownloadable ? (
            <Button ghost type="primary" icon={<DownloadOutlined />} onClick={() => window.open(documentUrl)} />
          ) : null}
        </Space>
      </>
    );
  };

  const renderDocumentPreview = () => {
    const documentData = videoOrderDetails.document;

    if (!showDocumentPreview || !documentData || !documentData.url) {
      return null;
    }

    return (
      <div className={styles.documentPreviewContainer}>
        <Row gutter={[8, 8]}>
          <Col xs={24} className={styles.textAlignCenter}>
            <Button danger ghost type="primary" onClick={handleHideDocumentPreview}>
              Close Preview
            </Button>
          </Col>
          <Col xs={24}>
            <DocumentEmbed documentLink={documentData.url ?? null} />
          </Col>
        </Row>
      </div>
    );
  };

  const isActiveCourseContent = () => {
    const activeCourseContentMetadata = JSON.parse(localStorage.getItem(localStorageActiveCourseContentDataKey));
    return (
      activeCourseContentMetadata &&
      activeCourseContentMetadata?.product_type === 'VIDEO' &&
      activeCourseContentMetadata?.product_id === match.params.video_id
    );
  };

  const handleGoBack = () => {
    if (isActiveCourseContent()) {
      const activeCourseInfo = JSON.parse(localStorage.getItem(localStorageAttendeeCourseDataKey));

      if (activeCourseInfo && activeCourseInfo.course_order_id) {
        history.push(
          Routes.attendeeDashboard.rootPath +
            generatePath(Routes.attendeeDashboard.courseDetails, { course_order_id: activeCourseInfo.course_order_id })
        );
        return;
      }
    }

    history.push(Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading video details">
      <Row className={styles.headerButtons} gutter={[8, 8]}>
        <Col xs={24} md={12}>
          <Button onClick={handleGoBack} icon={<ArrowLeftOutlined />}>
            Back
          </Button>
        </Col>
        {isActiveCourseContent() && (
          <Col xs={24} md={12} className={styles.courseButtonsContainer}>
            <NextCourseContentButton />
          </Col>
        )}
      </Row>
      <Row gutter={[8, 24]} className={classNames(styles.p50, styles.box)}>
        <Col xs={24} className={styles.showcaseCardContainer}>
          {videoOrderDetails?.isExpired ? (
            <div className={classNames(styles.videoWrapper, styles.expired)}>
              <Image
                loading="lazy"
                preview={false}
                className={styles.videoThumbnail}
                src={videoOrderDetails?.thumbnail_url || video?.thumbnail_url || 'error'}
                alt={videoOrderDetails?.title || video?.title}
                fallback={DefaultImage()}
              />
            </div>
          ) : (
            <VideoCard
              cover={
                videoOrderDetails?.source === videoSourceType.YOUTUBE && videoOrderDetails ? (
                  <iframe
                    className={styles.youtubeVideoPlayer}
                    src={`https://www.youtube.com/embed/${getYoutubeVideoIDFromURL(videoOrderDetails?.video_url)}`}
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  />
                ) : startVideo && videoToken ? (
                  <VideoPlayer token={videoToken} />
                ) : (
                  <div className={styles.videoWrapper} onClick={() => playVideo()}>
                    <PlayCircleOutlined className={styles.playIcon} />
                    <div className={styles.imageOverlay}>
                      <Image
                        loading="lazy"
                        preview={false}
                        className={styles.videoThumbnail}
                        src={videoOrderDetails?.thumbnail_url || video?.thumbnail_url || 'error'}
                        alt={videoOrderDetails?.title || video?.title}
                        fallback={DefaultImage()}
                      />
                    </div>
                  </div>
                )
              }
              video={video}
              buyable={false}
              hoverable={false}
              showOrderDetails={true}
              onCardClick={() => {}}
              orderDetails={videoOrderDetails}
              showDesc={true}
            />
          )}
        </Col>
        {videoOrderDetails?.document && videoOrderDetails?.document?.id && videoOrderDetails?.document?.url && (
          <Col xs={24}>
            <div className={styles.fileAttachmentContainer}>{renderVideoDocumentUrl()}</div>
            {renderDocumentPreview()}
          </Col>
        )}
        <Col xs={24}>{profile && <CreatorProfile profile={profile} profileImage={profileImage} />}</Col>
        <Col xs={24}>
          {video && (
            <Row className={styles.sessionListWrapper}>
              {video?.sessions?.length > 0 && (
                <Col xs={24}>
                  <Row gutter={[8, 8]}>
                    <Col xs={24}>
                      <Text className={styles.ml20}> Related to these class(es) </Text>
                    </Col>
                    <Col xs={24}>
                      <SessionCards sessions={video?.sessions} shouldFetchInventories={true} />
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Loader>
  );
};

export default VideoDetails;
