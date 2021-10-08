import React from 'react';

import { Row, Col, Typography, Space, Button, Divider } from 'antd';
import { CaretRightOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';

import { redirectToPassesPage } from 'utils/redirect';
import { convertHexToHSL, formatHSLStyleString } from 'utils/colors';

import styles from './style.module.scss';

const { Text } = Typography;

const SelectablePassItem = ({
  pass = null,
  showExtra = false,
  onSelect = null,
  onDeselect = null,
  onDetails = null,
  isSelected = false,
}) => {
  const handleSelectClicked = (pass) => {
    if (onSelect) {
      onSelect(pass);
    } else {
      console.log(pass);
    }
  };

  const handleDeselectClicked = (pass) => {
    if (onDeselect) {
      onDeselect(pass);
    } else {
      console.log(pass);
    }
  };

  const handleDetailsClicked = (pass) => {
    if (onDetails) {
      onDetails(pass);
    } else {
      redirectToPassesPage(pass);
    }
  };

  const [h, s, l] = convertHexToHSL(pass?.color_code ?? '#1890ff');

  const colorObj = {
    '--primary-color': formatHSLStyleString(h, s, l),
    '--primary-light-color': formatHSLStyleString(h, s, l + 45),
    '--primary-dark-color': formatHSLStyleString(h, s, l - 20),
  };

  return (
    <div className={styles.selectablePassItem} style={colorObj}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Row gutter={[8, 8]} wrap={false}>
            <Col flex="1 1 auto">
              <Text className={styles.passName}>{pass?.name}</Text>
            </Col>
            <Col flex="0 0 90px" className={styles.textAlignRight}>
              {pass?.total_price > 0 ? (
                <>
                  <Text className={styles.passCurrency}>{pass?.currency?.toUpperCase() ?? ''} </Text>
                  <Text className={styles.passPrice}>{pass?.total_price ?? 0}</Text>
                </>
              ) : (
                <Text className={styles.passPrice}>Free</Text>
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Space
            align="center"
            className={styles.passDetailsContainer}
            split={<Divider type="vertical" className={styles.passDetailsDivider} />}
          >
            <Text className={styles.passDetailsItem}>{pass?.class_count ?? 0} Credits</Text>
            <Text className={styles.passDetailsItem}>{pass?.validity ?? 0} Days Validity</Text>
          </Space>
        </Col>
        {showExtra && (
          <>
            <Col xs={24} className={styles.extraDividerContainer}>
              <Divider className={styles.extraDivider} />
            </Col>
            <Col xs={24} className={styles.extraButtonsContainer}>
              <Row gutter={[8, 8]} wrap="false">
                <Col xs={12}>
                  {isSelected ? (
                    <Button
                      size="small"
                      type="text"
                      className={styles.selectedBtn}
                      icon={<CheckOutlined />}
                      onClick={() => handleDeselectClicked(pass)}
                    >
                      Selected
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="text"
                      className={styles.extraBtn}
                      icon={<PlusOutlined />}
                      onClick={() => handleSelectClicked(pass)}
                    >
                      Select
                    </Button>
                  )}
                </Col>
                <Col xs={12} className={styles.textAlignRight}>
                  <Button
                    size="small"
                    type="text"
                    className={styles.extraBtn}
                    onClick={() => handleDetailsClicked(pass)}
                  >
                    Details <CaretRightOutlined />
                  </Button>
                </Col>
              </Row>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default SelectablePassItem;
