---
layout: post
title: TDD and Exception Handling with xUnit in ASP.NET Core
subheading: Weather Walking Skeleton Part 4
series: '.NET Core and Angular Walking Skeleton'
published: true
description: We continue building out an ASP.NET Core web API by adding tests with xUnit and using those to guide implementing exception handling
tags: 
 - csharp 
 - dotnet 
 - beginners 
 - tutorial
 - testing
---

![Electronic circuits](/assets/img/wws4/splash.jpg){:class="post-splash"}

###### Photo by [Nicolas Thomas](https://unsplash.com/@nicolasthomas?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/test?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText)

## Introduction and prerequisites

In this post, we're continuing our "walking skeleton" application where we build and deploy a minimal application with an ASP.NET Core WebApi and an Angular client. At this stage, the API is almost ready. We've got a controller that accepts a city location, a service that calls the third-party [OpenWeatherMap](https://openweathermap.org/api) API to return a set of five hourly forecasts for the location, and in the last post we added the xUnit testing framework to describe the API. If you would like to start from the beginning, [this is the first post](){:class="no-target"}. 

The goal of this series, and this application, is to create a bare-bones, testable, and deploy-able web application that can be used as a reference for starting other projects with these technologies. In each of these steps, I intend to describe the code we add in detail.

If you're starting the tutorial from this post, you can clone the following branch and continue modifying the code from there (note that you will need the [.NET Core SDK](https://dotnet.microsoft.com/download) installed on your machine):
```bash
$ git clone -b 3_adding-tests --single-branch git@github.com:jsheridanwells/WeatherWalkingSkeleton.git
$ cd WeatherWalkingSkeleton
$ dotnet restore
```

You'll also need to sign up for and register an [OpenWeatherMap API key](https://openweathermap.org/api). [This previous post](https://www.jeremywells.io/2020/06/22/walking-weather-skeleton-01.html){:class="no-target"} contains the steps for doing that.

## Our TDD process

In the previous step, we started with one controller method that called one service method, then we set up a testing library using [xUnit]() and [Moq](). With our testing framework ready to go, we'll use unit tests to guide some improvements to our API endpoint that fetches weather forecasts.

__TDD__ stands for "Test-Driven Development", and it's a technique for ensuring that our code performs according to expectations, documenting the current expectations for code, and using tests to help ensure that changes aren't breaking prior functionality, especially when deploying code to higher environments. I won't discuss here the different types of testing, or the differing opinions on testing, but I've recently found [this article](https://dev.to/jackmarchant/a-practical-guide-to-test-driven-development-485g) which gives an excellent overview of the different software testing strategies and where they can fit into different kinds of projects.

Our test-driven development is going to follow a __Red__, __Green__, __Refactor__ pattern:
1. __Red__: We will write test and ensure that it fails. That way we're sure that our changes are actually bringing about the behavior we want, not some unanticipated side effect.
1. __Green__: We will modify our methods so that the tests pass.
1. __Refactor__: We will do any necessary refactoring to our changes so that the code is up to par, while making sure the test still passes.

## Our changes

Right now, our API consists of endpoint - `GET http://localhost:5000/WeatherForecast/:location` - that terminates at this `WeatherForecastController` and calls the `Get` method. Inside the `Get` method, the `OpenWeatherService.GetFiveDayForecastAsync` method is then called which returns a list of five forecasts for the next fifteen hours.

While manually testing this endpoint with [Postman](https://www.postman.com/), and running our three current unit tests, proves that this indeed happens, our methods are very brittle right now. If an API consumer calls the endpoint without a location, or with a non-existent location, the unexpected result isn't handled. If we deploy the API to another environment without registering the OpenWeatherMap API key, we need to handle that failure as well in a way that communicates the problem to other developers. Also, the OpenWeatherMap API might itself fail and we need to be able to communicate the source of the problem.

Let's refactor the methods to handle the following scenarios:
 
1. __One of our users sends a location that OpenWeatherAPI doesn't recognize:__ I would expect this to happen frequently, and it wouldn't be the result of any fault in the application, so to handle this we'll send back a helpful message to the user without throwing an exception.
1. __The OpenWeatherMap API key is invalid:__ Right now, the application is running on our local machines with an API key configured. When we deploy to other environments, those servers will also need an API key to run. If the application gets deployed without one, or if the API key expires, we'll need to make that clear to any developers if OpenWeatherMap returns an unauthorized response. 
1. __OpenWeatherMap returns its own error:__ Since OpenWeatherMap is a third party, we cannot guarantee that it always functions within our own application as expected. If for some reason, a request to OpenWeatherMap fails, we need to handle that scenario as well.

## Testing the service

We'll modify the `OpenWeatherService` class first. Open the corresponding unit test file: `./WeatherWalkingSkeletonTests/Services_Tests/OpenWeatherService_Tests.cs`. Note, that in the previous post, we also created a static fixture class called `OpenWeatherResponses` that returns three simulated error responses from the OpenWeatherMap API: `NotFoundResponse`, `UnauthorizedResponse`, `InternalErrorResponse`. We'll use these responses to trigger the errors we could get from the third-party API.

In `OpenWeatherService_Tests` add the following test:
```csharp
[Fact]
 public async Task Returns_OpenWeatherException_When_Called_With_Bad_Argument()
 {
     var opts = OptionsBuilder.OpenWeatherConfig();
     var clientFactory = ClientBuilder.OpenWeatherClientFactory(OpenWeatherResponses.NotFoundResponse,
         HttpStatusCode.NotFound);
     var sut = new OpenWeatherService(opts, clientFactory);

     var result = await Assert.ThrowsAsync<OpenWeatherException>(() => sut.GetFiveDayForecastAsync("Westeros"));
     Assert.Equal(404, (int)result.StatusCode);
 }
```

This test follows the basic setup of the previous two tests, but expects a `404` error response from the API. When we call OpenWeatherMap with a nonexistent place, we want our service to throw a custom exception called `OpenWeatherException`. This exception will communicate to the consuming class that the third-party API returned a "Not Found" result. 

If you run the test using your IDE's test runner, or using `$ dotnet test` in the terminal, we see our test fails. We expected our custom exception and instead got a `NullReferenceException` since our service can't yet handle nothing being returned from OpenWeatherMap. 


