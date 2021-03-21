import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Typography, Button, Tooltip, Card } from 'antd';
import {
  DownOutlined,
  UpOutlined,
  PlusCircleOutlined,
  EditOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CreatePassModal from 'components/CreatePassModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess, generateUrlFromUsername, copyPageLinkToClipboard } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { toDateAndTime },
} = dateUtil;

const ClassPassList = () => {
  const { t: translate } = useTranslation();
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
        showSuccessModal(translate('PASS_PUBLISHED'));
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal(translate('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
    }

    setIsLoading(false);
  };

  const unpublishPass = async (passId) => {
    setIsLoading(true);

    try {
      const { status } = await apis.passes.unpublishPass(passId);

      if (isAPISuccess(status)) {
        showSuccessModal(translate('PASS_UNPUBLISHED'));
        getPassesForCreator();
      }
    } catch (error) {
      showErrorModal(translate('SOMETHING_WRONG_HAPPENED'), error.response?.data?.message);
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
          }))
        );
      }
    } catch (error) {
      showErrorModal(
        translate('FAILED_FETCHING_PASSES'),
        error.response?.data?.message || translate('SOMETHING_WENT_WRONG')
      );
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

    copyPageLinkToClipboard(pageLink);
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
      title: translate('PASS_NAME'),
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
      title: translate('CREDIT_COUNT'),
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) => (record.limited ? `${text} ${translate('CREDITS')}` : translate('UNLIMITED_CREDITS')),
    },
    {
      title: translate('VALIDITY'),
      dataIndex: 'validity',
      key: 'validity',
      align: 'center',
      width: '12%',
      render: (text, record) => `${text} ${translate('DAY')}${parseInt(text) > 1 ? 's' : ''}`,
    },
    {
      title: translate('PRICE'),
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '10%',
      render: (text, record) => `${record.currency?.toUpperCase()} ${text}`,
    },
    {
      title: '',
      align: 'right',
      render: (text, record) => (
        <Row gutter={8}>
          <Col xs={24} md={4}>
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditPassesModal(record)}
                icon={<EditOutlined />}
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={4}>
            <Tooltip title={translate('COPY_PASS_LINK')}>
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
              <Tooltip title={translate('HIDE_SESSION')}>
                <Button type="link" danger onClick={() => unpublishPass(record.id)}>
                  {translate('HIDE_SESSION')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_SESSION')}>
                <Button type="link" className={styles.successBtn} onClick={() => publishPass(record.id)}>
                  {translate('SHOW')}
                </Button>
              </Tooltip>
            )}
          </Col>
          <Col xs={24} md={6}>
            {expandedRowKeys.includes(record.id) ? (
              <Button type="link" onClick={() => collapseRow(record.id)}>
                {`${record.buyers.length} ${translate('BUYERS')} `} <UpOutlined />
              </Button>
            ) : (
              <Button type="link" onClick={() => expandRow(record.id)}>
                {`${record.buyers.length} ${translate('BUYERS')} `} <DownOutlined />
              </Button>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  const buyersColumns = [
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
            <Text>
              {translate('PURCHASED_AT')} {toDateAndTime(subscriber.date_of_purchase)}{' '}
            </Text>
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
            <Tooltip title={translate('EDIT')}>
              <Button
                className={styles.detailsButton}
                type="text"
                onClick={() => showEditPassesModal(pass)}
                icon={<EditOutlined />}
              />
            </Tooltip>,
            <Tooltip title={translate('COPY_PASS_LINK')}>
              <Button
                type="text"
                className={styles.detailsButton}
                onClick={() => copyPassLink(pass.id)}
                icon={<CopyOutlined />}
              />
            </Tooltip>,
            pass.is_published ? (
              <Tooltip title={translate('HIDE_PASS')}>
                <Button type="link" danger onClick={() => unpublishPass(pass.id)}>
                  {translate('HIDE')}
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title={translate('SHOW_PASS')}>
                <Button type="link" className={styles.successBtn} onClick={() => publishPass(pass.id)}>
                  {translate('SHOW')}
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
          {layout(
            translate('CREDIT_COUNT'),
            <Text>{pass.limited ? `${pass.class_count} ${translate('CREDITS')}` : translate('UNLIMITED_CREDITS')}</Text>
          )}
          {layout(translate('VALIDITY'), <Text>{`${pass.validity} ${translate('DAYS')}`}</Text>)}
          {layout(translate('PRICE'), <Text>{`${pass.currency?.toUpperCase()} ${pass.price}`}</Text>)}
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
          <Title level={4}> {translate('PASSES')} </Title>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
          </Button>
        </Col>
        <Col xs={24} md={10} lg={6}>
          <Button block type="primary" onClick={() => showCreatePassesModal()} icon={<PlusCircleOutlined />}>
            {translate('CREATE_NEW_PASS')}
          </Button>
        </Col>
        <Col xs={24}>
          {isMobileDevice ? (
            <Loader loading={isLoading} size="large" text={translate('LOADING_PASSES')}>
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
