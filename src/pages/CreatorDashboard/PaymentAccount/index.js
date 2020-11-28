import React, { useState } from 'react'
import { Button, message } from 'antd'
import countryList from 'react-select-country-list'
import { Select } from 'antd'
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const { Option } = Select;

const PaymentAccount = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const countries = countryList().getData();

  const handleChange = (value) => {
    setSelectedCountry(value)
  }

  const openStripeConnect = (url) => {
    window.open(url);
  }

  const relinkStripe = async () => {
    try {
      const { data, status } = await apis.payment.stripe.relinkAccount();
      if (isAPISuccess(status)) {
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  }
  
  const onboardUserToStripe = async () => {
    try {
      const { data, status } = await apis.payment.stripe.onboardUser({ country: selectedCountry });
      if (isAPISuccess(status)) {
        openStripeConnect(data.onboarding_url);
      }
    } catch (error) {
      const { response: { data: { code = 900, message = '' } } } = error;
      if (code === 500 && message === 'user already registered for account, trigger relink') {
        relinkStripe();
      }
    }
  }

  return (
    <div>
      <h1>Payment</h1>

      Select Country:
      <Select
        value={selectedCountry}
        showSearch
        style={{ width: 200 }}
        onChange={handleChange}
        placeholder="Select a person"
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().startsWith(input.toLowerCase())
        }
      >
        {countries.map((country) => <Option value={country.value}>{country.label}</Option>)}
      </Select>

      <Button type="primary" onClick={onboardUserToStripe}>Connect stripe account</Button>
    </div>
  )
}

export default PaymentAccount;