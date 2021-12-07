import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Typography, Space, Avatar, Divider, Spin, Button, Drawer, Empty, Affix, Grid, message } from 'antd';
import {
  CaretDownOutlined,
  CheckCircleFilled,
  PlayCircleFilled,
  BookFilled,
  BarsOutlined,
  CalendarFilled,
} from '@ant-design/icons';

import apis from 'apis';

import AuthModal from 'components/AuthModal';
import { generateCardHeadingStyle } from 'components/ContainerCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import AvailabilityListItem from 'components/DynamicProfileComponents/AvailabilityProfileComponent/AvailabilityListItem';
import { showErrorModal, showPurchasePassSuccessModal, showAlreadyBookedModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { getExternalLink, getUsernameFromUrl } from 'utils/url';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { socialMediaIcons, orderType, productType, reservedDomainName } from 'utils/constants';
import { generateColorPalletteForProfile, convertHexToRGB, isBrightColorShade } from 'utils/colors';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const {
  formatDate: { toMonthYear },
} = dateUtil;

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// NOTE: We don't currrently support pass for gifts
// but later on if we do, make sure to add the isGiftEnabled flag just
// like in other products (sessions, course, video)
const PassDetails = ({ match }) => {
  const { showPaymentPopup } = useGlobalContext();
  const { lg } = useBreakpoint();

  const [isLoading, setIsLoading] = useState(true);

  const [otherPassesLoading, setOtherPassesLoading] = useState(true);
  const [creatorPasses, setCreatorPasses] = useState([]);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [initialPassDetails, setInitialPassDetails] = useState(null);
  const [selectedPassDetails, setSelectedPassDetails] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const [shouldExpandCreatorBio, setShouldExpandCreatorBio] = useState(false);

  const [creatorProfileColor, setCreatorProfileColor] = useState(null);

  const [moreView, setMoreView] = useState('sessions');
  const [bottomSheetsVisible, setBottomSheetsVisible] = useState(false);

  // const [purchaseAsGift, setPurchaseAsGift] = useState(false);

  //#region Start of API Call Methods

  const fetchCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
        setCreatorProfileColor(data.profile?.color ?? null);
      }
    } catch (error) {
      console.error(error);
      showErrorModal(
        'Failed to fetch creator profile details',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }
  }, []);

  const fetchInitialPassDetails = useCallback(async (pass_id) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.passes.getPassById(pass_id);

      if (isAPISuccess(status) && data) {
        setInitialPassDetails(data);
        setSelectedPassDetails(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch pass details', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchCreatorOtherPasses = useCallback(async () => {
    setOtherPassesLoading(true);
    try {
      const { status, data } = await apis.passes.getPassesByUsername();

      if (isAPISuccess(status) && data) {
        setCreatorPasses(data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch other passes for creator');
    }
    setOtherPassesLoading(false);
  }, []);

  //#endregion End of API Call Methods

  //#region Start of Use Effects

  useEffect(() => {
    if (match.params.pass_id) {
      fetchInitialPassDetails(match.params.pass_id);
    }
  }, [match.params.pass_id, fetchInitialPassDetails]);

  useEffect(() => {
    const domainUsername = getUsernameFromUrl();

    if (domainUsername && !reservedDomainName.includes(domainUsername)) {
      fetchCreatorProfileDetails(domainUsername);
    }

    fetchCreatorOtherPasses();
  }, [fetchCreatorProfileDetails, fetchCreatorOtherPasses]);

  useEffect(() => {
    let profileColorObject = null;
    if (creatorProfileColor) {
      profileColorObject = generateColorPalletteForProfile(creatorProfileColor, true);

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
  }, [creatorProfileColor]);

  //#endregion End of Use Effects

  //#region Start of purchase logic

  // const createOrder = async (couponCode = '', isGift = false) => {
  const createOrder = async (couponCode = '') => {
    if (!selectedPassDetails) {
      showErrorModal('Something went wrong', 'Invalid Pass Selected');
      return null;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: selectedPassDetails.external_id,
        price: selectedPassDetails.total_price,
        coupon_code: couponCode,
        currency: selectedPassDetails.currency.toLowerCase(),
      });

      if (isAPISuccess(status) && data) {
        setIsLoading(false);

        if (data.payment_required) {
          return {
            ...data,
            is_successful_order: true,
            payment_order_type: orderType.PASS,
            payment_order_id: data.pass_order_id,
          };
        } else {
          // if (isGift) {
          //   saveGiftOrderData({
          //     ...data,
          //     order_type: orderType.PASS,
          //   });
          //   showGiftMessageModal();
          // } else {
          //   showPurchasePassSuccessModal(data.pass_order_id);
          // }

          showPurchasePassSuccessModal(data.pass_order_id);
          return {
            ...data,
            is_successful_order: false,
          };
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        showAlreadyBookedModal(productType.PASS);
      } else if (!isUnapprovedUserError(error.response)) {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }

    return {
      is_successful_order: false,
    };
  };

  const showConfirmPaymentPopup = () => {
    if (!selectedPassDetails) {
      showErrorModal('Something went wrong', 'Invalid Pass Selected');
      return;
    }

    const desc = `${selectedPassDetails?.limited ? selectedPassDetails.class_count : 'Unlimited'} Credits, Valid for ${
      selectedPassDetails.validity
    } days`;

    const paymentPopupData = {
      // isGiftPurchase: purchaseAsGift,
      productId: selectedPassDetails.external_id,
      productType: productType.PASS,
      itemList: [
        {
          name: selectedPassDetails.name,
          description: desc,
          currency: selectedPassDetails.currency,
          price: selectedPassDetails.total_price,
        },
      ],
    };

    // showPaymentPopup(paymentPopupData, (couponCode) => createOrder(couponCode, purchaseAsGift));
    showPaymentPopup(paymentPopupData, createOrder);
    // setPurchaseAsGift(false);
  };

  //#endregion End of purchase logic

  //#region Start of helper functions

  const handleSelectPassItem = (targetPass) => {
    setIsLoading(true);
    setSelectedPassDetails(targetPass);
    setTimeout(() => setIsLoading(false), 750);
  };

  const handleBuyPassClicked = () => {
    if (!selectedPassDetails) {
      showErrorModal('Invalid pass selected');
      return;
    }

    // setPurchaseAsGift(false);
    setAuthModalVisible(true);
  };

  // const handleBuyAsGiftClicked = () => {
  //   if (!selectedPassDetails) {
  //     showErrorModal('Invalid pass selected');
  //     return;
  //   }

  //   setPurchaseAsGift(true);
  //   setAuthModalVisible(true);
  // };

  const handleSeeMoreSessions = () => {
    setMoreView('sessions');
    setBottomSheetsVisible(true);
  };

  const handleSeeMoreVideos = () => {
    setMoreView('videos');
    setBottomSheetsVisible(true);
  };

  const handleSeeMoreAvailabilities = () => {
    setMoreView('availabilities');
    setBottomSheetsVisible(true);
  };

  const handleCloseBottomSheets = () => {
    setBottomSheetsVisible(false);
  };

  const handleMobileTopStickyClicked = () => {
    window.scroll({ top: 0, behavior: 'smooth' });
  };

  const closeAuthModal = () => {
    setAuthModalVisible(false);
  };

  const showMoreCreatorBio = () => {
    setShouldExpandCreatorBio(true);
  };

  //#endregion End of helper functions

  //#region Start of render functions

  const renderPassPrice = (passData) =>
    passData?.total_price > 0 ? `${passData?.currency?.toUpperCase()} ${passData?.total_price}` : 'Free';
  const renderPassCredits = (passData) => (passData?.limited ? `${passData?.class_count} Credits` : 'Unlimited');
  const renderPassValidity = (passData) =>
    `${passData?.validity ?? 1} day${passData?.validity > 1 ? 's' : ''} validity`;

  const renderCreatorExternalLinks = () => {
    if (!creatorProfile || !creatorProfile.profile || !creatorProfile.profile.social_media_links) {
      return null;
    }

    const creatorSocialMediaLinks = Object.entries(creatorProfile.profile.social_media_links).filter(
      ([socialMedia, link]) => link
    );

    if (creatorSocialMediaLinks.length <= 0) {
      return null;
    }

    return (
      <Col xs={24}>
        <Row gutter={[8, 8]} className={styles.creatorSocialMediaLinksContainer}>
          <Col>
            <Text className={styles.followMeText}> Follow me on </Text>
          </Col>
          <Col>
            <Space>
              {creatorSocialMediaLinks.map(([socialMedia, link]) => {
                const IconElement = socialMediaIcons[socialMedia];

                return (
                  <a key={socialMedia} href={getExternalLink(link)} target="_blank" rel="noopener noreferrer">
                    <IconElement />
                  </a>
                );
              })}
            </Space>
          </Col>
        </Row>
      </Col>
    );
  };

  const renderBuyablePassItem = (passData) => (
    <Col xs={24} key={passData.external_id}>
      <div
        onClick={() => handleSelectPassItem(passData)}
        className={classNames(
          styles.buyablePassItem,
          passData?.external_id === selectedPassDetails?.external_id ? styles.selected : undefined
        )}
      >
        <Row gutter={[8, 8]} align="end">
          <Col xs={24} lg={12} className={styles.passCheckContainer}>
            <Space align="center">
              <CheckCircleFilled className={styles.checkIcon} />
              <Text
                className={classNames(styles.passItemName, passData?.name.length > 20 ? styles.longText : undefined)}
              >
                {passData?.name}
              </Text>
            </Space>
          </Col>
          <Col xs={24} lg={12} className={styles.passItemDetailsContainer}>
            <Space align="center" split={<Divider type="vertical" className={styles.buyDetailsDivider} />}>
              <Text className={styles.buyDetails}>{renderPassCredits(passData)}</Text>
              <Text className={styles.buyDetails}>{renderPassPrice(passData)}</Text>
            </Space>
          </Col>
        </Row>
      </div>
    </Col>
  );

  //#endregion End of render functions

  //#region Start of UI Components

  const passDetailInfo = (
    <div className={styles.currentPassDetailsContainer}>
      <Row gutter={[8, 12]} align="middle">
        <Col xs={24}>
          <Row align="middle">
            <Col flex="1 1 auto">
              <Title level={3} className={styles.passName}>
                {selectedPassDetails?.name}
              </Title>
            </Col>
            <Col flex="0 0 120px">
              <Text className={styles.passDetailValidity}>{renderPassValidity(selectedPassDetails)}</Text>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Space
            size="large"
            align="center"
            className={styles.textAlignCenter}
            split={<Text className={styles.dotSeparator}>●</Text>}
          >
            {selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL').length > 0 && (
              <Text className={styles.passDetailItem}>
                <BookFilled className={styles.passDetailItemIcon} />{' '}
                {selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL').length ?? 0} Sessions
              </Text>
            )}
            {selectedPassDetails?.videos?.length > 0 && (
              <Text className={styles.passDetailItem}>
                <PlayCircleFilled className={styles.passDetailItemIcon} /> {selectedPassDetails?.videos?.length ?? 0}{' '}
                Videos
              </Text>
            )}
            {selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY').length > 0 && (
              <Text className={styles.passDetailItem}>
                <CalendarFilled className={styles.passDetailItemIcon} />{' '}
                {selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY').length ?? 0}{' '}
                Availabilities
              </Text>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );

  const sessionItemLimit = 3;

  const passSessionList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Sessions purchasable with this pass
      </Title>
      <Row gutter={[8, 8]} className={styles.passContentContainer}>
        {selectedPassDetails?.sessions
          ?.filter((session) => session.type === 'NORMAL')
          .slice(0, sessionItemLimit)
          .map((session) => (
            <Col xs={18} sm={14} md={10} lg={12} key={session.session_external_id}>
              <SessionListCard session={session} />
            </Col>
          ))}
        {selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL').length > sessionItemLimit ? (
          <Col xs={18} sm={14} md={10} lg={12} className={styles.fadedItemContainer}>
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleSeeMoreSessions}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <SessionListCard
                session={
                  selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL')[sessionItemLimit]
                }
              />
            </div>
          </Col>
        ) : null}
      </Row>
    </>
  );

  const moreSessionsListView =
    selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL').length > 0 ? (
      <Row gutter={[16, 16]}>
        {selectedPassDetails?.sessions
          ?.filter((session) => session.type === 'NORMAL')
          .map((session) => (
            <Col xs={24} md={12} lg={8} xl={6} key={`more_${session.session_external_id}`}>
              <SessionListCard session={session} />
            </Col>
          ))}
      </Row>
    ) : (
      <Empty description="No sessions to show" />
    );

  const availabilityItemLimit = 3;

  const passAvailabilityList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Availabilities purchasable with this pass
      </Title>
      <Row gutter={[8, 8]} className={styles.passContentContainer}>
        {selectedPassDetails?.sessions
          ?.filter((session) => session.type === 'AVAILABILITY')
          .slice(0, availabilityItemLimit)
          .map((session) => (
            <Col xs={18} sm={14} md={10} lg={12} key={session.session_external_id}>
              <AvailabilityListItem availability={session} />
            </Col>
          ))}
        {selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY').length >
        availabilityItemLimit ? (
          <Col xs={18} sm={14} md={10} lg={12} className={styles.fadedItemContainer}>
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleSeeMoreAvailabilities}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <AvailabilityListItem
                availability={
                  selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY')[
                    availabilityItemLimit
                  ]
                }
              />
            </div>
          </Col>
        ) : null}
      </Row>
    </>
  );

  const moreAvailabilitiesListView =
    selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY').length > 0 ? (
      <Row gutter={[16, 16]}>
        {selectedPassDetails?.sessions
          ?.filter((session) => session.type === 'AVAILABILITY')
          .map((session) => (
            <Col xs={24} md={12} lg={8} xl={6} key={`more_${session.session_external_id}`}>
              <AvailabilityListItem availability={session} />
            </Col>
          ))}
      </Row>
    ) : (
      <Empty description="No availabilities to show" />
    );

  const videoItemLimit = 5;

  const passVideoList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Videos purchasable with this pass
      </Title>
      <Row gutter={[8, 8]} className={styles.passContentContainer}>
        {selectedPassDetails?.videos?.slice(0, videoItemLimit).map((video) => (
          <Col xs={16} sm={14} md={10} lg={12} key={video.external_id}>
            <VideoListCard video={video} />
          </Col>
        ))}
        {selectedPassDetails?.videos?.length > videoItemLimit ? (
          <Col xs={16} sm={14} md={10} lg={12} className={styles.fadedItemContainer}>
            <div className={styles.fadedOverlay}>
              <div className={styles.seeMoreButton} onClick={handleSeeMoreVideos}>
                <BarsOutlined className={styles.seeMoreIcon} />
                SEE MORE
              </div>
            </div>
            <div className={styles.fadedItem}>
              <VideoListCard video={selectedPassDetails?.videos[videoItemLimit]} />
            </div>
          </Col>
        ) : null}
      </Row>
    </>
  );

  const moreVideosListView =
    selectedPassDetails?.videos?.length > 0 ? (
      <Row gutter={[16, 16]}>
        {selectedPassDetails?.videos?.map((video) => (
          <Col xs={24} md={12} lg={8} xl={6} key={`more_${video.external_id}`}>
            <VideoListCard video={video} />
          </Col>
        ))}
      </Row>
    ) : (
      <Empty description="No videos to show" />
    );

  const creatorProfileSection = (
    <div className={styles.bottomOffset}>
      <Row gutter={[8, 20]} className={styles.creatorProfileSection}>
        <Col xs={24}>
          <Space size={32}>
            <Avatar size={72} src={creatorProfile?.profile_image_url} className={styles.creatorProfileImage} />
            <div className={styles.creatorInfoContainer}>
              <Title level={5} className={styles.creatorName}>
                {creatorProfile?.first_name} {creatorProfile?.last_name}
              </Title>
              <Text className={styles.joinTimeText}> Joined on {toMonthYear(creatorProfile?.signup_date)} </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} className={styles.creatorBio}>
          {shouldExpandCreatorBio ? (
            <div className={styles.bio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
          ) : (
            <>
              <div className={styles.collapsedBio}>{ReactHtmlParser(creatorProfile?.profile?.bio)}</div>
              <div className={styles.readMoreBio} onClick={showMoreCreatorBio}>
                READ MORE <CaretDownOutlined />
              </div>
            </>
          )}
        </Col>
        {renderCreatorExternalLinks()}
      </Row>
    </div>
  );

  const buySection = (
    <div className={styles.buySection}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24}>
          <Title level={5} className={styles.buySectionHeader}>
            Buy Credit Pass
          </Title>
        </Col>
        {isLoading && !initialPassDetails ? (
          <Col xs={24}>
            <Spin spinning={true} size="large">
              <div className={styles.loadingPlaceholder} />
            </Spin>
          </Col>
        ) : initialPassDetails ? (
          renderBuyablePassItem(initialPassDetails)
        ) : null}
        {otherPassesLoading ? (
          <>
            <Col xs={24}>
              <Title level={5} className={styles.morePassSectionHeader}>
                More pass options
              </Title>
            </Col>
            <Col xs={24}>
              <Spin spinning={true} size="large">
                <div className={styles.loadingPlaceholderLarge} />
              </Spin>
            </Col>
          </>
        ) : creatorPasses.length > 0 ? (
          <>
            <Col xs={24}>
              <Title level={5} className={styles.morePassSectionHeader}>
                More pass options
              </Title>
            </Col>
            {creatorPasses
              .filter((pass) => pass.external_id !== initialPassDetails?.external_id)
              .sort((a, b) => b.total_price - a.total_price)
              .slice(0, !lg ? 2 : 5)
              .map(renderBuyablePassItem)}
          </>
        ) : null}
        <Col xs={0} lg={24}>
          <Row gutter={[8, 8]} justify="center" wrap={true}>
            <Col>
              <Button size="large" type="primary" className={styles.buyPassButton} onClick={handleBuyPassClicked}>
                <Text
                  className={
                    isBrightColorShade(convertHexToRGB(creatorProfileColor || '#1890ff'))
                      ? styles.darkText
                      : styles.whiteText
                  }
                >
                  {selectedPassDetails?.total_price > 0
                    ? `Proceed to Pay ${renderPassPrice(selectedPassDetails)}`
                    : 'Get Pass'}
                </Text>
              </Button>
            </Col>
            {/* <Col>
              <Button size="large" type="primary" className={styles.greenBtn} onClick={handleBuyAsGiftClicked}>
                Buy as gift
              </Button>
            </Col> */}
          </Row>
        </Col>
      </Row>
    </div>
  );

  const mobileTopSticky = (
    <div className={styles.mobileStickyTopContainer}>
      <Affix offsetTop={72}>
        <Row className={styles.mobileStickyTop} onClick={handleMobileTopStickyClicked}>
          <Col xs={22}>
            <Row align="center">
              <Col xs={24}>
                <Text className={styles.stickyTopPassName}>{selectedPassDetails?.name}</Text>
              </Col>
              <Col xs={24}>
                <Space align="center" split={<Text className={styles.dotSeparator}>●</Text>}>
                  <Text className={styles.stickyTopDetails}>{renderPassCredits(selectedPassDetails)}</Text>
                  <Text className={styles.stickyTopDetails}>{renderPassValidity(selectedPassDetails)}</Text>
                </Space>
              </Col>
            </Row>
          </Col>
          <Col xs={2} className={styles.textAlignRight}>
            <CaretDownOutlined className={styles.dropdownIcon} />
          </Col>
        </Row>
      </Affix>
    </div>
  );

  //#endregion End of UI Components

  return (
    <>
      <div className={styles.passDetailsPageContainer}>
        <AuthModal
          visible={authModalVisible}
          closeModal={closeAuthModal}
          onLoggedInCallback={showConfirmPaymentPopup}
        />
        <Row gutter={[20, 20]} className={styles.passDetailsPage}>
          {/* Details Section */}
          <Col xs={{ order: 2, span: 24 }} lg={{ order: 1, span: 14 }}>
            <Spin spinning={isLoading} size="large">
              <Row gutter={[12, 12]}>
                {/* Pass Details */}
                <Col xs={24}>
                  <div className={styles.highlightContainer}>
                    {passDetailInfo}
                    {mobileTopSticky}
                  </div>
                </Col>
                {/* Session Lists */}
                {selectedPassDetails?.sessions?.filter((session) => session.type === 'NORMAL').length > 0 && (
                  <>
                    <Col xs={24}>
                      <Divider />
                    </Col>
                    <Col xs={24}>{passSessionList}</Col>
                  </>
                )}
                {/* Availability Lists */}
                {selectedPassDetails?.sessions?.filter((session) => session.type === 'AVAILABILITY').length > 0 && (
                  <>
                    <Col xs={24}>
                      <Divider />
                    </Col>
                    <Col xs={24}>{passAvailabilityList}</Col>
                  </>
                )}
                {/* Video Lists */}
                {selectedPassDetails?.videos?.length > 0 && (
                  <>
                    <Col xs={24}>
                      <Divider />
                    </Col>
                    <Col xs={24}>{passVideoList}</Col>
                  </>
                )}
                {/* Creator Section */}
                {creatorProfile && (
                  <>
                    <Col xs={24}>
                      <Divider />
                    </Col>
                    <Col xs={24}>{creatorProfileSection}</Col>
                  </>
                )}
              </Row>
            </Spin>
          </Col>
          {/* Buy Section */}
          <Col xs={{ order: 1, span: 24 }} lg={{ order: 1, span: 10 }}>
            {buySection}
          </Col>
        </Row>
        <Drawer
          visible={bottomSheetsVisible}
          placement="bottom"
          height={560}
          bodyStyle={{ padding: 10 }}
          title={
            <Text className={styles.bottomSheetsTitle}>
              {`${moreView[0].toUpperCase()}${moreView.slice(1)} included in this pass`}
            </Text>
          }
          headerStyle={generateCardHeadingStyle()}
          onClose={handleCloseBottomSheets}
          className={styles.moreContentDrawer}
        >
          {moreView === 'sessions'
            ? moreSessionsListView
            : moreView === 'videos'
            ? moreVideosListView
            : moreAvailabilitiesListView}
        </Drawer>
      </div>
      <div className={styles.mobileBuyButtonContainer}>
        <div className={styles.mobileBuyButton}>
          <Row gutter={[8, 12]} align="middle">
            <Col xs={10} md={10}>
              <Title
                level={5}
                className={classNames(
                  styles.stickyPassName,
                  selectedPassDetails?.name.length > 20 ? styles.longText : undefined
                )}
              >
                {selectedPassDetails?.name}
              </Title>
            </Col>
            <Col xs={0} md={8} className={styles.textAlignRight}>
              <Space
                align="center"
                className={styles.stickyPassDetails}
                split={<Text className={styles.dotSeparator}>●</Text>}
              >
                <Text className={styles.passDetailItem}>{renderPassCredits(selectedPassDetails)}</Text>
                <Text className={styles.passDetailItem}>{renderPassValidity(selectedPassDetails)}</Text>
              </Space>
            </Col>
            <Col xs={14} md={6} className={styles.textAlignRight}>
              <Space size={2}>
                {/* <Button type="primary" className={styles.greenBtn} onClick={handleBuyAsGiftClicked}>
                  Gift
                </Button> */}
                <Button onClick={handleBuyPassClicked} type="primary" className={styles.stickyBuyButton}>
                  <Text
                    className={
                      isBrightColorShade(convertHexToRGB(creatorProfileColor || '#1890ff'))
                        ? styles.darkText
                        : styles.whiteText
                    }
                  >
                    {selectedPassDetails?.total_price > 0
                      ? `Buy for ${renderPassPrice(selectedPassDetails)}`
                      : 'Get for free'}
                  </Text>
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
};

export default PassDetails;
