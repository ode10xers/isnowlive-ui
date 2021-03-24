import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Button, Card, Popconfirm, message, Modal, Popover, Radio, Empty } from 'antd';
import { BookTwoTone, UpCircleOutlined, DownCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import AddToCalendarButton from 'components/AddToCalendarButton';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getDuration, generateUrlFromUsername, generateQueryString } from 'utils/helper';
import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLocaleDate, toLongDateWithLongDay },
  timeCalculation: { isBeforeLimitHours },
} = dateUtil;
const { Text, Title } = Typography;
const { attendee } = mixPanelEventTags;

const whiteColor = '#FFF';

const SessionsInventories = ({ match }) => {
  const { t: translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('list');
  const [filteredByDateSession, setFilteredByDateSession] = useState([]);
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const getStaffSession = useCallback(
    async (sessionType) => {
      try {
        const { data } =
          sessionType === 'past'
            ? await apis.session.getAttendeePastSession()
            : await apis.session.getAttendeeUpcomingSession();
        if (data) {
          const unfilteredSessions = data.map((i, index) => ({
            index,
            key: i?.session_id,
            name: i?.name,
            type: i?.max_participants > 1 ? 'Group' : '1-on-1',
            duration: getDuration(i?.start_time, i?.end_time),
            days: i?.start_time ? toLongDateWithDay(i?.start_time) : null,
            session_date: i?.session_date,
            time: i?.start_time && i?.end_time ? `${toLocaleTime(i?.start_time)} - ${toLocaleTime(i?.end_time)}` : null,
            start_time: i?.start_time,
            end_time: i?.end_time,
            participants: i?.num_participants,
            join_url: i?.join_url,
            inventory_id: i?.inventory_id,
            session_id: i?.session_id,
            order_id: i?.order_id,
            max_participants: i?.max_participants,
            username: i?.creator_username,
            price: i?.price,
            currency: i?.currency.toUpperCase() || 'SGD',
            refund_amount: i?.refund_amount || 0,
            is_refundable: i?.is_refundable || false,
            refund_before_hours: i?.refund_before_hours || 24,
            is_course: i?.is_course,
            color_code: i?.color_code || whiteColor,
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
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
        setIsLoading(false);
      }
    },
    [translate]
  );

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

  const trackAndJoinSession = (data) => {
    const eventTag = isMobileDevice ? attendee.click.sessions.mobile.joinSession : attendee.click.sessions.joinSession;

    trackSimpleEvent(eventTag, { session_data: data });
    window.open(data.join_url);
  };

  const openSessionInventoryDetails = (item) => {
    const eventTag = isMobileDevice
      ? attendee.click.sessions.mobile.sessionDetails
      : isPast
      ? attendee.click.sessions.pastSessionDetails
      : attendee.click.sessions.upcomingSessionDetails;

    trackSimpleEvent(eventTag, {
      creator: item.username,
      session_data: item,
    });

    if (item.username && item.inventory_id) {
      window.open(`${generateUrlFromUsername(item.username)}/e/${item.inventory_id}`);
    }
  };

  const cancelOrderForSession = async (orderId) => {
    try {
      await apis.session.cancelCustomerOrder(orderId, { reason: 'requested_by_customer' });
      trackSuccessEvent(attendee.click.sessions.cancelOrder, { order_id: orderId });
      Modal.success({
        closable: true,
        maskClosable: true,
        title: translate('REFUND_SUCCESSFULLY'),
      });
      getStaffSession(match?.params?.session_type);
    } catch (error) {
      trackFailedEvent(attendee.click.sessions.cancelOrder, error, { order_id: orderId });
      Modal.error({
        closable: true,
        maskClosable: true,
        title: translate('AN_ERROR_OCCURRED'),
        content: error.response?.data?.message || translate('SOMETHING_WENT_WRONG'),
      });
    }
  };

  const renderRefundPopup = (data) => {
    if (data.is_refundable) {
      if (isBeforeLimitHours(data.start_time, data.refund_before_hours)) {
        return (
          <Popconfirm
            arrowPointAtCenter
            placement="topRight"
            title={
              <Text>
                {translate('DO_YOU_WANT_TO_REFUND')} <br />
                {translate('DO_YOU_WANT_TO_REFUND_TEXT1')}{' '}
                <strong>{` ${data.currency.toUpperCase()} ${data.refund_amount} `}</strong>
                {translate('DO_YOU_WANT_TO_REFUND_TEXT2')}
              </Text>
            }
            onConfirm={() => cancelOrderForSession(data.order_id)}
            okText={translate('DO_YOU_WANT_TO_REFUND_CONFIRM')}
            cancelText={translate('NO')}
          >
            <Button type="text" danger>
              {translate('CANCEL')}
            </Button>
          </Popconfirm>
        );
      } else {
        return (
          <Popover
            arrowPointAtCenter
            placement="topRight"
            trigger="click"
            title={translate('DO_YOU_WANT_TO_REFUND_ERROR_TITLE')}
            content={
              <Text>
                {translate('DO_YOU_WANT_TO_REFUND_ERROR_TEXT1')}
                <br />
                {translate('DO_YOU_WANT_TO_REFUND_ERROR_TEXT2')}
                <strong>
                  {translate('DO_YOU_WANT_TO_REFUND_ERROR_TEXT3')}
                  <br />
                  {data.refund_before_hours} {translate('HOURS')}
                </strong>
                {translate('DO_YOU_WANT_TO_REFUND_ERROR_TEXT5')}
              </Text>
            }
          >
            <Button type="text" danger>
              {translate('CANCEL')}
            </Button>
          </Popover>
        );
      }
    } else {
      return (
        <Popover
          arrowPointAtCenter
          placement="topRight"
          trigger="click"
          title={translate('SESSION_CANNOT_REFUND_ERROR_TITLE')}
          content={
            <Text>
              {translate('SESSION_CANNOT_REFUND_ERROR_TEXT1')}
              <br />
              {translate('SESSION_CANNOT_REFUND_ERROR_TEXT2')}
            </Text>
          }
        >
          <Button type="text" danger>
            {translate('CANCEL')}
          </Button>
        </Popover>
      );
    }
  };

  const rescheduleSession = (data) => {
    const passedData = {
      inventory_id: data.inventory_id,
      order_id: data.order_id,
      price: data.price,
    };

    window.open(`${generateUrlFromUsername(data.username)}/reschedule?${generateQueryString(passedData)}`);
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
      title: translate('SESSION_NAME'),
      dataIndex: 'name',
      key: 'name',
      width: '150px',
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
            children: (
              <>
                <Text className={styles.sessionNameWrapper}>{record.name}</Text>{' '}
                {record.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
              </>
            ),
          };
        }
      },
    },
    {
      title: translate('TYPE'),
      dataIndex: 'type',
      key: 'type',
      width: '72px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('DAY'),
      key: 'days',
      dataIndex: 'days',
      width: '150px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('DURATION'),
      dataIndex: 'duration',
      key: 'duration',
      width: '90px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('TIME'),
      dataIndex: 'time',
      key: 'time',
      width: '180px',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('ACTIONS'),
      // width: isPast ? '56px' : '360px',
      render: (text, record) => {
        if (record.is_date) {
          return emptyTableCell;
        }

        return isPast ? (
          <Row justify="start">
            <Col>
              <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(record)}>
                {translate('DETAILS')}
              </Button>
            </Col>
          </Row>
        ) : (
          <Row justify="space-around">
            {!isPast && (
              <Col md={24} xl={6}>
                <AddToCalendarButton
                  buttonText={translate('ADD_TO_CAL')}
                  eventData={{
                    ...record,
                    page_url: `${generateUrlFromUsername(record?.username)}/e/${record.inventory_id}`,
                  }}
                />
              </Col>
            )}

            {!isPast && (
              <>
                <Col md={24} lg={24} xl={4}>
                  <Button
                    type="text"
                    className={styles.success}
                    disabled={!record.join_url}
                    onClick={() => trackAndJoinSession(record)}
                  >
                    {translate('JOIN')}
                  </Button>
                </Col>
                <Col md={24} lg={24} xl={4}>
                  {renderRefundPopup(record)}
                </Col>
              </>
            )}
            <Col md={24} lg={24} xl={4}>
              <Button type="link" onClick={() => openSessionInventoryDetails(record)}>
                {translate('DETAILS')}
              </Button>
            </Col>

            {!isPast && (
              <Col md={24} lg={24} xl={6}>
                <Button type="text" className={styles.warning} onClick={() => rescheduleSession(record)}>
                  {translate('RESCHEDULE')}
                </Button>
              </Col>
            )}
          </Row>
        );
      },
    },
  ];

  const mobileTableColumns = [
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
    const layout = (label, value) => (
      <Row>
        <Col span={9}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={15}>: {value}</Col>
      </Row>
    );

    return (
      <Card
        key={item.inventory_id}
        title={
          <div onClick={() => openSessionInventoryDetails(item)}>
            <Text>{item.name}</Text>
            {'  '}
            {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </div>
        }
        actions={
          isPast
            ? [
                <Button type="link" className={styles.detailsButton} onClick={() => openSessionInventoryDetails(item)}>
                  {translate('DETAILS')}
                </Button>,
              ]
            : [
                <Button
                  type="text"
                  disabled={!item.join_url}
                  onClick={() => trackAndJoinSession(item)}
                  className={styles.success}
                >
                  {translate('JOIN')}
                </Button>,
                renderRefundPopup(item),
                <Button className={styles.warning} type="text" onClick={() => rescheduleSession(item)}>
                  {translate('RESCHEDULE')}
                </Button>,
              ]
        }
      >
        <div onClick={() => openSessionInventoryDetails(item)}>
          {layout(translate('TYPE'), <Text>{item.type}</Text>)}
          {layout(translate('DURATION'), <Text>{item.duration}</Text>)}
          {layout(translate('DAY'), <Text>{item.days}</Text>)}
          {layout(translate('TIME'), <Text>{item.time}</Text>)}
        </div>
        <div className={styles.mt20}>
          <AddToCalendarButton
            type="button"
            buttonText={translate('ADD_TO_MY_CAL')}
            eventData={{
              ...item,
              page_url: `${generateUrlFromUsername(item?.username)}/e/${item.inventory_id}`,
            }}
          />
        </div>
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
      <Row gutter={[8, 8]}>
        <Col xs={24} md={18} lg={20}>
          <Title level={4}>
            {isPast ? translate('PAST') : translate('UPCOMING')} {translate('SESSIONS')}
          </Title>
          <Radio.Group value={view} onChange={handleViewChange}>
            <Radio.Button value="list">{translate('LIST')}</Radio.Button>
            <Radio.Button value="calendar">{translate('CALENDAR')}</Radio.Button>
          </Radio.Group>
        </Col>
        <Col xs={24} md={6} lg={4}>
          <Button block shape="round" type="primary" onClick={() => toggleExpandAll()}>
            {expandedRowKeys.length > 0 ? translate('COLLAPSE') : translate('EXPAND')} {translate('ALL')}
          </Button>
        </Col>
        <Col xs={24}>
          {view === 'calendar' ? (
            <Loader loading={isLoading} size="large" text={translate('LOADING_SESSIONS')}>
              {sessions.length > 0 ? (
                <CalendarView
                  inventories={sessions}
                  onSelectInventory={openSessionInventoryDetails}
                  onViewChange={onViewChange}
                  calendarView={calendarView}
                />
              ) : (
                <Empty description={translate('NO_DATA')} />
              )}
            </Loader>
          ) : (
            <>
              {isMobileDevice ? (
                <>
                  <Text className={`${styles.helperText} ${styles.mt10} ${styles.mb10}`}>
                    {translate('SHOW_SESSION_DETAILS_CARD_TEXT')}
                  </Text>
                  <Loader loading={isLoading} size="large" text={translate('LOADING_SESSIONS')}>
                    {sessions.length > 0 ? (
                      <Table
                        columns={mobileTableColumns}
                        data={filteredByDateSession.map((session) => ({
                          session_id: session.session_id,
                          start_time: session.start_time,
                          name: session.name,
                          is_date: session.is_date,
                          sessions: session.children,
                        }))}
                        loading={isLoading}
                        rowKey={(record) =>
                          record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                        }
                        expandable={{
                          expandedRowRender: (record) => <> {record.sessions.map(renderSessionItem)} </>,
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
                      <div className="text-empty">
                        {translate('NO')} {isPast ? translate('PAST') : translate('UPCOMING')} {translate('SESSIONS')}
                      </div>
                    )}
                  </Loader>
                </>
              ) : filteredByDateSession.length > 0 ? (
                <Table
                  sticky={true}
                  columns={dateColumns}
                  data={filteredByDateSession}
                  loading={isLoading}
                  rowKey={(record) =>
                    record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                  }
                  rowClassName={(record, index) => (!record.is_date && !record.is_published ? styles.unpublished : '')}
                  expandable={{
                    expandedRowKeys: expandedRowKeys,
                    rowExpandable: (record) => record.is_date,
                    onExpand: (expanded, record) => {
                      if (expanded) {
                        expandRow(record.start_time);
                      } else {
                        collapseRow(record.start_time);
                      }
                    },
                  }}
                />
              ) : (
                <div className="text-empty">
                  {translate('NO')} {isPast ? translate('PAST') : translate('UPCOMING')} {translate('SESSIONS')}
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SessionsInventories;
