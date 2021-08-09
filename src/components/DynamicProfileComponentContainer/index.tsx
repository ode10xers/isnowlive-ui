import React, { CSSProperties } from 'react'
import { Col, Row, Typography } from 'antd'

import styles from './style.module.scss';

const { Text } = Typography;

export interface DynamicProfileComponentContainerProps {
  icon?: React.ReactElement | null
  textColor?: CSSProperties['color']
  title?: string
}

const DynamicProfileComponentContainer: React.FC<DynamicProfileComponentContainerProps> = ({
  children,
  icon,
  textColor,
  title,
}) => (
  <>
    <Row className={styles.dynamicProfileComponentContainerTitleRow}>
      <Text
        className={styles.dynamicProfileComponentContainerTitle}
        style={{ color: `var(--passion-profile-darker-color, ${textColor})` }}
      >
        {icon}
        {title}
      </Text>
    </Row>
    <Row>
      <Col span={24}>
        {children}
      </Col>
    </Row>
  </>
)

DynamicProfileComponentContainer.defaultProps = {
  textColor: '#0050B3',
}

export default DynamicProfileComponentContainer
