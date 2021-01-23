import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Popconfirm, Button, Card, message, Radio, Empty } from 'antd';
import { DeleteOutlined, DownCircleOutlined, UpCircleOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import apis from 'apis';
import Routes from 'routes';
import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import { isAPISuccess, getDuration } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLongDateWithLongDay, toLocaleDate },
} = dateUtil;
const { Text, Title } = Typography;
const { creator } = mixPanelEventTags;

const whiteColor = '#FFFFFF';

const SessionsInventories = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filteredByDateSession, setFilteredByDateSession] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const getStaffSession = useCallback(async (sessionType) => {
    try {
      const { data } =
        sessionType === 'past' ? await apis.session.getPastSession() : await apis.session.getUpcomingSession();
      if (data) {
        const unfilteredSessions = data.map((i, index) => ({
          index,
          key: i?.inventory_id,
          name: i.name,
          type: i.max_participants > 1 ? 'Group' : '1-on-1',
          duration: getDuration(i.start_time, i.end_time),
          days: i?.start_time ? toLongDateWithDay(i.start_time) : null,
          session_date: i?.session_date,
          time: i?.start_time && i.end_time ? `${toLocaleTime(i.start_time)} - ${toLocaleTime(i.end_time)}` : null,
          start_time: i?.start_time,
          end_time: i?.end_time,
          participants: i.num_participants,
          start_url: i.start_url,
          inventory_id: i?.inventory_id,
          session_id: i.session_id,
          max_participants: i.max_participants,
          color_code: i.color_code,
        }));

        let filterByDateSessions = [];

        unfilteredSessions.forEach((session) => {
          const foundIndex = filterByDateSessions.findIndex(
            (val) => val.start_time === toLocaleDate(session.start_time)
          );

          if (foundIndex >= 0) {
            filterByDateSessions[foundIndex].children.push(session);
          } else {
            filterByDateSessions.push({
              start_time: toLocaleDate(session.start_time),
              name: session.start_time,
              is_date: true,
              children: [session],
            });
          }
        });
        setSessions(unfilteredSessions);
        setFilteredByDateSession(filterByDateSessions);
      }
      setIsLoading(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (match?.params?.session_type) {
      setSessions([]);
      setIsLoading(true);
      if (match?.params?.session_type === 'past') {
        setIsPast(true);
      } else {
        setIsPast(false);
      }
      getStaffSession(match?.params?.session_type);
    }
  }, [match.params.session_type, getStaffSession]);

  const trackAndStartSession = (data) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.startSession
      : creator.click.sessions.list.startSession;

    trackSimpleEvent(eventTag, { session_data: data });
    window.open(data.start_url);
  };

  const openSessionInventoryDetails = (item) => {
    const eventTag = isMobileDevice
      ? creator.click.sessions.list.mobile.sessionDetails
      : isPast
      ? creator.click.sessions.list.pastSessionsDetails
      : creator.click.sessions.list.upcomingSessionsDetails;

    trackSimpleEvent(eventTag, { session_data: item });

    if (item.inventory_id) {
      history.push(`${Routes.creatorDashboard.rootPath}/sessions/e/${item.inventory_id}/details`);
    }
  };

  const deleteInventory = async (inventory_id) => {
    const eventTag = creator.click.sessions.list.cancelSession;

    try {
      const { status } = await apis.session.delete(JSON.stringify([inventory_id]));
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { inventory_id: inventory_id });
        getStaffSession(match?.params?.session_type);
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { inventory_id: inventory_id });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const emptyTableCell = {
    props: {
      colSpan: 0,
      rowSpan: 0,
    },
  };

  const renderSimpleTableCell = (shouldNotRender, text) => (shouldNotRender ? emptyTableCell : <Text> {text} </Text>);

  const toggleExpandAll = () => {
    if (expandedRowKeys.length > 0) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(filteredByDateSession.map((date) => date.start_time));
    }
  };

  const expandRow = (rowKey) => {
    const tempExpandedRowsArray = expandedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRow = (rowKey) => setExpandedRowKeys(expandedRowKeys.filter((key) => key !== rowKey));

  let dateColumns = [
    {
      title: 'Session Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text, record) => {
        if (record.is_date) {
          return {
            props: {
              colSpan: 6,
            },
            children: (
              <Text strong className={styles.textAlignLeft}>
                {toLongDateWithLongDay(text)}
              </Text>
            ),
          };
        } else {
          return {
            props: {
              style: {
                borderLeft: `6px solid ${record.color_code || whiteColor}`,
              },
            },
            children: <Text className={styles.textAlignLeft}>{record.name}</Text>,
          };
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: '15%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: '15%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: 'Participants',
      key: 'participants',
      dataIndex: 'participants',
      width: '12%',
      render: (text, record) =>
        renderSimpleTableCell(record.is_date, `${record.participants || 0} / ${record.max_participants}`),
    },
    {
      title: 'Actions',
      width: isPast ? '10%' : '25%',
      render: (text, record) => {
        if (record.is_date) {
          return emptyTableCell;
        }

        const isDisabled = record.participants > 0;
        return isPast ? (
          <Row justify="start">
            <Col>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>
          </Row>
        ) : (
          <Row justify="start">
            <Col md={24} lg={24} xl={8}>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                Details
              </Button>
            </Col>
            <Col md={24} lg={24} xl={8}>
              {isDisabled ? (
                <Button type="text" disabled={isDisabled}>
                  Cancel
                </Button>
              ) : (
                <Popconfirm
                  title="Do you want to cancel session?"
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => deleteInventory(record.inventory_id)}
                >
                  <Button type="text" danger>
                    Cancel
                  </Button>
                </Popconfirm>
              )}
            </Col>

            <Col md={24} lg={24} xl={8}>
              {!isPast && (
                <Button type="link" disabled={!record.start_url} onClick={() => trackAndStartSession(record)}>
                  Start
                </Button>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  let mobileTableColumns = [
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong className={styles.textAlignLeft}>
          {toLongDateWithLongDay(text)}
        </Text>
      ),
    },
  ];

  const renderSessionItem = (item) => {
    const isCancelDisabled = item.participants > 0;

    const layout = (label, value) => (
      <Row>
        <Col span={8}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={16}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        className={styles.card}
        title={
          <div
            style={{ paddingTop: 12, borderTop: `6px solid ${item.color_code || whiteColor}` }}
            onClick={() => openSessionInventoryDetails(item)}
          >
            <Text>{item.name}</Text>
          </div>
        }
        actions={[
          <Button className={styles.detailsButton} onClick={() => openSessionInventoryDetails(item)} type="link">
            Details
          </Button>,
          isCancelDisabled ? (
            <Button type="text" disabled={true}>
              Cancel
            </Button>
          ) : (
            <Popconfirm
              title="Do you want to cancel session?"
              icon={<DeleteOutlined className={styles.danger} />}
              okText="Yes"
              cancelText={'No'}
              onConfirm={() => deleteInventory(item.inventory_id)}
            >
              <Button type="text" danger>
                Cancel
              </Button>
            </Popconfirm>
          ),
          <>
            {!isPast && (
              <Button type="link" disabled={!item.start_url} onClick={() => trackAndStartSession(item)}>
                Start
              </Button>
            )}
          </>,
        ]}
      >
        {layout('Type', <Text>{item.type}</Text>)}
        {layout('Duration', <Text>{item.duration}</Text>)}
        {layout('Time', <Text>{item.time}</Text>)}
        {layout(
          isPast ? 'Registrations' : 'Attendees',
          <Text>
            {item.participants || 0} {'/'} {item.max_participants}
          </Text>
        )}
      </Card>
    );
  };

  const handleViewChange = (e) => {
    setView(e.target.value);
  };

  const onViewChange = (e) => {
    setCalendarView(e);
  };

  return (
    <div className={styles.box}>
      <Row gutter={8}>
        <Col xs={24} md={18} lg={20}>
          <Title level={4}>{isPast ? 'Past' : 'Upcoming'} Sessions</Title>
          <Radio.Group value={view} onChange={handleViewChange}>
            <Radio.Button value="list">List</Radio.Button>
            <Radio.Button value="calendar">Calendar</Radio.Button>
          </Radio.Group>
        </Col>
        <Col xs={24} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
          </Button>
        </Col>

        <Col xs={24}>
          {view === 'calendar' ? (
            <Loader loading={isLoading} size="large" text="Loading sessions">
              {sessions.length > 0 ? (
                <CalendarView
                  inventories={sessions}
                  onSelectInventory={openSessionInventoryDetails}
                  onViewChange={onViewChange}
                  calendarView={calendarView}
                />
              ) : (
                <Empty />
              )}
            </Loader>
          ) : (
            <>
              {isMobileDevice ? (
                <Loader loading={isLoading} size="large" text="Loading sessions">
                  {sessions.length > 0 ? (
                    <Table
                      columns={mobileTableColumns}
                      data={filteredByDateSession}
                      loading={isLoading}
                      rowKey={(record) => record.start_time}
                      expandable={{
                        expandedRowRender: (record) => <> {record.children.map(renderSessionItem)} </>,
                        expandRowByClick: true,
                        onExpand: (expanded, record) => {
                          if (expanded) {
                            expandRow(record.start_time);
                          } else {
                            collapseRow(record.start_time);
                          }
                        },
                        expandedRowKeys: expandedRowKeys,
                        expandIcon: ({ expanded, onExpand, record }) =>
                          expanded ? (
                            <UpCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                          ) : (
                            <DownCircleOutlined style={{ fontSize: 20 }} onClick={(e) => onExpand(record, e)} />
                          ),
                      }}
                    />
                  ) : (
                    <div className="text-empty">No {isPast ? 'Past' : 'Upcoming'} Session</div>
                  )}
                </Loader>
              ) : (
                <Table
                  sticky={true}
                  columns={dateColumns}
                  data={filteredByDateSession}
                  loading={isLoading}
                  rowKey={(record) => record.start_time}
                  expandable={{
                    expandedRowKeys: expandedRowKeys,
                    onExpand: (expanded, record) => {
                      if (expanded) {
                        expandRow(record.start_time);
                      } else {
                        collapseRow(record.start_time);
                      }
                    },
                  }}
                />
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SessionsInventories;
