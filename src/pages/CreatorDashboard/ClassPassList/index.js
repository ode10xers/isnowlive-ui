import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card, Badge, message } from 'antd';
import {
  DownOutlined,
  UpOutlined,
  PlusCircleOutlined,
  EditOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CreateClassPassModal from 'components/CreateClassPassModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const ClassPassList = () => {
  const [targetPass, setTargetPass] = useState(null);
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showCreatePassesModal = () => {
    setCreateModalVisible(true);
  };

  const hideCreatePassesModal = (shouldRefresh = false) => {
    setCreateModalVisible(false);
    setTargetPass(null);

    if (shouldRefresh) {
      getPassesForCreator();
    }
  };

  const showEditPassesModal = (pass) => {
    setTargetPass(pass);
    showCreatePassesModal();
  };

  const publishPass = async (passId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.passes.publishPass(passId);

      if (isAPISuccess(status)) {
        showSuccessModal('Class Pass Published');
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishPass = async (passId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.passes.unpublishPass(passId);

      if (isAPISuccess(status)) {
        showSuccessModal('Class Pass Unpublished');
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const getPassesForCreator = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getCreatorPasses();

      if (data) {
        setPasses(
          data.map((classPass, index) => ({
            index,
            key: classPass.id,
            id: classPass.id,
            name: classPass.name,
            price: classPass.price,
            limited: classPass.limited,
            currency: classPass.currency,
            validity: classPass.validity,
            class_count: classPass.class_count,
            is_published: classPass.is_published,
            sessions: classPass.sessions,
            subscribers: classPass.subscribers.map((subs) => ({ ...subs, currency: classPass.currency })),
            color_code: classPass.color_code,
          }))
        );
      }
    } catch (error) {
      showErrorModal('Failed fetching Passes', error.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForCreator();
    //eslint-disable-next-line
  }, []);

  const copyPageLinkToClipboard = (passId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/p/${passId}`;

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

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(passes.map((pass) => pass.id));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: (
            <>
              <Text> {record.name} </Text>
              {record.is_published ? null : <EyeInvisibleOutlined />}
            </>
          ),
        };
      },
    },
    {
      title: 'Pass Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '136px',
      render: (text, record) => (record.limited ? `${text} Classes` : 'Unlimited Classes'),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '72px',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '86px',
      render: (text, record) => `${text} ${record.currency}`,
    },
    {
      title: '',
      align: 'right',
      width: '160px',
      render: (text, record) => (
        <Row gutter={[8, 8]}>
          <Col xs={24} md={5}>
            <Tooltip title="Edit">
              <Button
                block
                className={styles.detailsButton}
                type="text"
                size="small"
                onClick={() => showEditPassesModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={5}>
            <Tooltip title="Copy Pass Link">
              <Button
                block
                type="text"
                size="small"
                className={styles.detailsButton}
                onClick={() => copyPageLinkToClipboard(record.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={5}>
            {record.is_published ? (
              <Tooltip title="Hide Session">
                <Button
                  block
                  type="link"
                  size="small"
                  danger
                  onClick={() => unpublishPass(record.id)}
                  icon={<EyeInvisibleOutlined />}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Session">
                <Button
                  block
                  type="link"
                  size="small"
                  className={styles.successBtn}
                  onClick={() => publishPass(record.id)}
                  icon={<EyeOutlined />}
                />
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={9}>
            <Tooltip title="Subscribers of this pass">
              {expandedRowKeys.includes(record.id) ? (
                <Button type="link" size="small" onClick={() => collapseRow(record.id)}>
                  <Badge showZero={true} size="small" count={record.subscribers.length}>
                    <UserOutlined style={{ color: '#1890ff' }} />
                  </Badge>
                  <UpOutlined />
                </Button>
              ) : (
                <Button type="link" size="small" onClick={() => expandRow(record.id)}>
                  <Badge showZero={true} size="small" count={record.subscribers.length}>
                    <UserOutlined style={{ color: '#1890ff' }} />
                  </Badge>
                  <DownOutlined />
                </Button>
              )}
            </Tooltip>
          </Col>
        </Row>
      ),
    },
  ];

  const subscribersColumns = [
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

  const renderSubscribersList = (record) => {
    return (
      <div className={styles.mb20}>
        <Table
          columns={subscribersColumns}
          data={record.subscribers}
          loading={isLoading}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileSubscriberCards = (subscriber) => (
    <Card>
      <Row>
        <Col xs={24}>
          <Title level={5}> {subscriber.name} </Title>
        </Col>
        <Col xs={24}>
          <Text> Purchased at {toDateAndTime(subscriber.date_of_purchase)} </Text>
        </Col>
        <Col xs={24}>
          <Text> {`${subscriber.price_paid} ${subscriber.currency}`} </Text>
        </Col>
      </Row>
    </Card>
  );

  const renderPassItem = (pass) => {
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
            <div style={{ paddingTop: 12, borderTop: `6px solid ${pass.color_code || '#FFF'}` }}>
              <Text>{pass.name}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditPassesModal(pass)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            <Tooltip title="Copy Pass Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyPageLinkToClipboard(pass.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            pass.is_published ? (
              <Tooltip title="Hide Session">
                <Button type="link" danger onClick={() => unpublishPass(pass.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Session">
                <Button type="link" className={styles.successBtn} onClick={() => publishPass(pass.id)}>
                  Show
                </Button>
              </Tooltip>
            ),
            expandedRowKeys.includes(pass.id) ? (
              <Button type="link" onClick={() => collapseRow(pass.id)} icon={<UpOutlined />} />
            ) : (
              <Button type="link" onClick={() => expandRow(pass.id)} icon={<DownOutlined />} />
            ),
          ]}
        >
          {layout('Class Count', <Text>{pass.limited ? `${pass.class_count} Classes` : 'Unlimited Classes'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} days`}</Text>)}
          {layout('Price', <Text>{`${pass.price} ${pass.currency}`}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row className={styles.cardExpansion}>
            <div className={styles.mb20}>{pass.subscribers.map(renderMobileSubscriberCards)}</div>
          </Row>
        )}
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <CreateClassPassModal visible={createModalVisible} closeModal={hideCreatePassesModal} editedPass={targetPass} />
      <Row gutter={[8, 24]}>
        <Col xs={12} md={10} lg={14}>
          <Title level={4}> Class Passes </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24} md={8} lg={6}>
          <Button block type="primary" onClick={() => showCreatePassesModal()} icon={<PlusCircleOutlined />}>
            Create New Pass
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading Class Passes">
              <Row gutter={[8, 16]}>{passes.map(renderPassItem)}</Row>
            </Loader>
          ) : (
            <Table
              sticky={true}
              columns={passesColumns}
              data={passes}
              loading={isLoading}
              rowKey={(record) => record.id}
              size="small"
              expandable={{
                expandedRowRender: (record) => renderSubscribersList(record),
                expandRowByClick: true,
                expandIconColumnIndex: -1,
                expandedRowKeys: expandedRowKeys,
              }}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ClassPassList;
