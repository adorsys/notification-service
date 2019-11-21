@api @v1 @registerUser
Feature: As a developer
  I should be able to register user when request is proper
  Connections should be stored within redis cache, nor within memory

  @registerUser @failure
  Scenario: Register user failure when request has no valid body
    When send put request to "http://127.0.0.1:3000/api/dummyId/register", with authorization and data
    """
    {}
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @registerUser @failure
  Scenario: Register user failure when request has invalid body
    When send put request to "http://127.0.0.1:3000/api/dummyId/register", with authorization and data
    """
    {
      "someKey": "someValue"
    }
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @registerUser @failure
  Scenario: Register user failure when request has no query
    When send put request to "http://127.0.0.1:3000/api/dummyId/register", with authorization and data
    """
    {
      "userId": "dummyId"
    }
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @registerUser @failure
  Scenario: Register user failure when request has invalid query
    When send put request to "http://127.0.0.1:3000/api/dummyId/register?q=x", with authorization and data
    """
    {}
    """
    Then error should be equal "Response code 400 (Bad Request)"

  @registerUser @success @registerSuccess
  Scenario: Register user success when request has valid query
    When send put request to "http://127.0.0.1:3000/api/dummyId/register?connectionId=id", with authorization and data
    """
    {}
    """
    Then response should be empty

  @registerUser @success @registerSuccess @doubleCheck
  Scenario: Register user success when request has valid query and I send it again
    When send put request to "http://127.0.0.1:3000/api/dummyId/register?connectionId=id", with authorization and data
    """
    {}
    """
    Then response should be empty
