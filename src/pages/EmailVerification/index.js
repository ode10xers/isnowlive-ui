import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Row, message } from 'antd';
import { useTranslation } from 'react-i18next';

import Routes from 'routes';
import apis from 'apis';
import Loader from 'components/Loader';
import { isAPISuccess } from 'utils/helper';

export default function EmailVerification() {
  const { t: translate } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const token = location.pathname.replace('/email/verify/', '');
  const [isLoading, setIsLoading] = useState(false);

  const verifyUserEmail = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status } = await apis.user.verifyEmail({ token });
      if (isAPISuccess(status)) {
        history.push(Routes.createPassword, { token });
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  }, [token, history]);

  useEffect(() => {
    if (token) {
      verifyUserEmail();
    }
  }, [token, verifyUserEmail]);

  return (
    <Row justify="center" align="center">
      <Loader loading={isLoading} size="large" text={translate('VERIFYING_EMAIL')} />
    </Row>
  );
}
