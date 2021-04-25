import React from 'react';
import { Modal, Typography, Button, Row, Col } from 'antd';

import apis from 'apis';
import Routes from 'routes';
import AddToCalendarButton from 'components/AddToCalendarButton';

import { getLocalUserDetails } from 'utils/storage';
import {
  generateUrl,
  productType,
  generateUrlFromUsername,
  getUsernameFromUrl,
  reservedDomainName,
} from 'utils/helper';
import {
  getUserPassOrderDetails,
  getUserVideoOrderDetails,
  getSessionInventoryDetails,
  getCreatorProfileByUsername,
} from 'utils/orderHelper';
import { isWidgetUrl } from 'utils/widgets';

import { openFreshChatWidget } from 'services/integrations/fresh-chat';
import { getAuthCookie } from 'services/authCookie';

import styles from './style.modules.scss';

const { Text, Paragraph } = Typography;

const getDashboardUrl = (userName = null, targetPath = Routes.attendeeDashboard.rootPath) => {
  const usernameValue = userName ? userName : getUsernameFromUrl();

  if (!isWidgetUrl()) {
    return generateUrl(usernameValue) + targetPath;
  } else {
    let completeUrl = generateUrl(usernameValue) + targetPath;

    let authCode = null;
    const authCodeFromCookie = getAuthCookie();
    if (authCodeFromCookie && authCodeFromCookie !== '') {
      authCode = authCodeFromCookie;
    } else {
      const userDetails = getLocalUserDetails();
      authCode = userDetails?.auth_token;
    }

    completeUrl =
      completeUrl +
      '?isWidget=true&widgetType=dashboard' +
      `${authCode && authCode !== '' ? `&authCode=${authCode}` : ''}`;

    return completeUrl;
  }
};

export const showErrorModal = (title, message = '') => {
  Modal.error({
    title: title || 'Something wrong occured',
    content: message,
  });
};

export const showSuccessModal = (title, message = '') => {
  Modal.success({
    title: title || 'Success',
    content: message,
  });
};

export const sendNewPasswordEmail = async (email) => await apis.user.sendNewPasswordEmail({ email });

export const showSetNewPasswordModal = (email) => {
  Modal.confirm({
    mask: true,
    center: true,
    closable: true,
    maskClosable: true,
    title: 'Set a new password',
    content: (
      <>
        <Paragraph>
          We have sent you a link to setup your new password on your email <Text strong>{email}</Text>.
        </Paragraph>
        <Paragraph type="danger">
          If you can't find it, please search for{' '}
          <Text type="danger" strong>
            {' '}
            friends@passion.do{' '}
          </Text>{' '}
          in your email app or in the spam folder.
        </Paragraph>
        <Paragraph>
          <Button className={styles.linkButton} type="link" onClick={() => sendNewPasswordEmail(email)}>
            Didn't get it? Send again.
          </Button>
        </Paragraph>
      </>
    ),
    okText: 'Okay',
    cancelText: 'Talk to us',
    onCancel: () => openFreshChatWidget(),
  });
};

const generateCustomButtonsForSessionModals = (username, inventoryDetails) => (
  <div className={styles.mt20}>
    <Row justify="end" gutter={10}>
      {inventoryDetails && (
        <Col>
          <div>
            <AddToCalendarButton
              type="button"
              buttonText="Add to Cal"
              eventData={{
                ...inventoryDetails,
                page_url: `${generateUrlFromUsername(username)}/e/${inventoryDetails.inventory_id}`,
              }}
            />
          </div>
        </Col>
      )}
      <Col>
        <Button
          type="primary"
          block
          onClick={() =>
            (window.location.href = getDashboardUrl(
              username,
              Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
            ))
          }
        >
          Go To Dashboard
        </Button>
      </Col>
    </Row>
  </div>
);

// Currently separating the modal for each case/flow
// Since the contents and required info will be different
export const showPurchasePassSuccessModal = async (passOrderId) => {
  const userPass = await getUserPassOrderDetails(passOrderId);

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okText: 'Go To Dashboard',
    title: 'Purchase Successful',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        null,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes
      )),
    content: (
      <>
        <Paragraph>
          You have purchased the pass <Text strong> {userPass?.pass_name || ''} </Text>
        </Paragraph>
        <Paragraph>You can see your Passes in 1 place on your dashboard.</Paragraph>
      </>
    ),
  });
};

// For session modals, we want to show the AddToCalendar Button
// For that we will hide the modal buttons and render our custom buttons
export const showPurchasePassAndBookSessionSuccessModal = async (passOrderId, inventoryId) => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);
  const inventoryDetails = await getSessionInventoryDetails(inventoryId);

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okButtonProps: { style: { display: 'none' } },
    title: 'Registration Successful',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      )),
    content: (
      <>
        <Paragraph>
          You have purchased the pass <Text strong> {userPass?.pass_name || ''} </Text>
        </Paragraph>
        <Paragraph>
          We have <Text strong> used 1 credit </Text> to book this class for you.
        </Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        {generateCustomButtonsForSessionModals(username, inventoryDetails)}
      </>
    ),
  });
};

export const showBookSessionWithPassSuccessModal = async (passOrderId, inventoryId) => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);
  const inventoryDetails = await getSessionInventoryDetails(inventoryId);

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okButtonProps: { style: { display: 'none' } },
    title: 'Registration Successful',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      )),
    content: (
      <>
        <Paragraph>
          We have booked this session using 1 credit from your pass
          <Text strong> {userPass?.pass_name || ''}. </Text>
        </Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        {generateCustomButtonsForSessionModals(username, inventoryDetails)}
      </>
    ),
  });
};

export const showBookSingleSessionSuccessModal = async (inventoryId) => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  const inventoryDetails = await getSessionInventoryDetails(inventoryId);

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okButtonProps: { style: { display: 'none' } },
    title: 'Registration Successful',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      )),
    content: (
      <>
        <Paragraph>
          We have sent you a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        {generateCustomButtonsForSessionModals(username, inventoryDetails)}
      </>
    ),
  });
};

export const showPurchasePassAndGetVideoSuccessModal = async (passOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        null,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos
      )),
    content: (
      <>
        <Paragraph>
          You have purchased the pass <Text strong> {userPass?.pass_name || ''} </Text>
        </Paragraph>
        <Paragraph>
          We have <Text strong> used 1 credit </Text>
          to get this video for you.
        </Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
  });
};

export const showGetVideoWithPassSuccessModal = async (passOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        null,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos
      )),
    content: (
      <>
        <Paragraph>
          We have bought this video using 1 credit from your pass
          <Text strong> {userPass?.pass_name || ''}. </Text>
        </Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
      </>
    ),
  });
};

export const showPurchaseSingleVideoSuccessModal = async (videoOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userVideo = await getUserVideoOrderDetails(videoOrderId);

  Modal.success({
    width: 400,
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Video Purchased',
    okText: 'Go To Dashboard',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        null,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos
      )),
    content: (
      <>
        <Paragraph>
          You have purchased the video <Text strong> {userVideo?.title || ''} </Text>
        </Paragraph>
        <Paragraph>
          We have sent you a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
  });
};

export const showCoursePurchaseSuccessModal = () => {
  const userEmail = getLocalUserDetails().email;

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Course purchased',
    okText: 'Go To Dashboard',
    onOk: () =>
      (window.location.href = getDashboardUrl(
        null,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses
      )),
    content: (
      <>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
      </>
    ),
  });
};

export const showAlreadyBookedModal = (prodType = productType.PRODUCT) => {
  let titleText = 'Product already purchased';
  let contentText = 'purchased this product';
  let targetSection = Routes.attendeeDashboard.defaultPath;

  switch (prodType) {
    case productType.CLASS:
      titleText = 'Session already booked';
      contentText = 'booked this session';
      break;
    case productType.PASS:
      titleText = 'Pass already purchased';
      contentText = 'purchased this pass';
      targetSection = Routes.attendeeDashboard.passes;
      break;
    case productType.VIDEO:
      titleText = 'Video already purchased';
      contentText = 'purchased this video';
      targetSection = Routes.attendeeDashboard.videos;
      break;
    default:
      titleText = 'Product already purchased';
      contentText = 'purchased this product';
      break;
  }

  Modal.warning({
    center: true,
    closable: true,
    maskClosable: false,
    title: titleText,
    content: (
      <Paragraph>
        It seems you have already <Text strong> {contentText}</Text>, please check your dashboard.
      </Paragraph>
    ),
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = getDashboardUrl(null, Routes.attendeeDashboard.rootPath + targetSection)),
  });
};

export const showMemberUnapprovedJoinModal = async () => {
  const creatorUsername = getUsernameFromUrl();

  if (reservedDomainName.includes(creatorUsername)) {
    // TODO: Edge case, confirm how to handle with Rahul
    showErrorModal('Your account has not been approved by the creator you first signed up with');
  } else {
    const creatorProfileData = await getCreatorProfileByUsername(creatorUsername);

    if (creatorProfileData) {
      Modal.info({
        center: true,
        closable: true,
        maskClosable: false,
        title: `Thanks for joining ${creatorProfileData.first_name}'s community`,
        content: (
          <>
            <Paragraph>
              Unfortunately, you will need {creatorProfileData.first_name}'s approval before you can book and purchase
              their product and it seems like they have not approved your account.
            </Paragraph>
            <Paragraph>
              You can contact them via email{' '}
              <Text strong copyable>
                ({creatorProfileData.email})
              </Text>{' '}
              to ask them so your account can get approved.
            </Paragraph>
          </>
        ),
      });
    }
  }
};
