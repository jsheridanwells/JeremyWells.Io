this was started in the last post, but we'll move it here. it works better on its own or with unit tests.

Also, we are not handling scenarios where the OpenWeatherMap API might fail, or a bad configuration, or the user sending a location that does not exist. We will need a better exception handling strategy so that our own API can communicate these problems back to the consumer.


## Exception handling

Our last refactoring task is the most complex but the most important. Right now, if something goes wrong - the API key is invalid, a nonexistent location is sent - our API returns an ugly error message that wouldn't make much sense to a consumer. We need to anticipate problems that could happen with the OpenWeatherMap API and how we would handle them so that other developers or users know what's happening. 

There are several scenarios and strategies for handling them, but for our purposes, we'll anticipate the following problems:

1. __One of our users sends a location that OpenWeatherAPI doesn't recognize:__ I would expect this to happen frequently, and it wouldn't be the result of any fault in the application, so to handle this we'll send back a helpful message to the user without throwing an exception.
1. __The OpenWeatherMap API key is invalid:__ Right now, the application is running on our local machines with an API key configured. When we deploy to other environments, those servers will also need an API key to run. If the application gets deployed without one, or if the API key expires, we'll need to make that clear to any developers if OpenWeatherMap returns an unauthorized response. 
1. __OpenWeatherMap returns its own error:__ Since OpenWeatherMap is a third party, we cannot guarantee that it always functions within our own application as expected. If for some reason, a request to OpenWeatherMap fails, we need to handle that scenario as well.
