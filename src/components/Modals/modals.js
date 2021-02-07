import React from 'react'; //Needed for JSX
import { Modal, Typography, Button } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import { generateUrl } from 'utils/helper';

import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './style.modules.scss';

const { Text, Paragraph } = Typography;

export const showErrorModal = (title, message = '') => {
  Modal.error({
    title: title || 'Something wrong occured',
    message: message,
  });
};

export const showSuccessModal = (title, message = '') => {
  Modal.success({
    title: title || 'Success',
    message: message,
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
            We have <Text strong> used 1 class credit </Text>
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
            We have booked this session using 1 class credit from your pass{' '}
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
        <Paragraph>You can see your Class Passes in 1 place on your dashboard.</Paragraph>
      </>
    ) : (
      //* Book Class without Class Pass
      <>
        <Paragraph>
          We have sent you a confirmation email on <Text strong> {userEmail} </Text>. Look out for an email from{' '}
          <Text strong> friends@passion.do. </Text>
        </Paragraph>
        <Paragraph>You can see all your bookings in 1 place on your dashboard.</Paragraph>
      </>
    ),
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showAlreadyBookedModal = (isPass = false, redirectDomainName = 'app') => {
  Modal.warning({
    center: true,
    closable: true,
    maskClosable: false,
    title: isPass ? 'Pass Already Purchased' : 'Session Already Booked',
    content: (
      <Paragraph>
        It seems you have already <Text strong> {isPass ? 'purchased this Class Pass' : 'booked this Session'} </Text>,
        please check your dashboard{' '}
      </Paragraph>
    ),
    okText: 'Go To Dashboard',
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showVideoPurchaseSuccessModal = (userEmail, video, redirectDomainName) => {
  Modal.success({
    title: 'Video Purchase',
    content: (
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
    ),
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};
