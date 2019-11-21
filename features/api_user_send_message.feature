@api @v1 @sendMessage
Feature: As a developer
  I should be able to push message to user when request is proper
  Connections should be stored within redis cache, nor within memory

  @sendMessage @failure
  Scenario: Push notification for user failure when request has no valid body
    When send post request to "http://127.0.0.1:3000/api/dummyId/push", with authorization and data
    """
    {}
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @sendMessage @failure
  Scenario: Push notification for user failure when request has invalid body
    When send post request to "http://127.0.0.1:3000/api/dummyId/push", with authorization and data
    """
    {
      "someKey": "someValue"
    }
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @sendMessage @success
  Scenario: Push notification for user success when request has valid body
    When send post request to "http://127.0.0.1:3000/api/dummyId/push", with authorization and data
    """
    {
      "message": "some message"
    }
    """
    Then response should be empty

  @sendMessage @success @doubleCheck
  Scenario: Push notification for user success when request has valid body and I send it again
    When send post request to "http://127.0.0.1:3000/api/dummyId/push", with authorization and data
    """
    {
      "message": "some other message"
    }
    """
    Then response should be empty
