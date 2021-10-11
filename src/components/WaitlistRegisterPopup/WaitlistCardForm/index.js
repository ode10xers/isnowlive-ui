import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

import { Row, Col, Button, Spin, Typography, message } from 'antd';

import apis from 'apis';

import { isUnapprovedUserError, isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import { useGlobalContext } from 'services/globalContext';

const { Paragraph } = Typography;

const useOptions = () => {
  const options = useMemo(
    () => ({
      hidePostalCode: true,
      iconStyle: 'solid',
      classes: {
        base: styles.StripeCustomElement,
        invalid: styles.StripeCustomElementInvalid,
        focus: styles.StripeCustomElementFocus,
        complete: styles.StripeCustomElementComplete,
      },
      style: {
        // Our DodgerBlue in colors.scss
        // Also adjusted the font to match our website
        base: {
          iconColor: '#1890ff',
          fontWeight: 400,
          fontSize: '14px',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        },
        // Ant Design's Red danger color
        invalid: {
          iconColor: '#ff4d4f',
          color: '#ff4d4f',
        },
        // Our KellyGreen in colors.scss
        complete: {
          iconColor: '#52c41a',
          color: '#52c41a',
        },
      },
    }),
    []
  );

  return options;
};

const WaitlistCardForm = () => {
  const { hideWaitlistPopup } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStripeComponent, setIsLoadingStripeComponent] = useState(true);

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const [savedUserCards, setSavedUserCards] = useState([]);

  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();

  const productName = 'course';

  const fetchUserCards = useCallback(async () => {
    try {
      const { status, data } = await apis.payment.getUserSavedCards();

      if (isAPISuccess(status) && data) {
        setSavedUserCards(data);
      }
    } catch (error) {
      if (isUnapprovedUserError(error.response)) {
        hideWaitlistPopup();
      } else if (error?.response?.status !== 404) {
        message.error(error?.response?.data?.message || 'Failed fetching previously used payment methods');
      }
    }
  }, [hideWaitlistPopup]);

  useEffect(() => {
    fetchUserCards();
  }, [fetchUserCards]);

  const handleStripeComponentReady = useCallback((element) => {
    setIsLoadingStripeComponent(false);
  }, []);

  const handleJoinWaitlistClicked = () => {
    setIsSubmitting(true);

    setIsSubmitting(false);
  };

  return (
    <Row gutter={[8, 12]}>
      <Col xs={24}>
        <Paragraph>You will be notified via email when the creator opens the {productName}.</Paragraph>
      </Col>
      {savedUserCards?.length > 0 && (
        <Col xs={24}>
          <Spin spinning={isLoadingStripeComponent}>
            <CardElement
              options={options}
              onReady={handleStripeComponentReady}
              onChange={(event) => {
                if (event.complete) {
                  setIsButtonDisabled(false);
                } else {
                  setIsButtonDisabled(true);
                }
              }}
            />
          </Spin>
        </Col>
      )}
      <Col xs={24}>
        <Row justify="center">
          <Col xs={12} lg={8}>
            <Button
              block
              size="large"
              type="primary"
              onClick={handleJoinWaitlistClicked}
              disabled={isButtonDisabled}
              loading={isSubmitting}
            >
              Join Waitlist
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default WaitlistCardForm;
