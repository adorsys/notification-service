@api @v1 @integrationTest
Feature: As a developer
  I should be able to work with two instances of notification service
  Connections should be stored within redis cache, nor within memory

  @integrationTest @success
  Scenario: Register second user with same connectionId success when request has valid query
    When send put request to "http://app-testing:3000/api/dummyIdSecond/register?connectionId=id", with authorization and data
    """
    {}
    """
    Then response should be empty

  @integrationTest @success
  Scenario: Push notification for user success when request has valid body
    When send post request to "http://app-testing:3000/api/dummyId/push", with authorization and data
    """
    {
      "message": "some message"
    }
    """
    Then response should be empty

  @integrationTest @success
  Scenario: Push notification for second user (created on first app) success when request has valid body
    When send post request to "http://app:3000/api/dummyIdSecond/push", with authorization and data
    """
    {
      "message": "some message"
    }
    """
    Then response should be empty

  @integrationTest @success @doubleCheck
  Scenario: Push notification for user success when request has valid body and I send it again
    When send post request to "http://app-testing:3000/api/dummyId/push", with authorization and data
    """
    {
      "message": "some other message"
    }
    """
    Then response should be empty