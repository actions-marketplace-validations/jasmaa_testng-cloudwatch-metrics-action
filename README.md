# TestNG CloudWatch Metrics Action

Publish TestNG test results to CloudWatch from GitHub Actions.

## Getting started

Add action to your workflow steps after running TestNG tests:

```
...
steps:
  ...
  - name: Run test suites
    run: mvn test
  - name: Publish results to CloudWatch
    if: always()
    uses: jasmaa/testng-cloudwatch-metrics-action@main
```

See example: https://github.com/jasmaa/testng-canary-example