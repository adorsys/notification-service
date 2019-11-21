@api @v1 @accessDenied
Feature: As an api a user
  I must be authenticated

  @accessDenied @xAuthToken
  Scenario: Unauthenticated post call to api/:userId/push
    When send post request to "http://127.0.0.1:3000/api/:userId/push", access should be forbidden

  @accessDenied @xAuthToken
  Scenario: Unauthenticated put call to /api/:userId/register
    When send put request to "http://127.0.0.1:3000/api/:userId/register", access should be forbidden