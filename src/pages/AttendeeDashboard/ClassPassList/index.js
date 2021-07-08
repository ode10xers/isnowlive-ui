import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Typography, Collapse, Card, Tag } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
// import SessionCards from 'components/SessionCards';
// import SimpleVideoCardsList from 'components/SimpleVideoCardsList'
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { isUnapprovedUserError } from 'utils/helper';
import { redirectToSessionsPage, redirectToVideosPage } from 'utils/redirect';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const {
  formatDate: { toShortDate },
} = dateUtil;

const ClassPassList = () => {
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
        setExpandedActiveRowKeys(data.active.length > 0 ? [data.active[0].pass_order_id] : []);
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
        setExpandedExpiredRowKeys(data.expired.length > 0 ? [data.expired[0].pass_order_id] : []);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something wrong happened', error.response?.data?.message);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForAttendee();
  }, [getPassesForAttendee]);

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

  const generatePassesColumns = (isExpired) => [
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      // width: '35%',
    },
    {
      title: 'Credit Left',
      dataIndex: 'class_count',
      key: 'class_count',
      align: 'right',
      width: '160px',
      render: (text, record) =>
        record.limited ? `${record.classes_remaining}/${record.class_count} Credits` : 'Unlimited Credits',
    },
    {
      title: 'Expires On',
      dataIndex: 'expiry',
      key: 'expiry',
      align: 'center',
      width: '120px',
      render: (text, record) => toShortDate(record.expiry),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'left',
      width: '100px',
      render: (text, record) => (record.price > 0 ? `${record.price} ${record.currency.toUpperCase()}` : 'Free'),
    },
    {
      title: (
        <Button
          block
          ghost
          type="primary"
          onClick={isExpired ? toggleExpandAllExpiredPasses : toggleExpandAllActivePasses}
        >
          {(isExpired && expandedExpiredRowKeys.length > 0) || expandedActiveRowKeys.length > 0 ? 'Collapse' : 'Expand'}{' '}
          All
        </Button>
      ),
      align: 'right',
      width: '140px',
      render: (text, record) =>
        isExpired ? (
          expandedExpiredRowKeys.includes(record.pass_order_id) ? (
            <Button type="link" onClick={() => collapseExpiredRow(record.pass_order_id)} icon={<UpOutlined />}>
              Close
            </Button>
          ) : (
            <Button type="link" onClick={() => expandExpiredRow(record.pass_order_id)} icon={<DownOutlined />}>
              More
            </Button>
          )
        ) : expandedActiveRowKeys.includes(record.pass_order_id) ? (
          <Button type="link" onClick={() => collapseActiveRow(record.pass_order_id)} icon={<UpOutlined />}>
            Close
          </Button>
        ) : (
          <Button type="link" onClick={() => expandActiveRow(record.pass_order_id)} icon={<DownOutlined />}>
            More
          </Button>
        ),
    },
  ];

  const renderSessionList = (sessions = []) => (
    <Row gutter={[8, 8]} className={styles.p10}>
      {sessions.map((session) => (
        <Col xs={24} sm={12} lg={8} key={session.session_external_id}>
          <SessionListCard session={session} />
        </Col>
      ))}
    </Row>
  );

  const renderVideoList = (videos = []) => (
    <Row gutter={[8, 8]} className={styles.p10}>
      {videos.map((video) => (
        <Col xs={24} sm={12} lg={8} key={video.external_id}>
          <VideoListCard video={video} />
        </Col>
      ))}
    </Row>
  );

  const renderPassDetails = (record) => (
    <Row>
      {record.sessions?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}> Sessions bookable with this pass </Text>
          </Col>
          <Col xs={24}>
            {/* <SessionCards sessions={record.sessions} /> */}
            {renderSessionList(record.sessions)}
          </Col>
        </>
      )}
      {record.videos?.length > 0 && (
        <>
          <Col xs={24}>
            <Text className={styles.ml20}> Videos purchasable with this pass </Text>
          </Col>
          <Col xs={24}>
            {/* <SimpleVideoCardsList passDetails={record} videos={record.videos} /> */}
            {renderVideoList(record.videos)}
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
      <Col key={pass.pass_order_id}>
        <Card
          className={styles.card}
          title={<Text>{pass.name}</Text>}
          actions={[
            pass.expired ? (
              expandedExpiredRowKeys.includes(pass.pass_order_id) ? (
                <Button type="link" onClick={() => collapseExpiredRow(pass.pass_order_id)} icon={<UpOutlined />}>
                  Close
                </Button>
              ) : (
                <Button type="link" onClick={() => expandExpiredRow(pass.pass_order_id)} icon={<DownOutlined />}>
                  More
                </Button>
              )
            ) : expandedActiveRowKeys.includes(pass.pass_order_id) ? (
              <Button type="link" onClick={() => collapseActiveRow(pass.pass_order_id)} icon={<UpOutlined />}>
                Close
              </Button>
            ) : (
              <Button type="link" onClick={() => expandActiveRow(pass.pass_order_id)} icon={<DownOutlined />}>
                More
              </Button>
            ),
          ]}
        >
          {layout(
            'Credits Left',
            <Text>{pass.limited ? `${pass.classes_remaining}/${pass.class_count} Credits` : 'Unlimited Credits'}</Text>
          )}
          {layout('Expires On', <Text>{toShortDate(pass.expiry)}</Text>)}
          {layout('Price', <Text>{pass.price > 0 ? `${pass.price} ${pass.currency.toUpperCase()}` : 'Free'}</Text>)}
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
      </Col>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> Passes </Title>
        </Col>
        <Col xs={24}>
          <Collapse defaultActiveKey="Active">
            <Panel header={<Title level={5}> Active Passes </Title>} key="Active">
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Active Passes">
                      <Row gutter={[8, 8]}>{passes.map(renderPassItem)}</Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={generatePassesColumns(false)}
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
            <Panel header={<Title level={5}> Expired Passes </Title>} key="Expired">
              <Row gutter={[8, 8]}>
                <Col xs={24}>
                  {isMobileDevice ? (
                    <Loader loading={isLoading} size="large" text="Loading Expired Passes">
                      <Row gutter={[8, 8]}>{expiredPasses.map(renderPassItem)}</Row>
                    </Loader>
                  ) : (
                    <Table
                      sticky={true}
                      columns={generatePassesColumns(true)}
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
