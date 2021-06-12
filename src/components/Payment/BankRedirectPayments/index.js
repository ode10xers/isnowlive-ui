import React, { useState } from 'react';

import { Row, Col, Tabs } from 'antd';

import { BANK_REDIRECT_OPTIONS, BankRedirectOptionsSelection } from 'components/Payment/PaymentOptionsSelection';
import IDealPayment from 'components/Payment/IDealPayment';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
// NOTE: For the keys used in the TabPane,
// See the options in PaymentOptionsSelection under the
// ONLINE_BANKING key
const BankRedirectPayments = ({ disabled = false, options = [], onBeforePayment, onAfterPayment }) => {
  const [selectedBankRedirectPaymentOption, setSelectedBankRedirectPaymentOption] = useState('ideal');

  const handleCustomTabBarRender = (props, DefaultTabBar) => (
    <Row gutter={[8, 8]} className={styles.mb10}>
      {Array.isArray(props.panes) ? (
        props.panes.map((pane) => (
          <Col xs={12} key={pane.key} onClick={() => setSelectedBankRedirectPaymentOption(pane.key)}>
            {pane.props.tab}
          </Col>
        ))
      ) : (
        <Col xs={12} key={props.panes.key} onClick={() => setSelectedBankRedirectPaymentOption(props.panes.key)}>
          {props.panes.props.tab}
        </Col>
      )}
    </Row>
  );

  return (
    <Row gutter={[8, 8]} className={styles.mb10}>
      <Col xs={24}>
        <Tabs
          className={styles.bankRedirectOptionsContainer}
          activeKey={selectedBankRedirectPaymentOption}
          onChange={setSelectedBankRedirectPaymentOption}
          renderTabBar={handleCustomTabBarRender}
        >
          {options.includes(BANK_REDIRECT_OPTIONS.IDEAL.key) && (
            <TabPane
              forceRender={true}
              key={BANK_REDIRECT_OPTIONS.IDEAL.key}
              tab={
                <BankRedirectOptionsSelection
                  optionKey={BANK_REDIRECT_OPTIONS.IDEAL.key}
                  isActive={selectedBankRedirectPaymentOption === BANK_REDIRECT_OPTIONS.IDEAL.key}
                />
              }
            >
              <IDealPayment disabled={disabled} onBeforePayment={onBeforePayment} onAfterPayment={onAfterPayment} />
            </TabPane>
          )}
        </Tabs>
      </Col>
    </Row>
  );
};

export default BankRedirectPayments;
