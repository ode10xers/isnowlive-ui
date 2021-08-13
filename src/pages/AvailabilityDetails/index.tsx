import { Button, Card, Col, Divider, Image, message, Row, Select, Typography } from 'antd'
import apis from 'apis'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { match } from 'react-router'
import { Swiper, SwiperSlide } from 'swiper/react'
import moment from 'moment'
import HTMLReactParser from 'html-react-parser'
// @ts-ignore
import classNames from 'classnames'

import Loader from 'components/Loader'
import SessionRegistration from 'components/SessionRegistration'
import type { Session, SessionInventory } from 'types/models/session'
import { getUsernameFromUrl, isAPISuccess, reservedDomainName } from 'utils/helper'
import dateUtil from 'utils/date'
import { isMobileDevice } from 'utils/device'

import styles from './styles.module.scss';
import useQueryParamState from 'hooks/useQueryParamState'
import { generateColorPalletteForProfile } from 'utils/colors'

const { formatDate: { getTimeDiff } } = dateUtil
const { Paragraph, Text, Title } = Typography

export interface AvailabilityDetailsProps {
  match?: match<{ session_id: string }>
}

type AvailabilityDetailsView = 'all' | 'date' | 'form'

const AvailabilityDetails: React.VFC<AvailabilityDetailsProps> = ({ match }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [availability, setAvailability] = useState<Session>()
  const [showLongDescription, setShowLongDescription] = useState(false)
  const inventoreiesByDates = useMemo<Record<string, Record<string, SessionInventory[]>>>(() =>
    (availability?.inventory ?? [])
      .reduce((acc, inv) => {
        const momentStartTime = moment(inv.start_time)
        const monthYear = momentStartTime.format("MMMM YYYY")
        const date = momentStartTime.format("YYYY-MM-DD")

        return { ...acc, [monthYear]: { ...(acc[monthYear] ?? {}), [date]: [ ...(acc[monthYear]?.[date] ?? []), inv] } }
      }, {} as Record<string, Record<string, SessionInventory[]>>),
    [availability],
  )
  const months = useMemo<string[]>(() => Object.keys(inventoreiesByDates), [inventoreiesByDates])
  const [selectedMonth, setSelectedMonth] = useQueryParamState('monthYear')
  useEffect(() => {
    if (selectedMonth === undefined) setSelectedMonth(months[0])
  }, [months, selectedMonth, setSelectedMonth])
  const dates = useMemo<string[]>(
    () => selectedMonth && inventoreiesByDates[selectedMonth] !== undefined ? Object.keys(inventoreiesByDates[selectedMonth]) : [],
    [inventoreiesByDates, selectedMonth],
  )
  const [selectedDate, setSelectedDate] = useQueryParamState('date')
  const inventories = inventoreiesByDates[selectedMonth ?? '']?.[selectedDate ?? ''] ?? []
  const [selectedInventoryId, setSelectedInventoryId] = useQueryParamState('inventory')
  const selectedInventory = useMemo(
    () => availability?.inventory.find(inv => inv.inventory_id === Number(selectedInventoryId)),
    [availability, selectedInventoryId]
  )
  const [view, setView] = useState<AvailabilityDetailsView>(isMobileDevice ? (selectedInventoryId ? 'form' : 'date') : 'all')

  const fetchAvailabilityDetail = useCallback(async (session_id: string) => {
    setIsLoading(true)

    const { data, status } = await apis.availabilities.getAvailabilityDetails(session_id) ?? {}

    if (isAPISuccess(status) && data) {
      setAvailability(data)
    }

    setIsLoading(false)
  }, [])

  const updateProfileColor = useCallback(async (username: string) => {
    const creatorDetailsResponse = await apis.user.getProfileByUsername(username);

    if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
      Object.entries(generateColorPalletteForProfile(
        creatorDetailsResponse.data?.profile?.color || '#1890ff'),
      ).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val)
      })
    }

  }, [])

  useEffect(() => {
    if (match?.params.session_id) {
      const domainUsername = getUsernameFromUrl();

      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        fetchAvailabilityDetail(match.params.session_id);
        updateProfileColor(domainUsername)
      }
    } else {
      message.error('Session details not found.');
    }
  }, [fetchAvailabilityDetail, match, updateProfileColor])

  const handleChangeMonth = useCallback((month: string) => {
    setSelectedMonth(month)
    setSelectedDate(undefined)
    setSelectedInventoryId(undefined)
  }, [setSelectedMonth, setSelectedDate, setSelectedInventoryId])

  const handleChangeDate = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedInventoryId(undefined)
  }, [setSelectedDate, setSelectedInventoryId])

  const handleChangeTime = useCallback((inventory: SessionInventory) => {
    if (inventory.num_participants < 1) {
      setSelectedInventoryId(inventory.inventory_id)
    }
  }, [setSelectedInventoryId])

  const heading = useMemo(() => (
    <>
      <Row>
        <Text className={styles.availabilityInfo}>
          {availability?.currency.toUpperCase()}
          {' '}
          {availability?.price}
        </Text>
        <Text className={styles.availabilityInfoSeparator}>
          {' ● '}
        </Text>
        <Text className={styles.availabilityInfo} >
          {/* @ts-ignore */}
          {getTimeDiff(moment(availability?.inventory[0].end_time), moment(availability?.inventory[0].start_time), 'minutes')} mins
        </Text>
      </Row>
      <Title className={styles.availabilityTitle}>
        {availability?.name}
      </Title>
      <Paragraph
        className={styles.availabilityDescription}
        style={showLongDescription ? undefined : { maxHeight: 70, overflow: 'hidden' }}
      >
        {HTMLReactParser(availability?.description ?? '')}
      </Paragraph>
      {!showLongDescription && (
        <Button
          type="link"
          onClick={() => setShowLongDescription(true)}
        >
          Read More
        </Button>
      )}
    </>
  ), [availability, showLongDescription])

  return (
    // @ts-ignore
    <Loader loading={isLoading} size="large" text="Loading availability">
      <Image
        className={styles.availabilityHeaderImage}
        preview={false}
        src={availability?.session_image_url}
        width="100%"
      />

      {isMobileDevice ? (
        <Row>
          <Col xs={24}>
            {heading}
          </Col>
        </Row>
      ) : null}


      <Row className={styles.availabilityContentContainer} gutter={[30, 0]}>
        {view === 'all' || view === 'date' ? (
          <Col xs={isMobileDevice ? 24 : 16}>
            {isMobileDevice ? null : heading}

            <Divider />

            <Row align="middle" className={styles.availabilityTitleWrapper}>
              <Col xs={16}>
                <Title className={styles.availabilitDateTitle}>
                  Select Date
                </Title>
              </Col>
              <Col xs={8}>
                <Select
                  className={styles.availabilityMonth}
                  options={months.map(m => ({ text: m, value: m }))}
                  value={selectedMonth}
                  onChange={handleChangeMonth}
                />
              </Col>
            </Row>

            <Swiper slidesPerView={isMobileDevice ? 5.3 : 7} spaceBetween={12}>
              {dates.map(date => {
                const momentDate = moment(date)
                const dateString = momentDate.format('YYYY-MM-DD')
                const isSelected = dateString === selectedDate

                return (
                  <SwiperSlide>
                    <Card
                      bordered={false}
                      bodyStyle={{
                        backgroundColor: isSelected ? 'var(--passion-profile-lightest-color)' : undefined,
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
                      >
                        {momentDate.format("ddd")}
                      </Paragraph>
                      <Paragraph className={classNames(
                        styles.availabilityDateDayOfMonth,
                        isSelected ? styles.availabilityTextSelected : undefined
                      )}>
                        {momentDate.format("DD")}
                      </Paragraph>
                    </Card>
                  </SwiperSlide>
                )
              })}
            </Swiper>

            {selectedDate ? (
              <>
                <Divider />

                <Row align="middle" className={styles.availabilityTitleWrapper}>
                  <Col xs={24}>
                    <Title className={styles.availabilitDateTitle}>
                      Select Time Slot
                    </Title>
                  </Col>
                </Row>

                <Row className={styles.availabilityDateWrapper}>
                  {inventories.map(inv => {
                    const momentStartTime = moment(inv.start_time)
                    const momentEndTime = moment(inv.end_time)
                    const isSelected = inv === selectedInventory
                    const isBooked = inv.num_participants > 0

                    return (
                      <Col xs={8}>
                        <Card
                          bordered={false}
                          bodyStyle={{
                            backgroundColor: isSelected ? 'var(--passion-profile-lightest-color)' : undefined,
                            border: isSelected ? '1.8px solid var(--passion-profile-darker-color)' : '1.8px solid #D9D9D9',
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
                            {momentStartTime.format("HH:mm")}
                            {" - "}
                            {momentEndTime.format("HH:mm")}
                          </Paragraph>
                          <Paragraph
                            className={
                              classNames(
                                styles.availabilityTimeInfo,
                                isSelected
                                  ? styles.availabilityTimeInfoSelected
                                  : (isBooked
                                    ? styles.availabilityTimeInfoBooked
                                    : styles.availabilityTimeInfoAvailable),
                              )
                            }
                          >
                            {isSelected ? 'Selected' : (isBooked ? 'Booked' : 'Available')}
                          </Paragraph>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              </>
            ) : null}

            {isMobileDevice ? (
              <Button block onClick={() => setView('form')} size="large" type="primary">
                Confirm Booking
              </Button>
            ) : null}
          </Col>
        ) : null}

        {view === 'all' || view === 'form' ? (
          <Col xs={isMobileDevice ? 24 : 8}>
            {isMobileDevice ? (
              <Button block onClick={() => setView('date')} size="large" type="primary">
                Change Date
              </Button>
            ) : null}

            <SessionRegistration
              classDetails={selectedInventory}
              fullWidth
              isInventoryDetails={true}
            />
          </Col>
        ) : null}
      </Row>
    </Loader>
  )
}

export default AvailabilityDetails
