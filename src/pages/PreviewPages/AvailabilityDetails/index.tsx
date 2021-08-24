import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { match } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';

import HTMLReactParser from 'html-react-parser';
import moment from 'moment';
// @ts-ignore
import classNames from 'classnames';

import { Button, Card, Col, Divider, Image, message, Row, Select, Typography } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import apis from 'apis';
import dummy from 'data/dummy';

import Loader from 'components/Loader';
import SessionRegistrationPreview from '../SessionRegistrationPreview';

import type { Session, SessionInventory } from 'types/models/session';

import dateUtil from 'utils/date';
import { generateColorPalletteForProfile } from 'utils/colors';
import { getUsernameFromUrl, isAPISuccess, reservedDomainName } from 'utils/helper';

import useQueryParamState from 'hooks/useQueryParamState';

import styles from './styles.module.scss';

const {
  formatDate: { getTimeDiff },
} = dateUtil;
const { Paragraph, Text, Title } = Typography;

export interface AvailabilityDetailsPreviewProps {
  match?: match<{ session_id: string }>;
}

type AvailabilityDetailsView = 'all' | 'date' | 'form';

const AvailabilityDetailPreview: React.VFC<AvailabilityDetailsPreviewProps> = ({ match }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<Session>();
  const [showLongDescription, setShowLongDescription] = useState(false);
  const inventoriesByDates = useMemo<Record<string, Record<string, SessionInventory[]>>>(
    () =>
      (availability?.inventory ?? []).reduce((acc, inv) => {
        const momentStartTime = moment(inv.start_time);
        const monthYear = momentStartTime.format('MMMM YYYY');
        const date = momentStartTime.format('YYYY-MM-DD');

        return { ...acc, [monthYear]: { ...(acc[monthYear] ?? {}), [date]: [...(acc[monthYear]?.[date] ?? []), inv] } };
      }, {} as Record<string, Record<string, SessionInventory[]>>),
    [availability]
  );
  const months = useMemo<string[]>(() => Object.keys(inventoriesByDates), [inventoriesByDates]);
  const [selectedMonth, setSelectedMonth] = useQueryParamState('monthYear');
  useEffect(() => {
    if (selectedMonth === undefined) setSelectedMonth(months[0]);
  }, [months, selectedMonth, setSelectedMonth]);
  const dates = useMemo<string[]>(
    () =>
      selectedMonth && inventoriesByDates[selectedMonth] !== undefined
        ? Object.keys(inventoriesByDates[selectedMonth])
        : [],
    [inventoriesByDates, selectedMonth]
  );
  const [selectedDate, setSelectedDate] = useQueryParamState('date');
  useEffect(() => {
    if (selectedMonth) {
      if (selectedDate === undefined) {
        setSelectedDate(dates[0]);
      }
    }
  }, [selectedMonth, selectedDate, dates, setSelectedDate]);

  const inventories = inventoriesByDates[selectedMonth ?? '']?.[selectedDate ?? ''] ?? [];
  const [selectedInventoryId, setSelectedInventoryId] = useQueryParamState('inventory');
  useEffect(() => {
    if (selectedMonth && selectedDate) {
      if (selectedInventoryId === undefined) {
        const availableInventory = inventories.find((inv) => inv.num_participants === 0)?.inventory_id;

        if (availableInventory) {
          setSelectedInventoryId(availableInventory);
        }
      }
    }
  }, [selectedMonth, selectedDate, selectedInventoryId, inventories, setSelectedInventoryId]);
  const selectedInventory = useMemo(
    () => availability?.inventory.find((inv) => inv.inventory_id === Number(selectedInventoryId)),
    [availability, selectedInventoryId]
  );
  // const [view, setView] = useState<AvailabilityDetailsView>(isMobileDevice ? (selectedInventoryId ? 'form' : 'date') : 'all')
  const [view, setView] = useState<AvailabilityDetailsView>('date');

  const [creatorProfile, setCreatorProfile] = useState<any>(null);

  const fetchCreatorProfile = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const creatorDetailsResponse = await apis.user.getProfileByUsername(username);

      if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
        setCreatorProfile(creatorDetailsResponse.data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch creator profile');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfile(domainUsername);
    }
  }, [fetchCreatorProfile]);

  useEffect(() => {
    if (match?.params.session_id) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      //@ts-ignore
      const dummyAvailabilities = dummy[templateData].AVAILABILITIES;
      const targetAvail = dummyAvailabilities.find((avail : Session) => avail.session_id === parseInt(match?.params?.session_id));

      if (targetAvail) {
        setAvailability(targetAvail);
      } else {
        message.error('Invalid availability ID');
      }
    }
  }, [match, creatorProfile]);

  useEffect(() => {
    let profileColorObject: Record<string, string> | null = null;
    if (creatorProfile !== null) {
      profileColorObject = generateColorPalletteForProfile(creatorProfile?.profile?.color || '#1890ff', true);

      Object.entries(profileColorObject).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    }

    return () => {
      if (profileColorObject) {
        Object.keys(profileColorObject).forEach((key) => {
          document.documentElement.style.removeProperty(key);
        });
      }
    };
  }, [creatorProfile]);

  useEffect(() => {
    if (view === 'form') {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [view]);

  const handleChangeMonth = useCallback(
    (month: string) => {
      setSelectedMonth(month);
      setSelectedDate(undefined);
      setSelectedInventoryId(undefined);
    },
    [setSelectedMonth, setSelectedDate, setSelectedInventoryId]
  );

  const handleChangeDate = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setSelectedInventoryId(undefined);
    },
    [setSelectedDate, setSelectedInventoryId]
  );

  const handleChangeTime = useCallback(
    (inventory: SessionInventory) => {
      if (inventory.num_participants < 1) {
        setSelectedInventoryId(inventory.inventory_id);
      }
    },
    [setSelectedInventoryId]
  );

  const heading = useMemo(
    () => (
      <>
        <Row>
          <Text className={styles.availabilityInfo}>
            {availability?.total_price && availability?.total_price > 0
              ? `${availability?.currency?.toUpperCase()} ${availability?.total_price}`
              : 'Free'}
          </Text>
          <Text className={styles.availabilityInfoSeparator}>{' ● '}</Text>
          <Text className={styles.availabilityInfo}>
            {getTimeDiff(
              // @ts-ignore
              moment(availability?.inventory[0].end_time),
              // @ts-ignore
              moment(availability?.inventory[0].start_time),
              'minutes'
            )}{' '}
            mins
          </Text>
        </Row>
        <Title className={styles.availabilityTitle}>{availability?.name}</Title>
        {availability?.is_offline && (
          <Title className={styles.availabilityLocation}>Location : {availability?.offline_event_address}</Title>
        )}
        <Paragraph
          className={styles.availabilityDescription}
          style={showLongDescription ? undefined : { maxHeight: 64, overflow: 'hidden' }}
        >
          {HTMLReactParser(availability?.description ?? '')}
        </Paragraph>
        {!showLongDescription && (
          <Button
            type="link"
            className={styles.readMoreButton}
            onClick={() => setShowLongDescription(true)}
            icon={<CaretDownOutlined />}
          >
            Read More
          </Button>
        )}
      </>
    ),
    [availability, showLongDescription]
  );

  return (
    <div className={styles.availabilityPageContainer}>
      {/* @ts-ignore */}
      <Loader loading={isLoading} size="large" text="Loading availability">
        <Image
          className={styles.availabilityHeaderImage}
          preview={false}
          src={availability?.session_image_url}
          width="100%"
        />

        <Row className={styles.mobileOnly}>
          <Col xs={24}>{heading}</Col>
        </Row>

        <Row className={styles.availabilityContentContainer} gutter={[30, 0]}>
          {/* {view === 'all' || view === 'date' ? ( */}
          <Col xs={24} lg={16} className={classNames(styles.dateView, view === 'form' ? styles.hidden : undefined)}>
            <div className={styles.desktopOnly}>{heading}</div>

            <Divider className={styles.availabilityDivider} />

            <Row align="middle" className={styles.availabilityTitleWrapper}>
              <Col xs={12}>
                <Title id="date-selector-title" className={styles.availabilityDateTitle}>
                  Select Date
                </Title>
              </Col>
              <Col xs={12}>
                <Select
                  className={styles.availabilityMonth}
                  options={months.map((m) => ({ label: m, value: m }))}
                  value={selectedMonth}
                  onChange={handleChangeMonth}
                />
              </Col>
            </Row>

            <Swiper slidesPerView={4.2} spaceBetween={12} breakpoints={{ 768: { slidesPerView: 7, spaceBetween: 12 } }}>
              {dates.map((date) => {
                const momentDate = moment(date);
                const dateString = momentDate.format('YYYY-MM-DD');
                const isSelected = dateString === selectedDate;

                return (
                  <SwiperSlide key={dateString}>
                    <Card
                      bordered={false}
                      style={{ borderRadius: 14 }}
                      bodyStyle={{
                        backgroundColor: isSelected ? 'var(--passion-profile-darker-color)' : undefined,
                        border: isSelected ? '1.8px solid var(--passion-profile-darker-color)' : '1.8px solid #D9D9D9',
                        borderRadius: 14,
                        marginBottom: 1,
                        padding: 4,
                      }}
                      onClick={() => handleChangeDate(dateString)}
                    >
                      <Paragraph
                        className={classNames(
                          styles.availabilityDateDayOfWeek,
                          isSelected ? styles.availabilityTextSelected : undefined
                        )}
                        ellipsis={{ rows: 1 }}
                      >
                        {momentDate.format('ddd')}
                      </Paragraph>
                      <Paragraph
                        className={classNames(
                          styles.availabilityDateDayOfMonth,
                          isSelected ? styles.availabilityTextSelected : undefined
                        )}
                        ellipsis={{ rows: 1 }}
                      >
                        {momentDate.format('DD')}
                      </Paragraph>
                    </Card>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {selectedDate ? (
              <>
                <Divider />

                <Row align="middle" className={styles.availabilityTitleWrapper}>
                  <Col xs={24}>
                    <Title className={styles.availabilityDateTitle}>Select Time Slot</Title>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  {inventories.map((inv) => {
                    const momentStartTime = moment(inv.start_time);
                    const momentEndTime = moment(inv.end_time);
                    const isSelected = inv === selectedInventory;
                    const isBooked = inv.num_participants > 0;

                    return (
                      <Col xs={8} key={inv.inventory_external_id}>
                        <Card
                          bordered={false}
                          bodyStyle={{
                            backgroundColor: isSelected ? 'var(--passion-profile-darker-color)' : undefined,
                            border: isSelected
                              ? '1.8px solid var(--passion-profile-darker-color)'
                              : '1.8px solid #D9D9D9',
                            borderRadius: 14,
                            marginBottom: 1,
                            padding: 4,
                            opacity: isBooked ? 0.3 : undefined,
                          }}
                          onClick={() => handleChangeTime(inv)}
                        >
                          <Paragraph
                            className={classNames(
                              styles.availabilityTimeRange,
                              isSelected ? styles.availabilityTextSelected : undefined
                            )}
                          >
                            {momentStartTime.format('HH:mm')}
                            {' - '}
                            {momentEndTime.format('HH:mm')}
                          </Paragraph>
                          <Paragraph
                            className={classNames(
                              styles.availabilityTimeInfo,
                              isSelected
                                ? styles.availabilityTimeInfoSelected
                                : isBooked
                                ? styles.availabilityTimeInfoBooked
                                : styles.availabilityTimeInfoAvailable
                            )}
                          >
                            {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                          </Paragraph>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </>
            ) : null}

            <Button
              block
              className={styles.confirmBookingButton}
              disabled={!selectedInventory}
              onClick={() => setView('form')}
              size="large"
              type="primary"
            >
              Confirm Booking
            </Button>
          </Col>
          {/* ) : null} */}

          {/* {view === 'all' || view === 'form' ? ( */}
          <Col xs={24} lg={8} className={classNames(styles.formView, view === 'date' ? styles.hidden : undefined)}>
            <Button
              ghost
              block
              className={styles.changeDateButton}
              onClick={() => setView('date')}
              size="large"
              type="primary"
            >
              Change Date
            </Button>

            <Loader loading={isLoading} text="Processing...">
              {availability && (
                <SessionRegistrationPreview
                  fullWidth
                  classDetails={{ ...selectedInventory, ...availability }}
                  isInventoryDetails={true}
                />
              )}
            </Loader>
          </Col>
          {/* ) : null} */}
        </Row>
      </Loader>
    </div>
  );
};

export default AvailabilityDetailPreview