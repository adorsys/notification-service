# Sample Clustering Design

We assume notification server runs in another data center environment.

Visibility between application server and notification is intercepted by load balancers which might also act as ssl endpoint.

All external connection are ssl encrypted.

Following diagram displays a sample layout of a clustered environment.

![Component diagram](http://www.plantuml.com/plantuml/proxy?src=https://raw.githubusercontent.com/adorsys/notification-service/master/doc/requirements/clustering.puml&fmt=svg&vvv=1&sanitize=true)  

