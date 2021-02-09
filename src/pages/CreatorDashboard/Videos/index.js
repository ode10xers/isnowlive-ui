import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card, Image, Collapse, Empty, Popconfirm, message } from 'antd';
import {
  EditOutlined,
  CloudUploadOutlined,
  DownOutlined,
  UpOutlined,
  CopyOutlined,
  ExportOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';
import DefaultImage from 'components/Icons/DefaultImage';
import UploadVideoModal from 'components/UploadVideoModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import { isAPISuccess, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const Videos = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formPart, setFormPart] = useState(1);
  const [shouldCloneVideo, setShouldCloneVideo] = useState(false);

  const showUploadVideoModal = (video = null, screen = 1) => {
    if (video !== null) {
      setSelectedVideo(video);
      setFormPart(screen);
    }
    setCreateModalVisible(true);
  };

  const hideUploadVideoModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setSelectedVideo(null);
    setShouldCloneVideo(false);
    setFormPart(1);
    if (shouldRefresh) {
      getVideosForCreator();
    }
  };

  const publishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.publishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Published');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.unpublishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video Unpublished');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.videos.getCreatorVideos();

      if (data) {
        setVideos(
          data.map((video, index) => ({
            index,
            ...video,
            buyers: video.buyers.map((subs) => ({ ...subs, currency: video.currency.toUpperCase() })),
          }))
        );
      }
    } catch (error) {
      showErrorModal('Failed fetching videos', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getVideosForCreator();
    //eslint-disable-next-line
  }, []);

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(videos.map((video) => video.external_id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const copyPageLinkToClipboard = (videoId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/v/${videoId}`;

    // Fallback method if navigator.clipboard is not supported
    if (!navigator.clipboard) {
      var textArea = document.createElement('textarea');
      textArea.value = pageLink;

      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand('copy');

        if (successful) {
          message.success('Page link copied to clipboard!');
        } else {
          message.error('Failed to copy link to clipboard');
        }
      } catch (err) {
        message.error('Failed to copy link to clipboard');
      }

      document.body.removeChild(textArea);
    } else {
      navigator.clipboard.writeText(pageLink).then(
        function () {
          message.success('Page link copied to clipboard!');
        },
        function (err) {
          message.error('Failed to copy link to clipboard');
        }
      );
    }
  };

  const cloneVideo = async (video) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.cloneVideo(video.external_id);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        console.log(data);
        setShouldCloneVideo(true);
        showUploadVideoModal(data);
      }
    } catch (error) {
      setIsLoading(false);
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const unlinkVideo = async (video) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.unlinkVideo(video.external_id);

      if (isAPISuccess(status)) {
        setIsLoading(false);
        showSuccessModal('Video has been removed, you can upload another video');
        getVideosForCreator();
      }
    } catch (error) {
      setIsLoading(false);
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const videosColumns = [
    {
      title: '',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      align: 'center',
      width: '12%',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: (
            <Image
              src={record.thumbnail_url || 'error'}
              alt={record.title}
              height={50}
              width={100}
              fallback={DefaultImage()}
              className={styles.thumbnailImage}
            />
          ),
        };
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
      render: (text, record) => <Text> {record.title} </Text>,
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} Day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '10%',
      render: (text, record) => (parseInt(text) === 0 ? 'Free' : `${text} ${record.currency.toUpperCase()}`),
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={3}>
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={3}>
            {record.video_uid.length > 0 ? (
              <Tooltip title="Remove Video">
                <Popconfirm
                  title="Are you sure you want to remove this video? You will have to upload another one after this."
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => unlinkVideo(record)}
                >
                  <Button danger className={styles.detailsButton} type="text" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            ) : (
              <Tooltip title="Upload Video">
                <Button
                  className={styles.detailsButton}
                  type="text"
                  onClick={() => showUploadVideoModal(record, 2)}
                  icon={<CloudUploadOutlined />}
                />
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={3}>
            <Tooltip title="Clone Video">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => cloneVideo(record)}
                icon={<ExportOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={3}>
            <Tooltip title="Copy Video Page Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyPageLinkToClipboard(record.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={5}>
            {record.is_published ? (
              <Tooltip title="Hide Video">
                <Button type="link" danger onClick={() => unpublishVideo(record.external_id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Video">
                <Button
                  type="link"
                  disabled={record.video_uid.length ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(record.external_id)}
                >
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={6}>
            {expandedRowKeys.includes(record.external_id) ? (
              <Button type="link" onClick={() => collapseRow(record.external_id)}>
                {`${record?.buyers?.length || 0} Buyers `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.external_id)}>
                {`${record?.buyers?.length || 0} Buyers`} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const buyerColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Date of Purchase',
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '30%',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: 'Net Price',
      dataIndex: 'price_paid',
      key: 'price_paid',
      render: (text, record) => `${record.price_paid} ${record.currency}`,
    },
  ];

  const renderSubsciberList = (record) => {
    return (
      <div className={styles.mb20}>
        <Table
          columns={buyerColumns}
          data={record.buyers}
          loading={isLoading}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileBuyerCards = (buyer) => (
    <Card>
      <Row>
        <Col xs={24}>
          <Title level={5}> {buyer.name} </Title>
        </Col>
        <Col xs={24}>
          <Text> Purchased at {toDateAndTime(buyer.date_of_purchase)} </Text>
        </Col>
        <Col xs={24}>
          <Text> {`${buyer.price_paid} ${buyer.currency}`} </Text>
        </Col>
      </Row>
    </Card>
  );

  const renderVideoItem = (video) => {
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Col xs={24}>
        <Card
          className={styles.card}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${video.color_code || '#FFF'}` }}>
              <Text>{video.title}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            video.video_uid.length > 0 ? (
              <Tooltip title="Remove Video">
                <Popconfirm
                  title="Are you sure you want to remove this video? You will have to upload another one after this."
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => unlinkVideo(video)}
                >
                  <Button danger className={styles.detailsButton} type="text" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            ) : (
              <Tooltip title="Upload Video">
                <Button
                  className={styles.detailsButton}
                  type="text"
                  disabled={video.video_uid.length ? true : false}
                  onClick={() => showUploadVideoModal(video, 2)}
                  icon={<CloudUploadOutlined />}
                />
              </Tooltip>
            ),
            <Tooltip title="Clone Video">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => cloneVideo(video)}
                icon={<ExportOutlined />}
              />
            </Tooltip>,
            <Tooltip title="Copy Video Page Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyPageLinkToClipboard(video.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            video.is_published ? (
              <Tooltip title="Hide Video">
                <Button type="link" danger onClick={() => unpublishVideo(video.external_id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Video">
                <Button
                  type="link"
                  disabled={video.video_uid.length ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(video.external_id)}
                >
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(video.external_id) ? (
              <Button type="link" onClick={() => collapseRow(video.external_id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(video.external_id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout('Validity', <Text>{`${video.validity} days`}</Text>)}
          {layout('Price', <Text>{`${video.price} ${video.currency}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(video.external_id) && (
          <Row className={styles.cardExpansion}>
            <div className={styles.mb20}>{video?.buyers?.map(renderMobileBuyerCards)}</div>
          </Row>
        )}
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <UploadVideoModal
        formPart={formPart}
        setFormPart={setFormPart}
        visible={createModalVisible}
        closeModal={hideUploadVideoModal}
        editedVideo={selectedVideo}
        updateEditedVideo={setSelectedVideo}
        shouldClone={shouldCloneVideo}
      />
      <Row gutter={[8, 24]}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> Videos </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24} md={8} lg={6}>
          <Button block type="primary" onClick={() => showUploadVideoModal()} icon={<CloudUploadOutlined />}>
            Upload New Video
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> Published </Title>} key="Active">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Videos">
                      <Row gutter={[8, 16]}>{videos?.filter((video) => video.is_published)?.map(renderVideoItem)}</Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={videosColumns}
                      data={videos?.filter((video) => video.is_published)}
                      loading={isLoading}
                      rowKey={(record) => record.external_id}
                      expandable={{
                        expandedRowRender: (record) => renderSubsciberList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedRowKeys,
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty description={'No Published Videos'} />
              )}
            </Panel>
            <Panel header={<Title level={5}> Unpublished </Title>} key="Expired">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Videos">
                      <Row gutter={[8, 16]}>{videos?.filter((video) => !video.is_published)?.map(renderVideoItem)}</Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={videosColumns}
                      data={videos?.filter((video) => !video.is_published)}
                      loading={isLoading}
                      rowKey={(record) => record.external_id}
                      expandable={{
                        expandedRowRender: (record) => renderSubsciberList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedRowKeys,
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty description={'No Unpublished Videos'} />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
      {/* <VideoPlayer /> */}
    </div>
  );
};

export default Videos;
