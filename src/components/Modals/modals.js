import React from 'react';
import { Modal, Typography, Button, Row, Col } from 'antd';

import apis from 'apis';
import Routes from 'routes';
import AddToCalendarButton from 'components/AddToCalendarButton';

import { getLocalUserDetails } from 'utils/storage';
import { isInIframeWidget, isWidgetUrl } from 'utils/widgets';
import { productType, reservedDomainName } from 'utils/constants';
import { generateUrlFromUsername, getUsernameFromUrl, generateMailToLink } from 'utils/url';
import {
  getUserPassOrderDetails,
  getUserVideoOrderDetails,
  getSessionInventoryDetails,
  getCreatorProfileByUsername,
} from 'utils/orderHelper';

import { getAuthTokenFromLS } from 'services/localAuthToken';
import { getAuthCookie } from 'services/authCookie';

import styles from './style.modules.scss';

const { Text, Paragraph } = Typography;

const getDashboardUrl = (userName, targetPath = Routes.attendeeDashboard.rootPath) => {
  if (!isWidgetUrl() && !isInIframeWidget()) {
    return generateUrlFromUsername(userName) + targetPath;
  } else {
    let completeUrl = generateUrlFromUsername(userName) + targetPath;

    let authCode = null;
    const authCodeFromCookie = getAuthCookie() || getAuthTokenFromLS();
    if (authCodeFromCookie && authCodeFromCookie !== '') {
      authCode = authCodeFromCookie;
    } else {
      const userDetails = getLocalUserDetails();
      authCode = userDetails?.auth_token;
    }

    completeUrl =
      completeUrl +
      // '?isWidget=true&widgetType=dashboard' +
      `${authCode && authCode !== '' ? `?signupAuthToken=${authCode}` : ''}`;

    return completeUrl;
  }
};

// This helper is a workaround to get rid of some scrolling lock
// issue that sometimes happens after closing a modal
export const resetBodyStyle = () => {
  document.body.classList.remove(['ant-scrolling-effect']);
  document.body.style.overflow = '';
};

export const showErrorModal = (title, message = '') => {
  Modal.error({
    title: title || 'Something wrong occurred',
    content: message,
    afterClose: resetBodyStyle,
  });
};

export const showSuccessModal = (title, message = '') => {
  Modal.success({
    title: title || 'Success',
    content: message,
    afterClose: resetBodyStyle,
  });
};

export const showWarningModal = (title, message = '') => {
  Modal.warning({
    title: title || 'Warning',
    content: message,
    afterClose: resetBodyStyle,
  });
};

export const sendNewPasswordEmail = async (email) => await apis.user.sendNewPasswordEmail({ email });

export const showSetNewPasswordModal = (email, openTawkChatWidget) => {
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
    onCancel: () => openTawkChatWidget(),
    afterClose: resetBodyStyle,
  });
};

const generateCustomButtonsForSessionModals = (username, inventoryDetails) => (
  <div className={styles.mt20}>
    <Row justify="end" gutter={[10, 10]}>
      {inventoryDetails && (
        <Col>
          <AddToCalendarButton
            type="button"
            buttonText="Add to Cal"
            eventData={{
              ...inventoryDetails,
              page_url: `${generateUrlFromUsername(username)}/e/${inventoryDetails.inventory_id}`,
            }}
          />
        </Col>
      )}
      <Col>
        <Button
          type="primary"
          block
          onClick={() => {
            const targetUrl = getDashboardUrl(
              username,
              Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
            );
            if (isInIframeWidget() || isWidgetUrl()) {
              window.open(targetUrl, '_blank');
            } else {
              window.location.href = targetUrl;
            }
          }}
        >
          Go to dashboard
        </Button>
      </Col>
    </Row>
  </div>
);

// Currently separating the modal for each case/flow
// Since the contents and required info will be different
export const showPurchasePassSuccessModal = async (passOrderId) => {
  const userPass = await getUserPassOrderDetails(passOrderId);
  const username = getUsernameFromUrl();

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okText: 'Go To Dashboard',
    title: 'Purchase Successful',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>
          You have purchased the pass <Text strong> {userPass?.pass_name || ''} </Text>
        </Paragraph>
        <Paragraph>You can see your Passes in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
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
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
  });
};

export const showPurchaseSubscriptionAndBookSessionSuccessModal = async (inventoryId) => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  const inventoryDetails = await getSessionInventoryDetails(inventoryId);

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    okButtonProps: { style: { display: 'none' } },
    title: 'Registration Successful',
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>You have successfully purchased this membership.</Paragraph>
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
    afterClose: resetBodyStyle,
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
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
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
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
  });
};

export const showPurchasePassAndGetVideoSuccessModal = async (passOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);
  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
  });
};

export const showGetVideoWithPassSuccessModal = async (passOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userPass = await getUserPassOrderDetails(passOrderId);
  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
  });
};

export const showPurchaseSingleVideoSuccessModal = async (videoOrderId) => {
  const userEmail = getLocalUserDetails().email;

  const userVideo = await getUserVideoOrderDetails(videoOrderId);
  const username = getUsernameFromUrl();

  Modal.success({
    width: 400,
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Video Purchased',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
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
    afterClose: resetBodyStyle,
  });
};

export const showPurchaseSingleCourseSuccessModal = () => {
  const userEmail = getLocalUserDetails().email;

  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Course purchased',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showPurchaseSubscriptionSuccessModal = () => {
  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Membership purchased',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.subscriptions
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>You have successfully purchased this membership.</Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showPurchaseSubscriptionAndGetVideoSuccessModal = () => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>You have successfully purchased this membership.</Paragraph>
        <Paragraph>We have also purchased this video for you using 1 credit from this membership</Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showGetVideoWithSubscriptionSuccessModal = () => {
  const userEmail = getLocalUserDetails().email;
  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>We have purchased this video using 1 credit from your membership</Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showBookSessionWithSubscriptionSuccessModal = async (inventoryId) => {
  const username = getUsernameFromUrl();
  const userEmail = getLocalUserDetails().email;

  const inventoryDetails = await getSessionInventoryDetails(inventoryId);

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Registration successful',
    okButtonProps: { style: { display: 'none' } },
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.defaultPath
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>We have booked this session using 1 credit from your membership</Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        {generateCustomButtonsForSessionModals(username, inventoryDetails)}
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

// NOTE : currently unused since we don't support course in subs
export const showGetCourseWithSubscriptionSuccessModal = () => {
  const userEmail = getLocalUserDetails().email;
  const username = getUsernameFromUrl();

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: 'Purchase successful',
    okText: 'Go To Dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    content: (
      <>
        <Paragraph>We have purchased this course using 1 credit from your subscription</Paragraph>
        <Paragraph>
          You would have received a confirmation email on <Text strong> {userEmail}</Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
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

  const username = getUsernameFromUrl();

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
    onOk: () => {
      const targetUrl = getDashboardUrl(username, Routes.attendeeDashboard.rootPath + targetSection);
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
    afterClose: resetBodyStyle,
  });
};

export const showMemberUnapprovedJoinModal = async (openTawkChatWidget) => {
  if (!window.privateSitePopupShown) {
    window.privateSitePopupShown = true;
    const creatorUsername = getUsernameFromUrl();

    if (reservedDomainName.includes(creatorUsername)) {
      showErrorModal('Something went wrong');
    } else {
      const creatorProfileData = await getCreatorProfileByUsername(creatorUsername);

      if (creatorProfileData) {
        Modal.confirm({
          center: true,
          closable: true,
          maskClosable: false,
          title: `Thanks for joining ${creatorProfileData.first_name}'s community`,
          content: (
            <>
              <Paragraph>We are excited to see you join {creatorProfileData.first_name}'s private community.</Paragraph>
              <Paragraph>
                If you haven't spoken to {creatorProfileData.first_name} before joining, you'd need to drop an email on{' '}
                <Text strong copyable>
                  {creatorProfileData.email}
                </Text>{' '}
                to start accessing any of their products.
              </Paragraph>
              <Paragraph>
                For any other help please reach out to us on the blue chat button at the bottom right corner.
              </Paragraph>
            </>
          ),
          okText: `Email ${creatorProfileData.first_name}`,
          cancelText: 'Chat with us',
          onOk: () => window.open(generateMailToLink(creatorProfileData), '_blank'),
          onCancel: () => openTawkChatWidget(),
          afterClose: () => {
            resetBodyStyle();
            window.privateSitePopupShown = false;
          },
        });
      }
    }
  }
};

//NOTE : We are kind of reusing the course flag and calling it another name for availability
export const showCourseOptionsHelperModal = (productName = 'session') => {
  Modal.info({
    centered: true,
    closable: true,
    maskClosable: true,
    title: `Understanding the ${productName === 'availability' ? 'bundle' : 'course'} options`,
    width: 640,
    content: (
      <>
        <Paragraph>
          Marking a {productName} as a Normal {productName} allows your customers to buy this {productName} alone as a
          one off purchase.
        </Paragraph>
        <Paragraph>
          Marking a {productName} as a {productName === 'availability' ? 'Bundled' : 'Course'} {productName} prevents a
          customer from buying this {productName} alone, they can only get it if they buy the{' '}
          {productName === 'availability' ? 'pass' : 'whole course'} you add this {productName} to.
        </Paragraph>
        <Paragraph>If you are in doubt, choose normal for now. You can always change this later.</Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showTagOptionsHelperModal = (productName = 'session') => {
  Modal.info({
    centered: true,
    closable: true,
    maskClosable: true,
    title: 'Understanding the tag options',
    width: 640,
    content: (
      <>
        <Paragraph>Selecting Anyone here will allow any of your customers to book this {productName}</Paragraph>
        <Paragraph>
          Marking this {productName} for “Selected Member Tags” will make it visible and purchasable only by the member
          tags you have added here. You need to create your member tags first to be able to find them here.
        </Paragraph>
      </>
    ),
    afterClose: resetBodyStyle,
  });
};

export const showWaitlistHelperModal = (productName = 'course') => {
  Modal.info({
    centered: true,
    closable: true,
    maskClosable: true,
    title: 'What is wait-list?',
    width: 640,
    content: (
      <>
        <Paragraph>
          The wait-list feature helps you measure the interest of your customers in this {productName}. You will be able
          to see how many people are committed to buying this {productName} under the wait-list.
        </Paragraph>
        <Paragraph>
          Once you've decided that enough people have joined the wait-list, you can open the {productName} registrations
          (and close the wait-list) and the wait-listed users will be notified about this so they can come and purchase
          the {productName}.
        </Paragraph>
        <Paragraph>You cannot re-open the wait-list once you close it</Paragraph>
      </>
    ),
    okText: 'Got it',
  });
};

export const showWaitlistJoinedModal = (productName = 'course') => {
  const username = getUsernameFromUrl();

  Modal.success({
    mask: true,
    centered: true,
    closable: true,
    maskClosable: true,
    title: 'Spot reserved',
    content: (
      <>
        <Paragraph>You have successfully joined the wait-list for this {productName}.</Paragraph>
        <Paragraph>
          We will notify you via email when the creator opens the {productName}, and then you can purchase this{' '}
          {productName}.
        </Paragraph>
      </>
    ),
    okText: 'Go to dashboard',
    onOk: () => {
      const targetUrl = getDashboardUrl(
        username,
        Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage
      );
      if (isInIframeWidget() || isWidgetUrl()) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    },
  });
};
