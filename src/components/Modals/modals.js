import React from 'react'; //Needed for JSX
import { Modal, Typography, Button } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import { generateUrl, productType } from 'utils/helper';

import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './style.modules.scss';

const { Text, Paragraph } = Typography;

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

//TODO: Refactor this to be usable for other product types OR split it for each product
export const showBookingSuccessModal = (
  userEmail,
  userPass = null,
  isContinuedFlow = false,
  userDidPayment = false,
  redirectDomainName = 'app'
) => {
  Modal.success({
    closable: true,
    maskClosable: false,
    title: 'Registration Successful',
    content: isContinuedFlow ? (
      userDidPayment ? (
        //* Purchase Class Pass & Immediately Book Class
        <>
          <Paragraph>
            You have purchased the pass <Text strong> {userPass?.name || userPass?.pass_name} </Text>
          </Paragraph>
          <Paragraph>
            We have <Text strong> used 1 credit </Text>
            to book this class for you.
          </Paragraph>
          <Paragraph>
            You would have received a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email
            from <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        </>
      ) : (
        //* Book class from previously purchased Class Pass
        <>
          <Paragraph>
            We have booked this session using 1 credit from your pass
            <Text strong> {userPass?.name || userPass?.pass_name}. </Text>
          </Paragraph>
          <Paragraph>
            You would have received a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email
            from <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        </>
      )
    ) : userPass ? (
      //* Purchase Individual Class Pass without Booking Class
      <>
        <Paragraph>
          You have purchased the pass <Text strong> {userPass?.name || userPass?.pass_name} </Text>
        </Paragraph>
        <Paragraph>You can see your Passes in 1 place on your dashboard.</Paragraph>
      </>
    ) : (
      //* Book Class without Class Pass
      <>
        <Paragraph>
          We have sent you a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email from
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
      </>
    ),
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showAlreadyBookedModal = (prodType = productType.PRODUCT, redirectDomainName = 'app') => {
  let titleText = 'Product already purchased';
  let contentText = 'purchased this product';

  switch (prodType) {
    case productType.CLASS:
      titleText = 'Session already booked';
      contentText = 'booked this session';
      break;
    case productType.PASS:
      titleText = 'Pass already purchased';
      contentText = 'purchased this pass';
      break;
    case productType.VIDEO:
      titleText = 'Video already purchased';
      contentText = 'purchased this video';
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
        It seems you have already <Text strong> {contentText} </Text>, please check your dashboard
      </Paragraph>
    ),
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showVideoPurchaseSuccessModal = (
  userEmail,
  video,
  userPass = null,
  isContinuedFlow = false,
  userDidPayment = false,
  redirectDomainName = 'app'
) => {
  let title = 'Video Purchased';
  let modalContent = (
    <>
      <Paragraph>
        You have purchased the video <Text strong> {video?.title} </Text>
      </Paragraph>
      <Paragraph>
        We have sent you a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email from
        <Text strong> friends@passion.do. </Text>
      </Paragraph>
      <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
    </>
  );

  if (isContinuedFlow) {
    title = 'Video Purchased using Pass';

    if (userDidPayment) {
      modalContent = (
        <>
          <Paragraph>
            You have purchased the pass <Text strong> {userPass?.name || userPass?.pass_name} </Text>
          </Paragraph>
          <Paragraph>
            We have <Text strong> used 1 credit </Text>
            to buy <Text strong> {video?.title} </Text> video video for you.
          </Paragraph>
          <Paragraph>
            You would have received a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email
            from <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph>You can see all your purchases in 1 place on your dashboard.</Paragraph>
        </>
      );
    } else {
      modalContent = (
        <>
          <Paragraph>
            We have bought <Text strong> {video?.title} </Text> video using 1 credit from your pass
            <Text strong> {userPass?.name || userPass?.pass_name}. </Text>
          </Paragraph>
          <Paragraph>
            You would have received a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email
            from <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
        </>
      );
    }
  }

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: title,
    content: modalContent,
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};
