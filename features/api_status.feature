@api @v1
Feature: As a developer
  I should be able to call api about its status

  @statusInfo
  Scenario: Get server status info
    When send get request to "http://127.0.0.1:3000/api/status/info", the data is
    """
    {
    "name":"notification-server",
    "version":"1.0.0"
    }
    """

  @ping
  Scenario: Get pong from ping
    When send get request to "http://127.0.0.1:3000/api/status/ping", the raw response is "pong"