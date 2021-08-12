import React, { useState, useEffect, useCallback } from 'react';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';

import { Row, Col, Typography, Space, Avatar, Divider, Spin, Button, message } from 'antd';
import {
  GlobalOutlined,
  FacebookFilled,
  InstagramFilled,
  LinkedinFilled,
  TwitterOutlined,
  CaretDownOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';

import apis from 'apis';

import AuthModal from 'components/AuthModal';
import SessionListCard from 'components/DynamicProfileComponents/SessionsProfileComponent/SessionListCard';
import VideoListCard from 'components/DynamicProfileComponents/VideosProfileComponent/VideoListCard';
import { showErrorModal, showPurchasePassSuccessModal, showAlreadyBookedModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { getExternalLink } from 'utils/url';
import {
  isAPISuccess,
  reservedDomainName,
  getUsernameFromUrl,
  orderType,
  productType,
  isUnapprovedUserError,
} from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

// TODO: Move these later to a separate file/constants be used everywhere it is needed
// TODO: Use a better version of these icons according to the design
const socialMediaIcons = {
  website: <GlobalOutlined />,
  facebook_link: <FacebookFilled />,
  twitter_link: <TwitterOutlined />,
  instagram_link: <InstagramFilled />,
  linkedin_link: <LinkedinFilled />,
};

const {
  formatDate: { toMonthYear },
} = dateUtil;

const { Title, Text } = Typography;

const PassDetails = ({ match, history }) => {
  const { showPaymentPopup } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(true);

  const [otherPassesLoading, setOtherPassesLoading] = useState(true);
  const [creatorPasses, setCreatorPasses] = useState([]);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [initialPassDetails, setInitialPassDetails] = useState(null);
  const [selectedPassDetails, setSelectedPassDetails] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const [shouldExpandCreatorBio, setShouldExpandCreatorBio] = useState(false);

  //#region Start of API Call Methods

  const fetchCreatorProfileDetails = useCallback(async (creatorUsername) => {
    try {
      const { status, data } = creatorUsername
        ? await apis.user.getProfileByUsername(creatorUsername)
        : await apis.user.getProfile();

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
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

  //#endregion End of Use Effects

  //#region Start of purchase logic

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
          showPurchasePassSuccessModal(data.pass_order_id);

          return {
            ...data,
            is_successful_order: true,
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

    const desc = `${selectedPassDetails.class_count} Credits, Valid for ${selectedPassDetails.validity} days`;

    const paymentPopupData = {
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

    showPaymentPopup(paymentPopupData, createOrder);
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

    setAuthModalVisible(true);
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
  const renderPassCredits = (passData) => `${passData?.class_count} Credits`;
  const renderPassValidity = (passData) => `Valid ${passData?.validity} day${passData?.validity > 1 ? 's' : ''}`;

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
              {creatorSocialMediaLinks.map(([socialMedia, link]) => (
                <a href={getExternalLink(link)} target="_blank" rel="noopener noreferrer">
                  {socialMediaIcons[socialMedia]}
                </a>
              ))}
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
          <Col xs={24} md={12} className={styles.passCheckContainer}>
            <Space align="center">
              <CheckCircleFilled className={styles.checkIcon} />
              <Text className={styles.passItemName}> {passData?.name} </Text>
            </Space>
          </Col>
          <Col xs={24} md={12} className={styles.passItemDetailsContainer}>
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
    <Row gutter={[8, 12]}>
      <Col xs={24}>
        <Title level={3} className={styles.passName}>
          {selectedPassDetails?.name}
        </Title>
      </Col>
      <Col xs={24}>
        <Space size="large" split={<Text className={styles.dotSeparator}>●</Text>}>
          <Text className={styles.passDetailItem}> {renderPassPrice(selectedPassDetails)} </Text>
          <Text className={styles.passDetailItem}> {renderPassCredits(selectedPassDetails)} </Text>
          <Text className={styles.passDetailItem}> {renderPassValidity(selectedPassDetails)} </Text>
        </Space>
      </Col>
    </Row>
  );

  const passSessionList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Sessions purchasable with this pass
      </Title>
      <Row gutter={[8, 8]}>
        {selectedPassDetails?.sessions?.slice(0, 5).map((session) => (
          <Col xs={24} md={12}>
            <SessionListCard session={session} />
          </Col>
        ))}
      </Row>
    </>
  );

  const passVideoList = (
    <>
      <Title level={4} className={styles.sectionHeading}>
        Videos purchasable with this pass
      </Title>
      <Row gutter={[8, 8]}>
        {selectedPassDetails?.videos?.slice(0, 5).map((video) => (
          <Col xs={24} md={12}>
            <VideoListCard video={video} />
          </Col>
        ))}
      </Row>
    </>
  );

  const creatorProfileSection = (
    <Row gutter={[8, 20]} className={styles.creatorProfileSection}>
      <Col xs={24}>
        <Space size={32}>
          <Avatar size={72} src={creatorProfile?.profile_image_url} className={styles.creatorProfileImage} />
          <div className={styles.creatorInfoContainer}>
            <Title level={5} className={styles.creatorName}>
              {' '}
              {creatorProfile?.first_name} {creatorProfile?.last_name}{' '}
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
  );

  // TODO: Might have to do dynamic font adjustment here
  const buySection = (
    <div className={styles.buySection}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24}>
          <Title level={5} className={styles.buySectionHeader}>
            Buy Credit Pass
          </Title>
        </Col>
        {initialPassDetails && renderBuyablePassItem(initialPassDetails)}
        {otherPassesLoading ? (
          <>
            <Col xs={24}>
              <Title level={5} className={styles.morePassSectionHeader}>
                Save More
              </Title>
            </Col>
            <Col xs={24}>
              <Spin spinning={true} size="large" />
            </Col>
          </>
        ) : creatorPasses.length > 0 ? (
          <>
            <Col xs={24}>
              <Title level={5} className={styles.morePassSectionHeader}>
                Save More
              </Title>
            </Col>
            {creatorPasses
              .filter((pass) => pass.external_id !== initialPassDetails?.external_id)
              .slice(0, 3)
              .map(renderBuyablePassItem)}
          </>
        ) : null}
        <Col xs={24}>
          <Row justify="center">
            <Col>
              <Button size="large" type="primary" className={styles.buyPassButton} onClick={handleBuyPassClicked}>
                {selectedPassDetails?.total_price > 0
                  ? `Proceed to Pay ${renderPassPrice(selectedPassDetails)}`
                  : 'Get Pass'}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );

  //#endregion End of UI Components

  return (
    <div className={styles.passDetailsPageContainer}>
      <AuthModal visible={authModalVisible} closeModal={closeAuthModal} onLoggedInCallback={showConfirmPaymentPopup} />
      <Row gutter={[20, 20]}>
        {/* Details Section */}
        <Col xs={24} md={14}>
          <Spin spinning={isLoading} size="large">
            <Row gutter={[12, 12]}>
              {/* Pass Details */}
              <Col xs={24}>{passDetailInfo}</Col>
              {/* Session Lists */}
              {selectedPassDetails?.sessions?.length > 0 && (
                <>
                  <Col xs={24}>
                    {' '}
                    <Divider />{' '}
                  </Col>
                  <Col xs={24}>{passSessionList}</Col>
                </>
              )}
              {/* Video Lists */}
              {selectedPassDetails?.videos?.length > 0 && (
                <>
                  <Col xs={24}>
                    {' '}
                    <Divider />{' '}
                  </Col>
                  <Col xs={24}>{passVideoList}</Col>
                </>
              )}
              {/* Creator Section */}
              {creatorProfile && (
                <>
                  <Col xs={24}>
                    {' '}
                    <Divider />{' '}
                  </Col>
                  <Col xs={24}>{creatorProfileSection}</Col>
                </>
              )}
            </Row>
          </Spin>
        </Col>
        {/* Buy Section */}
        <Col xs={24} md={10}>
          {buySection}
        </Col>
      </Row>
    </div>
  );
};

export default PassDetails;
