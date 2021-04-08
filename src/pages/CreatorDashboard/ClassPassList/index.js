import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card } from 'antd';
import {
  DownOutlined,
  UpOutlined,
  PlusCircleOutlined,
  EditOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
} from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CreatePassModal from 'components/CreatePassModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, generateUrlFromUsername, copyToClipboard } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toDateAndTime },
  timeCalculation: { isBeforeDate },
} = dateUtil;

const ClassPassList = () => {
  const { showSendEmailPopup } = useGlobalContext();

  const [targetPass, setTargetPass] = useState(null);
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const showSendEmailModal = (pass) => {
    let activeRecipients = [];
    let expiredRecipients = [];
    let userIdMap = new Map();

    if (pass.buyers && pass.buyers?.length > 0) {
      // Since pass can be repeatedly bought by the same user
      // (after it expires), we put checks here
      pass.buyers.forEach((buyer) => {
        if (!userIdMap.has(buyer.external_id)) {
          let isActive = isBeforeDate(buyer.expiry_date);
          if (isActive) {
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
          if (isBeforeDate(buyer.expiry_date)) {
            userIdMap.set(buyer.external_id, {
              ...buyer,
              isActive: true,
            });

            // Move the buyer data from expired to active array
            const foundBuyer = activeRecipients.find((recipient) => recipient.external_id === buyer.external_id);

            if (!foundBuyer) {
              activeRecipients.push(buyer);
              expiredRecipients = expiredRecipients.filter((recipient) => recipient.external_id !== buyer.external_id);
            }
          }
        }
      });
    }

    showSendEmailPopup({
      recipients: {
        active: activeRecipients,
        expired: expiredRecipients,
      },
      productId: pass?.external_id || null,
      productType: 'PASS',
    });
  };

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
        showSuccessModal('Pass Published');
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
        showSuccessModal('Pass Unpublished');
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
            currency: classPass.currency.toUpperCase(),
            validity: classPass.validity,
            class_count: classPass.class_count,
            is_published: classPass.is_published,
            sessions: classPass.sessions,
            videos: classPass.videos,
            buyers: classPass.buyers.map((subs) => ({ ...subs, currency: classPass.currency.toUpperCase() })),
            color_code: classPass.color_code,
            external_id: classPass.external_id,
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

  const copyPassLink = (passId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/p/${passId}`;

    copyToClipboard(pageLink);
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
      width: '35%',
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
      title: 'Credit Count',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} Credits` : 'Unlimited Credits'),
    },
    {
      title: 'Validity',
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} day${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '10%',
      render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={4}>
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showSendEmailModal(record)} icon={<MailOutlined />} />
            </Tooltip>
          </Col>
          <Col xs={24} md={4}>
            <Tooltip title="Edit">
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditPassesModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={4}>
            <Tooltip title="Copy Pass Link">
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyPassLink(record.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={5}>
            {record.is_published ? (
              <Tooltip title="Hide Session">
                <Button type="link" danger onClick={() => unpublishPass(record.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Session">
                <Button type="link" className={styles.successBtn} onClick={() => publishPass(record.id)}>
                  Show
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={6}>
            {expandedRowKeys.includes(record.id) ? (
              <Button type="link" onClick={() => collapseRow(record.id)}>
                {`${record.buyers.length} Buyers `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.id)}>
                {`${record.buyers.length} Buyers `} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const buyersColumns = [
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
      render: (text, record) => `${record.price_paid} ${record.currency?.toUpperCase()}`,
    },
  ];

  const renderBuyersList = (record) => {
    return (
      <div className={styles.mb20}>
        <Table
          columns={buyersColumns}
          data={record.buyers}
          loading={isLoading}
          rowKey={(record) => `${record.name}_${record.date_of_purchase}`}
        />
      </div>
    );
  };

  const renderMobileSubscriberCards = (subscriber) => (
    <Col xs={24} key={`${subscriber.name}_${subscriber.date_of_purchase}`}>
      <Card>
        <Row>
          <Col xs={24}>
            <Title level={5}> {subscriber.name} </Title>
          </Col>
          <Col xs={24}>
            <Text> Purchased at {toDateAndTime(subscriber.date_of_purchase)} </Text>
          </Col>
          <Col xs={24}>
            <Text> {`${subscriber.price_paid} ${subscriber.currency.toUpperCase()}`} </Text>
          </Col>
        </Row>
      </Card>
    </Col>
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
      <Col xs={24} key={pass.id}>
        <Card
          className={styles.card}
          title={
            <div style={{ paddingTop: 12, borderTop: `6px solid ${pass.color_code || '#FFF'}` }}>
              <Text>{pass.name}</Text>
            </div>
          }
          actions={[
            <Tooltip title="Send Customer Email">
              <Button type="text" onClick={() => showSendEmailModal(pass)} icon={<MailOutlined />} />
            </Tooltip>,
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
                onClick={() => copyPassLink(pass.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            pass.is_published ? (
              <Tooltip title="Hide Pass">
                <Button type="link" danger onClick={() => unpublishPass(pass.id)}>
                  Hide
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Unhide Pass">
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
          {layout('Credit Count', <Text>{pass.limited ? `${pass.class_count} Credits` : 'Unlimited Credits'}</Text>)}
          {layout('Validity', <Text>{`${pass.validity} days`}</Text>)}
          {layout('Price', <Text>{pass.price > 0 ? `${pass.currency?.toUpperCase()} ${pass.price}` : 'Free'}</Text>)}
        </Card>
        {expandedRowKeys.includes(pass.id) && (
          <Row className={styles.cardExpansion}>{pass.buyers?.map(renderMobileSubscriberCards)}</Row>
        )}
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <CreatePassModal visible={createModalVisible} closeModal={hideCreatePassesModal} editedPass={targetPass} />
      <Row gutter={[8, 24]}>
        <Col xs={12} md={8} lg={14}>
          <Title level={4}> Passes </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>
        <Col xs={24} md={10} lg={6}>
          <Button block type="primary" onClick={() => showCreatePassesModal()} icon={<PlusCircleOutlined />}>
            Create New Pass
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text="Loading Passes">
              <Row gutter={[8, 16]}>{passes.map(renderPassItem)}</Row>
            </Loader>
          ) : (
            <Table
              sticky={true}
              columns={passesColumns}
              data={passes}
              loading={isLoading}
              rowKey={(record) => record.id}
              expandable={{
                expandedRowRender: renderBuyersList,
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
