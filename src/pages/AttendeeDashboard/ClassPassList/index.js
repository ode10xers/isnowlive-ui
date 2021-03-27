import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Typography, Collapse, Card, Tag } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import SessionCards from 'components/SessionCards';
import SimpleVideoCardsList from 'components/SimpleVideoCardsList';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toShortDate },
} = dateUtil;

const ClassPassList = () => {
  const { t: translate } = useTranslation();
  const [passes, setPasses] = useState([]);
  const [expiredPasses, setExpiredPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedActiveRowKeys, setExpandedActiveRowKeys] = useState([]);
  const [expandedExpiredRowKeys, setExpandedExpiredRowKeys] = useState([]);

  const getPassesForAttendee = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getAttendeePasses();

      if (data) {
        setPasses(
          data.active.map((pass, index) => ({
            index,
            key: pass.pass_order_id,
            pass_id: pass.pass_id,
            pass_order_id: pass.pass_order_id,
            name: pass.pass_name,
            price: pass.price,
            limited: pass.limited,
            currency: pass.currency.toUpperCase(),
            validity: pass.validity,
            class_count: pass.class_count,
            classes_remaining: pass.classes_remaining,
            expiry: pass.expiry,
            sessions:
              pass.sessions?.map((session) => ({
                ...session,
                key: `${pass.pass_order_id}_${session.session_id}`,
                username: pass.creator_username,
              })) || [],
            videos: pass.videos?.map((video) => ({
              ...video,
              key: `${pass.pass_order_id}_${video.external_id}`,
              username: pass.creator_username,
            })),
            expired: false,
          }))
        );
        setExpiredPasses(
          data.expired.map((pass, index) => ({
            index,
            key: pass.pass_order_id,
            pass_id: pass.pass_id,
            pass_order_id: pass.pass_order_id,
            name: pass.pass_name,
            price: pass.price,
            limited: pass.limited,
            currency: pass.currency.toUpperCase(),
            validity: pass.validity,
            class_count: pass.class_count,
            classes_remaining: pass.classes_remaining,
            expiry: pass.expiry,
            sessions:
              pass.sessions?.map((session) => ({
                ...session,
                key: `${pass.pass_order_id}_${session.session_id}`,
                username: pass.creator_username,
              })) || [],
            videos:
              pass.videos?.map((video) => ({
                ...video,
                key: `${pass.pass_order_id}_${video.external_id}`,
                username: pass.creator_username,
              })) || [],
            expired: true,
          }))
        );
      }
    } catch (error) {
      showErrorModal(translate('SOMETHING_WENT_WRONG'), error.response?.data?.message);
    }
    setIsLoading(false);
  }, [translate]);

  useEffect(() => {
    getPassesForAttendee();
  }, [getPassesForAttendee]);

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(session?.username || 'app');
    window.open(`${baseUrl}/s/${session?.session_id}`);
  };

  const redirectToVideosPage = (video) => {
    const baseUrl = generateUrlFromUsername(video?.username || 'app');
    window.open(`${baseUrl}/v/${video?.external_id}`);
  };

  const toggleExpandAllActivePasses = () => {
    if (expandedActiveRowKeys.length > 0) {
      setExpandedActiveRowKeys([]);
    } else {
      setExpandedActiveRowKeys(passes.map((pass) => pass.pass_order_id));
    }
  };

  const toggleExpandAllExpiredPasses = () => {
    if (expandedExpiredRowKeys.length > 0) {
      setExpandedExpiredRowKeys([]);
    } else {
      setExpandedExpiredRowKeys(expiredPasses.map((pass) => pass.pass_order_id));
    }
  };

  const expandActiveRow = (rowKey) => {
    const tempExpandedRowsArray = expandedActiveRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedActiveRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseActiveRow = (rowKey) => setExpandedActiveRowKeys(expandedActiveRowKeys.filter((key) => key !== rowKey));

  const expandExpiredRow = (rowKey) => {
    const tempExpandedRowsArray = expandedExpiredRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedExpiredRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseExpiredRow = (rowKey) =>
    setExpandedExpiredRowKeys(expandedExpiredRowKeys.filter((key) => key !== rowKey));

  const passesColumns = [
    {
      title: translate('PASS_NAME'),
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: translate('CREDIT_LEFT'),
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '15%',
      render: (text, record) =>
        record.limited
          ? `${record.classes_remaining}/${record.class_count} ${translate('CREDITS')}`
          : translate('UNLIMITED_CREDITS'),
    },
    {
      title: translate('EXPIRES_ON'),
      dataIndex: 'expiry',
      key: 'expiry',
      align: 'center',
      width: '18%',
      render: (text, record) => toShortDate(record.expiry),
    },
    {
      title: translate('PRICE'),
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '18%',
      render: (text, record) => `${text} ${record.currency.toUpperCase()}`,
    },
    {
      title: '',
      align: 'right',
      render: (text, record) =>
        record.expired ? (
          expandedExpiredRowKeys.includes(record.pass_order_id) ? (
            <Button type="link" onClick={() => collapseExpiredRow(record.pass_order_id)} icon={<UpOutlined />}>
              {translate('CLOSE')}
            </Button>
          ) : (
            <Button type="link" onClick={() => expandExpiredRow(record.pass_order_id)} icon={<DownOutlined />}>
              {translate('MORE')}
            </Button>
          )
        ) : expandedActiveRowKeys.includes(record.pass_order_id) ? (
          <Button type="link" onClick={() => collapseActiveRow(record.pass_order_id)} icon={<UpOutlined />}>
            {translate('CLOSE')}
          </Button>
        ) : (
          <Button type="link" onClick={() => expandActiveRow(record.pass_order_id)} icon={<DownOutlined />}>
            {translate('MORE')}
          </Button>
        ),
    },
  ];

  const renderPassDetails = (record) => (
    <Row>
      {record.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}>{translate('SESSIONS_BOOKABLE_WITH_PASS')}</Text>
          </Col>
          <Col xs={24}>
            <SessionCards sessions={record.sessions} />
          </Col>
        </>
      )}
      {record.videos?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}>{translate('VIDEOS_PURCHASABLE_WITH_PASS')}</Text>
          </Col>
          <Col xs={24}>
            <SimpleVideoCardsList passDetails={record} videos={record.videos} />
          </Col>
        </>
      )}
    </Row>
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
      <div>
        <Card
          className={styles.card}
          title={<Text>{pass.name}</Text>}
          actions={[
            pass.expired ? (
              expandedExpiredRowKeys.includes(pass.pass_order_id) ? (
                <Button type="link" onClick={() => collapseExpiredRow(pass.pass_order_id)} icon={<UpOutlined />}>
                  {translate('CLOSE')}
                </Button>
              ) : (
                <Button type="link" onClick={() => expandExpiredRow(pass.pass_order_id)} icon={<DownOutlined />}>
                  {translate('MORE')}
                </Button>
              )
            ) : expandedActiveRowKeys.includes(pass.pass_order_id) ? (
              <Button type="link" onClick={() => collapseActiveRow(pass.pass_order_id)} icon={<UpOutlined />}>
                {translate('CLOSE')}
              </Button>
            ) : (
              <Button type="link" onClick={() => expandActiveRow(pass.pass_order_id)} icon={<DownOutlined />}>
                {translate('MORE')}
              </Button>
            ),
          ]}
        >
          {layout(
            translate('CREDIT_LEFT'),
            <Text>
              {pass.limited
                ? `${pass.classes_remaining}/${pass.class_count} ${translate('CREDITS')}`
                : translate('UNLIMITED_CREDITS')}
            </Text>
          )}
          {layout(translate('EXPIRES_ON'), <Text>{toShortDate(pass.expiry)}</Text>)}
          {layout(translate('PRICE'), <Text>{`${pass.price} ${pass.currency.toUpperCase()}`}</Text>)}
        </Card>
        {((pass.expired && expandedExpiredRowKeys.includes(pass.pass_order_id)) ||
          expandedActiveRowKeys.includes(pass.pass_order_id)) && (
          <Row gutter={[8, 8]} className={styles.cardExpansion}>
            {pass.sessions?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Sessions bookable using this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.sessions?.map((session) => (
                      <Tag key={session?.key} color="blue" onClick={() => redirectToSessionsPage(session)}>
                        {session?.name}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
            {pass.videos?.length > 0 && (
              <>
                <Col xs={24}>
                  <Text className={styles.ml20}> Videos purchasable using this pass </Text>
                </Col>
                <Col xs={24}>
                  <div className={styles.ml20}>
                    {pass.videos?.map((video) => (
                      <Tag key={video?.key} color="volcano" onClick={() => redirectToVideosPage(video)}>
                        {video?.title}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </>
            )}
          </Row>
        )}
      </div>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> {translate('PASSES')} </Title>
        </Col>
        <Col xs={24}>
          <Collapse>
            <Panel header={<Title level={5}> {translate('ACTIVE_PASSES')} </Title>} key="Active">
              <Row gutter={8}>
                <Col xs={24} md={16} lg={21}></Col>
                <Col xs={24} md={8} lg={3}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllActivePasses()}>
                    {expandedActiveRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
                  </Button>
                </Col>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text={translate('LOADING_ACTIVE_PASS')}>
                      {passes.map(renderPassItem)}
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={passesColumns}
                      data={passes}
                      loading={isLoading}
                      rowKey={(record) => record.pass_order_id}
                      expandable={{
                        expandedRowRender: (record) => renderPassDetails(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedActiveRowKeys,
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Panel>
            <Panel header={<Title level={5}> {translate('EXPIRED_PASSES')} </Title>} key="Expired">
              <Row gutter={8}>
                <Col xs={24} md={16} lg={21}></Col>
                <Col xs={24} md={8} lg={3}>
                  <Button block shape="round" type="primary" onClick={() => toggleExpandAllExpiredPasses()}>
                    {expandedExpiredRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')}
                    {translate('ALL')}
                  </Button>
                </Col>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text={translate('LOADING_EXPIRED_PASS')}>
                      {expiredPasses.map(renderPassItem)}
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={passesColumns}
                      data={expiredPasses}
                      loading={isLoading}
                      rowKey={(record) => record.pass_order_id}
                      expandable={{
                        expandedRowRender: (record) => renderPassDetails(record),
                        expandRowByClick: true,
                        expandIconColumnIndex: -1,
                        expandedRowKeys: expandedExpiredRowKeys,
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default ClassPassList;
