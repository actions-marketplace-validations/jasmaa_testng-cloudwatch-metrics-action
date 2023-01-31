const core = require('@actions/core');
const { run } = require('../src/index');

jest.mock('@actions/core');

const mockPutMetricData = jest.fn(() => {
  return {
    promise: jest.fn(),
  };
});

jest.mock('aws-sdk', () => {
  return {
    CloudWatch: jest.fn(() => {
      return {
        putMetricData: mockPutMetricData,
      };
    }),
    config: {
      update: jest.fn(),
    }
  };
});

describe('Publish TestNG results', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  })

  test.each([
    ['__tests__/basic_noTests'],
    ['__tests__/basic_onePass'],
    ['__tests__/basic_oneFail'],
    ['__tests__/basic_oneSkip'],
    ['__tests__/basic_oneUnknown'],
    ['__tests__/complex_multipleMethods'],
    ['__tests__/complex_multipleClasses'],
    ['__tests__/complex_multipleTests'],
    ['__tests__/complex_real1'],
  ])('test single suite for reports-path=%p', async (reportsPath) => {
    core.getInput = jest.fn().mockImplementation((name) => {
      return {
        'reports-path': reportsPath,
        'namespace': 'TestNG Canary',
      }[name];
    });

    await run();

    expect(mockPutMetricData).toHaveBeenCalledTimes(1);
    expect(mockPutMetricData.mock.calls[0][0]).toMatchSnapshot();
  });

  test('test multiple suites', async () => {
    core.getInput = jest.fn().mockImplementation((name) => {
      return {
        'reports-path': '__tests__/complex_multipleSuites',
        'namespace': 'TestNG Canary',
      }[name];
    });

    await run();

    expect(mockPutMetricData).toHaveBeenCalledTimes(2);
  });
});