const validationRules = {
  nameValidation: [{ required: true, message: 'Please input name' }],
  publicUrlValidation: [
    { required: true, message: 'Please input public URL' },
    {
      pattern: new RegExp('^[a-z]*$'),
      message: 'Public URL can only contain lowercase letters',
    },
  ],
  urlValidation: [
    {
      required: true,
      type: 'url',
      message: 'Please input a valid URL',
    },
  ],
  emailValidation: [{ type: 'email', required: true, message: 'Please input your email' }],
  passwordValidation: [{ required: true, message: 'Please input your password' }],
  requiredValidation: [{ required: true, message: 'This field is required.' }],
  arrayValidation: [
    {
      type: 'array',
      required: true,
      message: 'Please select min. one item',
      min: 1,
      // validator: (_, value) => (value.length > 0 ? Promise.resolve() : Promise.reject('Select at least one item')),
    },
  ],
  numberValidation: (message, min = 0, maxLimited = true, max = 10000) => {
    const errorMessage = message || `Please input valid amount (${min} - ${max})`;
    const invalidValue = (value) => value === undefined || value === null || value < min || (maxLimited && value > max);

    return [
      {
        required: true,
        message: errorMessage,
        validator: (_, value) => (invalidValue(value) ? Promise.reject(errorMessage) : Promise.resolve()),
      },
    ];
  },
  discountCodeValidation: [
    {
      required: true,
      message: 'Please input a discount code',
    },
    {
      pattern: new RegExp('^[a-zA-Z0-9]*$'),
      message: 'Discount code should only contain letters or numbers',
    },
  ],
  hexColorValidation: (message = 'Please input a valid hex color code') => {
    const regexTester = new RegExp(/^[0-9A-Fa-f]{6}$/);

    return [
      {
        validator: (_, value) =>
          !value ? Promise.resolve() : regexTester.test(value) ? Promise.resolve() : Promise.reject(message),
      },
    ];
  },
  otherLinksValidation: [
    // Reference for below rule :
    // https://github.com/ant-design/ant-design/issues/14275#issuecomment-678800190
    // https://github.com/yiminghe/async-validator#deep-rules
    {
      type: 'array',
      min: 1,
      message: 'Please add at least one link item',
      defaultField: {
        // required : true,
        message: 'Some fields are missing! Please fill them before publishing',
        type: 'object',
        fields: {
          title: [{ required: true, message: 'This field is required.' }],
          url: [
            {
              required: true,
              type: 'url',
              message: 'Please input a valid URL',
            },
          ],
          textColor: [
            { required: true },
            (message = 'Please input a valid hex color code') => {
              const regexTester = new RegExp(/^[0-9A-Fa-f]{6}$/);

              return {
                validator: (_, value) =>
                  !value ? Promise.resolve() : regexTester.test(value) ? Promise.resolve() : Promise.reject(message),
              };
            },
          ],
          backgroundColor: [
            { required: true },
            (message = 'Please input a valid hex color code') => {
              const regexTester = new RegExp(/^[0-9A-Fa-f]{6}$/);

              return {
                validator: (_, value) =>
                  !value ? Promise.resolve() : regexTester.test(value) ? Promise.resolve() : Promise.reject(message),
              };
            },
          ],
        },
      },
    },
  ],
  courseModulesValidation: [
    {
      type: 'array',
      min: 1,
      message: 'Please add at least one module!',
      required: true,
      // defaultField: {
      //   // message: 'Make sure to add at least 1 content to each module!',
      //   type: 'object',
      //   fields: {
      //     module_content : [
      //       {
      //         type: 'array',
      //         required : true,
      //         min: 1,
      //         message: 'Make sure to add at least 1 content to each module!',
      //       }
      //     ]
      //   }
      // }
    },
  ],
  courseModuleContentValidation: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: 'Please add at least one content!',
    },
  ],
};

export default validationRules;
