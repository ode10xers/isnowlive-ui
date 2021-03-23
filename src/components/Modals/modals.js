import React from 'react'; //Needed for JSX
import { Modal, Typography, Button, Row, Col } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import { generateUrl, productType, generateUrlFromUsername } from 'utils/helper';
import { i18n } from 'utils/i18n';

import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './style.modules.scss';
import AddToCalendarButton from 'components/AddToCalendarButton';

const { Text, Paragraph } = Typography;

export const showErrorModal = (title, message = '') => {
  Modal.error({
    title: title || i18n.t('SOMETHING_WRONG_HAPPENED'),
    content: message,
  });
};

export const showSuccessModal = (title, message = '') => {
  Modal.success({
    title: title || i18n.t('SUCCESS'),
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
    title: i18n.t('SET_NEW_PASSWORD'),
    content: (
      <>
        <Paragraph>
          {i18n.t('SET_NEW_PASSWORD_MODAL_TEXT_1')} <Text strong>{email}</Text>.
        </Paragraph>
        <Paragraph type="danger">
          {i18n.t('SET_NEW_PASSWORD_MODAL_TEXT_2')}{' '}
          <Text type="danger" strong>
            {' '}
            friends@passion.do{' '}
          </Text>{' '}
          {i18n.t('SET_NEW_PASSWORD_MODAL_TEXT_3')}
        </Paragraph>
        <Paragraph>
          <Button className={styles.linkButton} type="link" onClick={() => sendNewPasswordEmail(email)}>
            {i18n.t('SET_NEW_PASSWORD_MODAL_TEXT_4')}
          </Button>
        </Paragraph>
      </>
    ),
    okText: i18n.t('OKAY'),
    cancelText: i18n.t('TALK_TO_US'),
    onCancel: () => openFreshChatWidget(),
  });
};

//TODO: Refactor this to be usable for other product types OR split it for each product
export const showBookingSuccessModal = (
  userEmail,
  userPass = null,
  isContinuedFlow = false,
  userDidPayment = false,
  targetDomainName,
  orderDetails = null
) => {
  let redirectDomainName = targetDomainName;
  if (!redirectDomainName) {
    redirectDomainName = window.location.hostname.split('.')[0] || 'app';
  }

  Modal.success({
    width: 480,
    closable: true,
    maskClosable: false,
    title: i18n.t('REGISTRATION_SUCCESSFUL'),
    content: (
      <>
        {isContinuedFlow ? (
          userDidPayment ? (
            //* Purchase Pass & Immediately Book Class
            <>
              <Paragraph>
                {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_1')}{' '}
                <Text strong> {userPass?.name || userPass?.pass_name} </Text>
              </Paragraph>
              <Paragraph>
                {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_2')}{' '}
                <Text strong> {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_3')} </Text>
                {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_4')}
              </Paragraph>
              <Paragraph>
                {i18n.t('CONFIRMATION_EMAIL_TEXT_1')} <Text strong> {userEmail} </Text>.{' '}
                {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
                <Text strong> friends@passion.do. </Text>
              </Paragraph>
              <Paragraph> {i18n.t('BOOKING_IN_ONE_PLACE')} </Paragraph>
            </>
          ) : (
            //* Book class from previously purchased Pass
            <>
              <Paragraph>
                {i18n.t('BOOK_CLASS_USING_PASS_TEXT_1')}
                <Text strong> {userPass?.name || userPass?.pass_name}. </Text>
              </Paragraph>
              <Paragraph>
                {i18n.t('CONFIRMATION_EMAIL_TEXT_1')} <Text strong> {userEmail} </Text>.{' '}
                {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
                <Text strong> friends@passion.do. </Text>
              </Paragraph>
              <Paragraph> {i18n.t('BOOKING_IN_ONE_PLACE')} </Paragraph>
            </>
          )
        ) : userPass ? (
          //* Purchase Individual Pass without Booking Class
          <>
            <Paragraph>
              {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_1')}{' '}
              <Text strong> {userPass?.name || userPass?.pass_name} </Text>
            </Paragraph>
            <Paragraph> {i18n.t('PURCHASES_IN_ONE_PLACE_TEXT')} </Paragraph>
          </>
        ) : (
          //* Book Class without Pass
          <>
            <Paragraph>
              {i18n.t('BOOK_WITHOUT_PASS_TEXT_1')} <Text strong> {userEmail} </Text>.{' '}
              {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
              <Text strong> friends@passion.do. </Text>
            </Paragraph>
            <Paragraph>{i18n.t('BOOKING_IN_ONE_PLACE')}</Paragraph>
          </>
        )}
        <div classname={styles.mt20}>
          <Row justify="end" gutter={10}>
            {(isContinuedFlow || !userPass) && orderDetails && (
              <Col>
                <div>
                  <AddToCalendarButton
                    type="button"
                    eventData={{
                      ...orderDetails,
                      page_url: `${generateUrlFromUsername(
                        orderDetails?.username || orderDetails?.creator_username || redirectDomainName
                      )}/e/${orderDetails.inventory_id}`,
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
                  (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath)
                }
              >
                {i18n.t('GO_TO_DASHBOARD')}
              </Button>
            </Col>
          </Row>
        </div>
      </>
    ),
    okButtonProps: { style: { display: 'none' } },
    okText: i18n.t('GO_TO_DASHBOARD'),
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showAlreadyBookedModal = (prodType = productType.PRODUCT, targetDomainName) => {
  let titleText = i18n.t('DEFAULT_PRODUCT_ALREADY_PURCHASED_TITLE');
  let contentText = i18n.t('DEFAULT_PRODUCT_ALREADY_PURCHASED_CONTENT');

  switch (prodType) {
    case productType.CLASS:
      titleText = i18n.t('SESSION_ALREADY_PURCHASED_TITLE');
      contentText = i18n.t('SESSION_ALREADY_PURCHASED_CONTENT');
      break;
    case productType.PASS:
      titleText = i18n.t('PASS_ALREADY_PURCHASED_TITLE');
      contentText = i18n.t('PASS_ALREADY_PURCHASED_CONTENT');
      break;
    case productType.VIDEO:
      titleText = i18n.t('VIDEO_ALREADY_PURCHASED_TITLE');
      contentText = i18n.t('VIDEO_ALREADY_PURCHASED_CONTENT');
      break;
    default:
      titleText = i18n.t('DEFAULT_PRODUCT_ALREADY_PURCHASED_TITLE');
      contentText = i18n.t('DEFAULT_PRODUCT_ALREADY_PURCHASED_CONTENT');
      break;
  }

  let redirectDomainName = targetDomainName;

  if (!redirectDomainName) {
    redirectDomainName = window.location.hostname.split('.')[0] || 'app';
  }

  Modal.warning({
    center: true,
    closable: true,
    maskClosable: false,
    title: titleText,
    content: (
      <Paragraph>
        {i18n.t('PRODUCT_PURCHASED_TEXT_1')} <Text strong> {contentText} </Text>, {i18n.t('PRODUCT_PURCHASED_TEXT_2')}
      </Paragraph>
    ),
    okText: i18n.t('GO_TO_DASHBOARD'),
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showVideoPurchaseSuccessModal = (
  userEmail,
  video,
  userPass = null,
  isContinuedFlow = false,
  userDidPayment = false,
  targetDomainName
) => {
  let title = 'Video Purchased';
  let modalContent = (
    <>
      <Paragraph>
        {i18n.t('PURCHASE_VIDEO_TEXT_1')} <Text strong> {video?.title} </Text>
      </Paragraph>
      <Paragraph>
        {i18n.t('BOOK_WITHOUT_PASS_TEXT_1')} <Text strong> {userEmail} </Text>. {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
        <Text strong> friends@passion.do. </Text>
      </Paragraph>
      <Paragraph> {i18n.t('PURCHASES_IN_ONE_PLACE_TEXT')} </Paragraph>
    </>
  );

  if (isContinuedFlow) {
    title = i18n.t('PURCHASE_VIDEO_USING_PASS_TITLE');

    if (userDidPayment) {
      modalContent = (
        <>
          <Paragraph>
            {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_1')}{' '}
            <Text strong> {userPass?.name || userPass?.pass_name} </Text>
          </Paragraph>
          <Paragraph>
            {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_2')}{' '}
            <Text strong> {i18n.t('PURCHASE_PASS_AND_BOOK_CLASS_TEXT_3')} </Text>
            {i18n.t('TO_BUY')} <Text strong> {video?.title} </Text> {i18n.t('VIDEO_FOR_YOU')}
          </Paragraph>
          <Paragraph>
            {i18n.t('CONFIRMATION_EMAIL_TEXT_1')} <Text strong> {userEmail} </Text>.{' '}
            {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
            <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph> {i18n.t('PURCHASES_IN_ONE_PLACE_TEXT')} </Paragraph>
        </>
      );
    } else {
      modalContent = (
        <>
          <Paragraph>
            {i18n.t('BUY_VIDEO_USING_PASS_TEXT_1')} <Text strong> {video?.title} </Text>{' '}
            {i18n.t('BUY_VIDEO_USING_PASS_TEXT_2')}
            <Text strong> {userPass?.name || userPass?.pass_name}. </Text>
          </Paragraph>
          <Paragraph>
            {i18n.t('CONFIRMATION_EMAIL_TEXT_1')} <Text strong> {userEmail} </Text>.{' '}
            {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}
            <Text strong> friends@passion.do. </Text>
          </Paragraph>
          <Paragraph> {i18n.t('PURCHASES_IN_ONE_PLACE_TEXT')} </Paragraph>
        </>
      );
    }
  }

  let redirectDomainName = targetDomainName;

  if (!redirectDomainName) {
    redirectDomainName = window.location.hostname.split('.')[0] || 'app';
  }

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: title,
    content: modalContent,
    okText: i18n.t('GO_TO_DASHBOARD'),
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};

export const showCourseBookingSuccessModal = (userEmail, targetDomainName) => {
  let title = i18n.t('COURSE_BOOKED_MODAL_TITLE');
  let modalContent = (
    <>
      <Paragraph>
        {i18n.t('CONFIRMATION_EMAIL_TEXT_1')} <Text strong> {userEmail} </Text>. {i18n.t('CONFIRMATION_EMAIL_TEXT_2')}{' '}
        <Text strong> friends@passion.do. </Text>
      </Paragraph>
      <Paragraph>{i18n.t('BOOKING_IN_ONE_PLACE')}</Paragraph>
    </>
  );

  let redirectDomainName = targetDomainName;

  if (!redirectDomainName) {
    redirectDomainName = window.location.hostname.split('.')[0] || 'app';
  }

  Modal.success({
    center: true,
    closable: true,
    maskClosable: false,
    title: title,
    content: modalContent,
    okText: i18n.t('GO_TO_DASHBOARD'),
    onOk: () => (window.location.href = generateUrl(redirectDomainName) + Routes.attendeeDashboard.rootPath),
  });
};
