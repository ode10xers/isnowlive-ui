import React from 'react';
import moment from 'moment';

import { Button, Popover, List } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

import { isMobileDevice } from 'utils/device';

import styles from './styles.module.scss';

const AddToCalendarButton = ({ type = 'primary', iconOnly = false, eventData }) => {
  const windowObjectDefined = typeof window !== 'undefined';
  const saveOrOpenBlobAvailable = window.Blob && window.navigator.msSaveOrOpenBlob;

  const eventDetails = {
    title: '',
    details: '',
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    url: eventData.url,
  };

  const createGoogleCalendarEventLink = () => {
    const gCalEventDate = `${moment(eventDetails.startTime).utc().format('YYYYMMDD[T]HHmmss[Z]')}/${moment(
      eventDetails.endTime
    )
      .utc()
      .format('YYYYMMDD[T]HHmmss[Z]')}`;

    const searchParams = [
      `action=TEMPLATE`,
      `text=${encodeURIComponent(eventDetails.title)}`,
      `dates=${encodeURIComponent(gCalEventDate)}`,
      `details=${encodeURIComponent(eventDetails.details)}`,
    ].join('&');

    return `https://www.google.com/calendar/render?${searchParams}`;
  };

  // For Apple iCal
  const createICSFileContent = () => {
    const icsStructure = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `URL:${eventDetails.url}`,
      `DTSTART:${moment(eventDetails.startTime).utc().format('YYYYMMDD[T]HHmmss[Z]')}`,
      `DTEND:${moment(eventDetails.endTime).utc().format('YYYYMMDD[T]HHmmss[Z]')}`,
      `SUMMARY:${eventDetails.title}`,
      `DESCRIPTION:${eventDetails.details}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    if (isMobileDevice && (!windowObjectDefined || !saveOrOpenBlobAvailable)) {
      return encodeURI(`data:text/calendar,${icsStructure}`);
    } else {
      return icsStructure;
    }
  };

  const icsFilename = 'test.ics';
  const icsFileContent = createICSFileContent();
  const calendarList = [
    {
      name: 'Google Calendar',
      link: createGoogleCalendarEventLink(),
      isFile: false,
    },
    {
      name: 'Apple Calendar',
      link: icsFileContent,
      isFile: true,
    },
  ];

  const handleLinkClick = (e, calendar) => {
    e.preventDefault();
    e.stopPropagation();

    const isFile = calendar.isFile;
    const url = e.currentTarget.getAttribute('href');

    if (!isMobileDevice && isFile) {
      const blobData = new Blob([url], { type: 'text/calendar' });

      if (windowObjectDefined && saveOrOpenBlobAvailable) {
        window.navigator.msSaveOrOpenBlob(blobData, icsFilename);
      } else {
        // Create an <a> element with download attribute
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blobData);
        link.setAttribute('download', icsFilename);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);

        // Click it programatically
        link.click();
        document.body.removeChild(link);
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderCalendarListItem = (item) => (
    <List.Item>
      <List.Item.Meta
        title={
          <div className={styles.calendarLink}>
            <a href={item.link} onClick={(e) => handleLinkClick(e, item)} target="_blank" rel="noopener noreferrer">
              {item.name}
            </a>
          </div>
        }
      />
    </List.Item>
  );

  const popoverContent = (
    <List
      split={false}
      itemLayout="horizontal"
      dataSource={calendarList}
      renderItem={renderCalendarListItem}
      className={styles.calendarList}
    />
  );

  return (
    <Popover content={popoverContent} trigger="click" title="Add To Calendar">
      {iconOnly ? (
        <Button type="text" icon={<CalendarOutlined />} />
      ) : (
        <Button block type={type}>
          Add To Calendar
        </Button>
      )}
    </Popover>
  );
};

export default AddToCalendarButton;
