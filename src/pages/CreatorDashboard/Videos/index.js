import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Tooltip, Card, Image, Collapse, Empty, Popconfirm } from 'antd';
import {
  EditTwoTone,
  CloudUploadOutlined,
  DownOutlined,
  UpOutlined,
  CopyOutlined,
  ExportOutlined,
  CheckCircleTwoTone,
  BookTwoTone,
  DeleteOutlined,
  MailOutlined,
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
import { isAPISuccess, generateUrlFromUsername, copyToClipboard } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const Videos = () => {
  const { showSendEmailPopup } = useGlobalContext();
  const location = useLocation();

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formPart, setFormPart] = useState(1);
  const [shouldCloneVideo, setShouldCloneVideo] = useState(false);

  const isOnboarding = location.state ? location.state.onboarding || false : false;

  const showEmailModal = (video) => {
    let activeRecipients = [];
    let expiredRecipients = [];
    let userIdMap = new Map();

    if (video.buyers && video.buyers?.length > 0) {
      // Since video can be repeatedly bought by the same user
      // (after it expires), we put checks here

      video.buyers.forEach((buyer) => {
        if (!userIdMap.has(buyer.external_id)) {
          let isActive = !buyer.expired;

          if (!buyer.expired) {
            const foundBuyer = activeRecipients.find((recipient) => recipient.external_id === buyer.external_id);

            if (!foundBuyer) {
              activeRecipients.push(buyer);
            }
          } else {
            const foundBuyer = expiredRecipients.find((recipient) => recipient.external_id === buyer.external_id);

            if (!foundBuyer) {
              expiredRecipients.push(buyer);
            }
          }

          userIdMap.set(buyer.external_id, {
            ...buyer,
            isActive,
          });
        } else {
          const mappedBuyer = userIdMap.get(buyer.external_id);

          // If the user in the map is already active user
          // that means it's the most up to date data
          if (mappedBuyer.isActive) {
            return;
          }

          // If the user in the map is expired user
          // We check if the current data is an active
          // if it is we update the data in the map
          if (!buyer.expired) {
            userIdMap.set(buyer.external_id, {
              ...buyer,
              isActive: true,
            });

            // Move the buyer data from expired to active array
            activeRecipients.push(buyer);
            expiredRecipients = expiredRecipients.filter((recipient) => recipient.external_id !== buyer.external_id);
          }
        }
      });
    }

    showSendEmailPopup({
      recipients: {
        active: activeRecipients,
        expired: expiredRecipients,
      },
      productId: video?.external_id || null,
      productType: 'VIDEO',
    });
  };

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
    document.body.style.overflow = 'auto';
  };

  const getVideosForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.videos.getCreatorVideos();

      if (isAPISuccess(status) && data) {
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
    if (isOnboarding) {
      showUploadVideoModal();
    }

    getVideosForCreator();
    //eslint-disable-next-line
  }, [isOnboarding]);

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

  const copyVideoPageLink = (videoId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/v/${videoId}`;

    copyToClipboard(pageLink);
  };

  const cloneVideo = async (video) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.videos.cloneVideo(video.external_id);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        setShouldCloneVideo(true);
        showUploadVideoModal(data);
      }
    } catch (error) {
      setIsLoading(false);
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const deleteVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.deleteVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal('Video has been deleted');
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal('Failed to delete video', error?.response?.data?.message || 'Something wrong happened');
    }

    setIsLoading(false);
  };

  const videosColumns = [
    {
      title: '',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      align: 'center',
      width: '125px',
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
      render: (text, record) => (
        <>
          <Text> {record.title} </Text>
          {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
        </>
      ),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '90px',
      render: (text, record) => `${text} Day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '80px',
      render: (text, record) => (parseInt(text) === 0 ? 'Free' : `${text} ${record.currency.toUpperCase()}`),
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={2}>
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showEmailModal(record)} icon={<MailOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={24} md={2}>
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(record)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={2}>
            {record.status === 'UPLOAD_SUCCESS' ? (
              <Tooltip title="Video uploaded">
                <Button
                  className={classNames(styles.detailsButton, styles.checkIcon)}
                  type="text"
                  icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                />
              </Tooltip>
            ) : (
              <Tooltip title={record.video_uid.length > 0 ? 'Video is being processed' : 'Upload Video'}>
                <Button
                  className={styles.detailsButton}
                  type="text"
                  disabled={record.video_uid.length > 0 ? true : false}
                  onClick={() => showUploadVideoModal(record, 2)}
                  icon={<CloudUploadOutlined />}
                />
              </Tooltip>
            )}
          </Col>
          {record.status === 'UPLOAD_SUCCESS' && (
            <>
              <Col xs={24} md={2}>
                <Tooltip title="Clone Video">
                  <Button
                    type="text"
                    className={styles.detailsButton}
                    onClick={() => cloneVideo(record)}
                    icon={<ExportOutlined />}
                  />
                </Tooltip>
              </Col>
            </>
          )}
          <Col xs={24} md={2}>
            <Popconfirm
              title="Do you want to delete video?"
              icon={<DeleteOutlined className={styles.danger} />}
              okText="Yes"
              cancelText="No"
              onConfirm={() => deleteVideo(record.external_id)}
            >
              <Tooltip title="Delete Video">
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Col>
          <Col xs={24} md={2}>
            <Tooltip title="Copy Video Page Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyVideoPageLink(record.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={6}>
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
                  disabled={record.status === 'UPLOAD_SUCCESS' ? false : true}
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
                {`${record?.buyers?.length || 0} Buyer `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.external_id)}>
                {`${record?.buyers?.length || 0} Buyer`} <DownOutlined />
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
      render: (text, record) => `${record.price_paid} ${record.currency.toUpperCase()}`,
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
    <Col xs={24} key={`${buyer.name}_${buyer.date_of_purchase}`}>
      <Card>
        <Row>
          <Col xs={24}>
            <Title level={5}> {buyer?.name} </Title>
          </Col>
          <Col xs={24}>
            <Text> Purchased at {toDateAndTime(buyer?.date_of_purchase)} </Text>
          </Col>
          <Col xs={24}>
            <Text> {`${buyer?.price_paid} ${buyer?.currency?.toUpperCase()}`} </Text>
          </Col>
        </Row>
      </Card>
    </Col>
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

    const actionButtons =
      video?.status === 'UPLOAD_SUCCESS'
        ? [
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showEmailModal(video)} icon={<MailOutlined />} />
            </Tooltip>,
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>,
            <Tooltip title="Clone Video">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => cloneVideo(video)}
                icon={<ExportOutlined />}
              />
            </Tooltip>,
            <Popconfirm
              title="Do you want to delete video?"
              icon={<DeleteOutlined className={styles.danger} />}
              okText="Yes"
              cancelText="No"
              onConfirm={() => deleteVideo(video?.external_id)}
            >
              <Tooltip title="Delete Video">
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>,
            <Tooltip title="Copy Video Page Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyVideoPageLink(video?.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            video?.is_published ? (
              <Tooltip title="Hide Video">
                <Button type="link" danger onClick={() => unpublishVideo(video?.external_id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Video">
                <Button
                  type="link"
                  disabled={video?.status === 'UPLOAD_SUCCESS' ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(video?.external_id)}
                >
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(video?.external_id) ? (
              <Button type="link" onClick={() => collapseRow(video?.external_id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(video?.external_id)} icon={<DownOutlined />} />
            ),
          ]
        : [
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showEmailModal(video)} icon={<MailOutlined />} />
            </Tooltip>,
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditTwoTone twoToneColor="#08979c" />}
              />
            </Tooltip>,
            <Tooltip title={video?.video_uid.length > 0 ? 'Video is being processed' : 'Upload Video'}>
              <Button
                className={styles.detailsButton}
                type="text"
                disabled={video?.video_uid.length ? true : false}
                onClick={() => showUploadVideoModal(video, 2)}
                icon={<CloudUploadOutlined />}
              />
            </Tooltip>,
            <Popconfirm
              title="Do you want to delete video?"
              icon={<DeleteOutlined className={styles.danger} />}
              okText="Yes"
              cancelText="No"
              onConfirm={() => deleteVideo(video?.external_id)}
            >
              <Tooltip title="Delete Video">
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>,
            <Tooltip title="Copy Video Page Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyVideoPageLink(video?.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            video?.is_published ? (
              <Tooltip title="Hide Video">
                <Button type="link" danger onClick={() => unpublishVideo(video?.external_id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Video">
                <Button
                  type="link"
                  disabled={video?.status === 'UPLOAD_SUCCESS' ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(video?.external_id)}
                >
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(video?.external_id) ? (
              <Button type="link" onClick={() => collapseRow(video?.external_id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(video?.external_id)} icon={<DownOutlined />} />
            ),
          ];

    return (
      <Col xs={24} key={video.external_id}>
        <Card
          className={styles.card}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${video?.color_code || '#FFF'}` }}>
              <Text>{video?.title}</Text> {video?.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
              {video?.status === 'UPLOAD_SUCCESS' ? (
                <Tooltip title="Video uploaded">
                  <Button
                    className={classNames(styles.detailsButton, styles.checkIcon)}
                    type="text"
                    icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                  />
                </Tooltip>
              ) : null}
            </div>
          }
          actions={actionButtons}
        >
          {layout('Validity', <Text>{`${video?.validity} days`}</Text>)}
          {layout('Price', <Text>{`${video?.price} ${video?.currency.toUpperCase()}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(video?.external_id) && (
          <Row className={styles.cardExpansion}>{video?.buyers?.map(renderMobileBuyerCards)}</Row>
        )}
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      {createModalVisible && (
        <UploadVideoModal
          formPart={formPart}
          setFormPart={setFormPart}
          visible={createModalVisible}
          closeModal={hideUploadVideoModal}
          editedVideo={selectedVideo}
          updateEditedVideo={setSelectedVideo}
          shouldClone={shouldCloneVideo}
        />
      )}
      <Row gutter={[8, 24]}>
        <Col xs={12} md={8} lg={14}>
          <Title level={4}> Videos </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24} md={10} lg={6}>
          <Button block type="primary" onClick={() => showUploadVideoModal()} icon={<CloudUploadOutlined />}>
            Upload New Video
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse defaultActiveKey="Active">
            <Panel header={<Title level={5}> Published </Title>} key="Active">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Videos">
                      <Row gutter={[8, 16]}>{videos?.filter((video) => video?.is_published)?.map(renderVideoItem)}</Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      size="small"
                      columns={videosColumns}
                      data={videos?.filter((video) => video?.is_published)}
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
                <Empty description="No Published Videos" />
              )}
            </Panel>
            <Panel header={<Title level={5}> Unpublished </Title>} key="Expired">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Videos">
                      <Row gutter={[8, 16]}>
                        {videos?.filter((video) => !video?.is_published)?.map(renderVideoItem)}
                      </Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      size="small"
                      columns={videosColumns}
                      data={videos?.filter((video) => !video?.is_published)}
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
                <Empty description="No Unpublished Videos" />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
