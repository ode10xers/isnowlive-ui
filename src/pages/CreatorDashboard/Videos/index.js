import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';

import { Row, Col, Typography, Button, Tooltip, Card, Image, Collapse, Empty, Popconfirm } from 'antd';
import {
  EditOutlined,
  CloudUploadOutlined,
  DownOutlined,
  UpOutlined,
  CopyOutlined,
  ExportOutlined,
  CheckCircleTwoTone,
  BookTwoTone,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

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

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const Videos = () => {
  const { t: translate } = useTranslation();
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
      showErrorModal(
        translate('FAIL_TO_FETCH_VIDEOS'),
        error.response?.data?.message || translate('SOMETHING_WENT_WRONG')
      );
    }
    setIsLoading(false);
  }, [translate]);

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

  const publishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.publishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal(translate('VIDEO_PUBLISHED'));
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal(translate('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.unpublishVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal(translate('VIDEO_UNPUBLISHED'));
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal(translate('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
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
      showErrorModal(translate('SOMETHING_WENT_WRONG'), error.response?.data?.message);
    }
  };

  const deleteVideo = async (videoId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.videos.deleteVideo(videoId);

      if (isAPISuccess(status)) {
        showSuccessModal(translate('VIDEO_DELETE_SUCCESS'));
        getVideosForCreator();
      }
    } catch (error) {
      showErrorModal(
        translate('VIDEO_DELETE_FAILED'),
        error?.response?.data?.message || translate('SOMETHING_WRONG_HAPPENED')
      );
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
      title: translate('TITLE'),
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
      title: translate('VALIDITY'),
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '90px',
      render: (text, record) => `${text} ${translate('DAY')}${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: translate('PRICE'),
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '80px',
      render: (text, record) => (parseInt(text) === 0 ? translate('FREE') : `${text} ${record.currency.toUpperCase()}`),
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={2}>
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={2}>
            {record.status === 'UPLOAD_SUCCESS' ? (
              <Tooltip title={translate('VIDEO_UPLOADED')}>
                <Button
                  className={classNames(styles.detailsButton, styles.checkIcon)}
                  type="text"
                  icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                />
              </Tooltip>
            ) : (
              <Tooltip
                title={record.video_uid.length > 0 ? translate('VIDEO_IS_PROCESSING') : translate('UPLOAD_VIDEO')}
              >
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
                <Tooltip title={translate('CLONE_VIDEO')}>
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
              title={translate('DELETE_VIDEO_QUESTION')}
              icon={<DeleteOutlined className={styles.danger} />}
              okText={translate('YES')}
              cancelText={translate('NO')}
              onConfirm={() => deleteVideo(record.external_id)}
            >
              <Tooltip title={translate('DELETE_VIDEO')}>
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Col>
          <Col xs={24} md={2}>
            <Tooltip title={translate('COPY_VIDEO_PAGE_LINK')}>
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
              <Tooltip title={translate('HIDE_VIDEO')}>
                <Button type="link" danger onClick={() => unpublishVideo(record.external_id)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_VIDEO')}>
                <Button
                  type="link"
                  disabled={record.status === 'UPLOAD_SUCCESS' ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(record.external_id)}
                >
                  {translate('SHOW')}
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={6}>
            {expandedRowKeys.includes(record.external_id) ? (
              <Button type="link" onClick={() => collapseRow(record.external_id)}>
                {`${record?.buyers?.length || 0} ${translate('BUYERS')} `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.external_id)}>
                {`${record?.buyers?.length || 0} ${translate('BUYERS')}`} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const buyerColumns = [
    {
      title: translate('NAME'),
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: translate('DATE_OF_PURCHASE'),
      dataIndex: 'date_of_purchase',
      key: 'date_of_purchase',
      width: '30%',
      render: (text, record) => toDateAndTime(record.date_of_purchase),
    },
    {
      title: translate('NET_PRICE'),
      dataIndex: 'price_paid',
      key: 'price_paid',
      render: (text, record) => `${record.price_paid} ${record.currency.toUpperCase()}`,
    },
  ];

  const renderSubscriberList = (record) => {
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
            <Text>
              {translate('PURCHASED_AT')} {toDateAndTime(buyer?.date_of_purchase)}{' '}
            </Text>
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
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            <Tooltip title={translate('VIDEO_UPLOADED')}>
              <Button
                className={classNames(styles.detailsButton, styles.checkIcon)}
                type="text"
                icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
              />
            </Tooltip>,
            <Tooltip title={translate('CLONE_VIDEO')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => cloneVideo(video)}
                icon={<ExportOutlined />}
              />
            </Tooltip>,
            <Popconfirm
              title={translate('DELETE_VIDEO_QUESTION')}
              icon={<DeleteOutlined className={styles.danger} />}
              okText={translate('YES')}
              cancelText={translate('NO')}
              onConfirm={() => deleteVideo(video?.external_id)}
            >
              <Tooltip title={translate('DELETE_VIDEO')}>
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>,
            <Tooltip title={translate('COPY_VIDEO_PAGE_LINK')}>
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyVideoPageLink(video?.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            video?.is_published ? (
              <Tooltip title={translate('HIDE_VIDEO')}>
                <Button type="link" danger onClick={() => unpublishVideo(video?.external_id)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_VIDEO')}>
                <Button
                  type="link"
                  disabled={video?.status === 'UPLOAD_SUCCESS' ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(video?.external_id)}
                >
                  {translate('SHOW')}
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
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showUploadVideoModal(video)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            <Tooltip title={video?.video_uid.length > 0 ? translate('VIDEO_IS_PROCESSING') : translate('UPLOAD_VIDEO')}>
              <Button
                className={styles.detailsButton}
                type="text"
                disabled={video?.video_uid.length ? true : false}
                onClick={() => showUploadVideoModal(video, 2)}
                icon={<CloudUploadOutlined />}
              />
            </Tooltip>,
            <Popconfirm
              title={translate('DELETE_VIDEO_QUESTION')}
              icon={<DeleteOutlined className={styles.danger} />}
              okText={translate('YES')}
              cancelText={translate('NO')}
              onConfirm={() => deleteVideo(video?.external_id)}
            >
              <Tooltip title={translate('DELETE_VIDEO')}>
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>,
            <Tooltip title={translate('COPY_VIDEO_PAGE_LINK')}>
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyVideoPageLink(video?.external_id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            video?.is_published ? (
              <Tooltip title={translate('HIDE_VIDEO')}>
                <Button type="link" danger onClick={() => unpublishVideo(video?.external_id)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_VIDEO')}>
                <Button
                  type="link"
                  disabled={video?.status === 'UPLOAD_SUCCESS' ? false : true}
                  className={styles.successBtn}
                  onClick={() => publishVideo(video?.external_id)}
                >
                  {translate('SHOW')}
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
              <Text>{video?.title}</Text>
              {video?.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
            </div>
          }
          actions={actionButtons}
        >
          {layout(translate('VALIDITY'), <Text>{`${video?.validity} ${translate('DAYS')}`}</Text>)}
          {layout(translate('PRICE'), <Text>{`${video?.price} ${video?.currency.toUpperCase()}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(video?.external_id) && (
          <Row className={styles.cardExpansion}>{video?.buyers?.map(renderMobileBuyerCards)}</Row>
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
        <Col xs={12} md={8} lg={14}>
          <Title level={4}> {translate('VIDEOS')} </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
          </Button>
        </Col>
        <Col xs={24} md={10} lg={6}>
          <Button block type="primary" onClick={() => showUploadVideoModal()} icon={<CloudUploadOutlined />}>
            {translate('UPLOAD_NEW_VIDEO')}
          </Button>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> {translate('PUBLISHED')} </Title>} key="Active">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text={translate('LOADING_VIDEOS')}>
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
                        expandedRowRender: (record) => renderSubscriberList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedRowKeys,
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty description={translate('NO_PUBLISHED_VIDEOS')} />
              )}
            </Panel>
            <Panel header={<Title level={5}> {translate('UNPUBLISHED')} </Title>} key="Expired">
              {videos.length ? (
                <>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text={translate('LOADING_VIDEOS')}>
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
                        expandedRowRender: (record) => renderSubscriberList(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedRowKeys,
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty description={translate('NO_UNPUBLISHED_VIDEOS')} />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Videos;
