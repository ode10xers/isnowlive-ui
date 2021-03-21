import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Popconfirm, Button, Card, Radio, Empty, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DownCircleOutlined,
  UpCircleOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  PlayCircleOutlined,
  VideoCameraAddOutlined,
  InfoCircleOutlined,
  BookTwoTone,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import Loader from 'components/Loader';
import CalendarView from 'components/CalendarView';
import ZoomDetailsModal from 'components/ZoomDetailsModal';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, getDuration, generateUrlFromUsername, copyPageLinkToClipboard } from 'utils/helper';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import Icons from 'assets/icons';

import styles from './styles.module.scss';

const {
  formatDate: { toLocaleTime, toLongDateWithDay, toLongDateWithLongDay, toLocaleDate },
} = dateUtil;
const { Text, Title } = Typography;
const { creator } = mixPanelEventTags;

const whiteColor = '#FFFFFF';

const SessionsInventories = ({ match }) => {
  const { t: translate } = useTranslation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filteredByDateSession, setFilteredByDateSession] = useState([]);
  const [isPast, setIsPast] = useState(false);
  const [view, setView] = useState('list');
  const [calendarView, setCalendarView] = useState(isMobileDevice ? 'day' : 'month');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [selectedInventoryForZoom, setSelectedInventoryForZoom] = useState(null);

  const getStaffSession = useCallback(async (sessionType) => {
    try {
      const { data } =
        sessionType === 'past' ? await apis.session.getPastSession() : await apis.session.getUpcomingSession();
      if (data) {
        const unfilteredSessions = data.map((i, index) => ({
          index,
          key: i?.inventory_id,
          name: i.name,
          type: i.max_participants > 1 ? translate('GROUP') : translate('1_TO_1'),
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
          is_published: i.is_published,
          is_course: i.is_course,
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
      showErrorModal(translate('SOMETHING_WENT_WRONG'), error.response?.data?.message);
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
        showSuccessModal(translate('EVENT_CANCEL_SUCCESS'));
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { inventory_id: inventory_id });
      showErrorModal(translate('SOMETHING_WENT_WRONG'), error.response?.data?.message);
    }
  };

  const copyInventoryLink = (inventoryId) => {
    const username = getLocalUserDetails().username;
    const pageLink = `${generateUrlFromUsername(username)}/e/${inventoryId}`;

    copyPageLinkToClipboard(pageLink);
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
            children: (
              <>
                <Text className={styles.sessionNameWrapper}>{record.name}</Text>{' '}
                {record.is_published ? null : <EyeInvisibleOutlined style={{ color: '#f00' }} />}{' '}
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
      width: '10%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('DURATION'),
      dataIndex: 'duration',
      key: 'duration',
      width: '15%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('TIME'),
      dataIndex: 'time',
      key: 'time',
      width: '15%',
      render: (text, record) => renderSimpleTableCell(record.is_date, text),
    },
    {
      title: translate('PARTICIPANTS'),
      key: 'participants',
      dataIndex: 'participants',
      width: '12%',
      render: (text, record) =>
        renderSimpleTableCell(record.is_date, `${record.participants || 0} / ${record.max_participants}`),
    },
    {
      title: translate('ACTIONS'),
      width: isPast ? '10%' : '25%',
      render: (text, record) => {
        if (record.is_date) {
          return emptyTableCell;
        }

        const isDisabled = record.participants > 0;
        return isPast ? (
          <Row justify="start">
            <Col>
              <Tooltip title={translate('EVENT_DETAILS')}>
                <Button
                  type="link"
                  className={styles.detailsButton}
                  onClick={() => openSessionInventoryDetails(record)}
                  icon={<InfoCircleOutlined />}
                />
              </Tooltip>
            </Col>
          </Row>
        ) : (
          <Row justify="start" gutter={[8, 8]}>
            <Col md={24} lg={24} xl={4}>
              <Tooltip title={translate('EVENT_DETAILS')}>
                <Button
                  type="link"
                  className={styles.detailsButton}
                  onClick={() => openSessionInventoryDetails(record)}
                  icon={<InfoCircleOutlined />}
                />
              </Tooltip>
            </Col>
            <Col md={24} lg={24} xl={4}>
              <Tooltip title={translate('COPY_EVENT_PAGE_LINK')}>
                <Button type="text" onClick={() => copyInventoryLink(record.inventory_id)} icon={<CopyOutlined />} />
              </Tooltip>
            </Col>
            <Col md={24} lg={24} xl={4}>
              {isDisabled ? (
                <Tooltip title={translate('EVENT_CANNOT_CANCEL')}>
                  <Button type="text" disabled icon={<DeleteOutlined />} />
                </Tooltip>
              ) : (
                <Popconfirm
                  title={translate('CANCEL_SESSIONS_QUESTION')}
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText={translate('YES')}
                  cancelText={translate('NO')}
                  onConfirm={() => deleteInventory(record.inventory_id)}
                >
                  <Tooltip title={translate('CANCEL_EVENT')}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Col>

            {!isPast &&
              (record.start_url ? (
                <>
                  <Col md={24} lg={24} xl={4}>
                    <Tooltip title={translate('SHOW_ZOOM_MEETING_DETAILS')}>
                      <Button
                        type="link"
                        icon={<Icons.VideoLink />}
                        onClick={() => setSelectedInventoryForZoom(record)}
                      />
                    </Tooltip>
                  </Col>
                  <Col md={24} lg={24} xl={4}>
                    <Tooltip title={translate('START_EVENT')}>
                      <Button
                        type="text"
                        onClick={() => trackAndStartSession(record)}
                        icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
                      />
                    </Tooltip>
                  </Col>
                </>
              ) : (
                <Col md={24} lg={24} xl={4}>
                  <Tooltip title={translate('ADD_ZOOM_MEETING_DETAILS')}>
                    <Button
                      type="link"
                      icon={<VideoCameraAddOutlined />}
                      onClick={() => setSelectedInventoryForZoom(record)}
                    />
                  </Tooltip>
                </Col>
              ))}
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

    const meetingDetailsButton = (
      <Tooltip title={translate('SHOW_ZOOM_MEETING_DETAILS')}>
        <Button type="link" icon={<Icons.VideoLink />} onClick={() => setSelectedInventoryForZoom(item)} />
      </Tooltip>
    );

    const startMeetingButton = (
      <Tooltip title={translate('START_EVENT')}>
        <Button
          type="text"
          onClick={() => trackAndStartSession(item)}
          icon={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
        />
      </Tooltip>
    );

    const addMeetingDetailsButton = (
      <Tooltip title={translate('ADD_ZOOM_MEETING_DETAILS')}>
        <Button type="link" icon={<VideoCameraAddOutlined />} onClick={() => setSelectedInventoryForZoom(item)} />
      </Tooltip>
    );

    const actionButtons = [
      <Tooltip title={translate('EVENT_DETAILS')}>
        <Button type="link" onClick={() => openSessionInventoryDetails(item)} icon={<InfoCircleOutlined />} />
      </Tooltip>,
      <Tooltip title={translate('COPY_EVENT_PAGE_LINK')}>
        <Button type="text" onClick={() => copyInventoryLink(item.inventory_id)} icon={<CopyOutlined />} />
      </Tooltip>,
      isCancelDisabled ? (
        <Tooltip title={translate('EVENT_CANNOT_CANCEL')}>
          <Button type="text" disabled icon={<DeleteOutlined />} />
        </Tooltip>
      ) : (
        <Popconfirm
          title={translate('CANCEL_SESSIONS_QUESTION')}
          icon={<DeleteOutlined className={styles.danger} />}
          okText={translate('YES')}
          cancelText={'No'}
          onConfirm={() => deleteInventory(item.inventory_id)}
        >
          <Tooltip title={translate('CANCEL_EVENT')}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    ];

    if (!isPast) {
      if (item.start_url) {
        actionButtons.push(meetingDetailsButton);
        actionButtons.push(startMeetingButton);
      } else {
        actionButtons.push(addMeetingDetailsButton);
      }
    }

    return (
      <Card
        key={`${item.session_id}_${item.start_time}`}
        className={item.is_published ? styles.card : styles.unpublished}
        actions={actionButtons}
        title={
          <div
            style={{ paddingTop: 12, borderTop: `6px solid ${item.color_code || whiteColor}` }}
            onClick={() => openSessionInventoryDetails(item)}
          >
            {item.is_published ? null : <EyeInvisibleOutlined style={{ color: '#f00' }} />}
            <Text>{item.name}</Text>
            {item.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
          </div>
        }
      >
        {layout(translate('TYPE'), <Text>{item.type}</Text>)}
        {layout(translate('DURATION'), <Text>{item.duration}</Text>)}
        {layout(translate('TIME'), <Text>{item.time}</Text>)}
        {layout(
          isPast ? translate('REGISTRATIONS') : translate('ATTENDEES'),
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

  const handleCloseZoomDetailsModal = (shouldRefetch) => {
    setSelectedInventoryForZoom(null);

    if (shouldRefetch) {
      setIsLoading(true);
      getStaffSession(isPast ? 'past' : 'upcoming'); // Do not translate this
    }
  };

  return (
    <>
      <ZoomDetailsModal selectedInventory={selectedInventoryForZoom} closeModal={handleCloseZoomDetailsModal} />
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
                      <div className="text-empty">No {isPast ? translate('PAST') : translate('UPCOMING')} Session</div>
                    )}
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    columns={dateColumns}
                    data={filteredByDateSession}
                    loading={isLoading}
                    rowKey={(record) =>
                      record.is_date ? record.start_time : `${record.session_id}_${record.start_time}`
                    }
                    rowClassName={(record, index) =>
                      !record.is_date && !record.is_published ? styles.unpublished : ''
                    }
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
    </>
  );
};

export default SessionsInventories;
