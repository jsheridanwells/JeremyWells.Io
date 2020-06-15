---
layout: post
title: Setting up an N-Tier ASP.NET Core App
subheading: Weather Walking Skeleton Part 1
published: true
description: >-
    'In this post, we take an ASP.NET Core WebApi application from 
    boilerplate code to adding our own functionality.'
tags: 
 - csharp 
 - dotnet 
 - beginners 
 - tutorial
---

![Three Layers of Apples](/assets/img/2020-06-15/splash.jpg){:class="post-splash"}

###### Photo by [Elena Koycheva](https://unsplash.com/@lenneek?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/three-layers?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)


<!-- TODO : add series links at the top, add a next to the previous article -->

## Introduction

This is article #1 in a series of tutorials that walks through building and hosting an Angular and ASP.NET Core web application. The application will have extremely minimal functionality - a [Walking Skeleton]() - but it can serve as a template for building out functionality in more useful projects.  

In the [previous article](), I gave a more detailed overview of this series and walked through preparing a development environment for .NET Core. I also created and explained the default boilerplate code that comes from creating an ASP.NET Core WebApi application. For a little more background, I suggest reading through [that article]() first before stepping through this tutorial. 

## Prerequisites

For this tutorial, I'll assume you'll aren't yet familiar with ASP.NET Core, but you have the .NET Core SDK and an IDE or text editor set up and ready to go, If not, [the previous article]() will go through that step. If this is your first time building a server-side application, or if you're familiar with a comparable framework like Rails or Django but haven't tried one from the .NET Core family, then hopefully this article will clearly introduce you to the process with this framework. I won't go into the syntax of the C# language (for that, I recommend [Microsoft's introduction]()), but I'll explain the steps of building our application in detail.

## N-Tier architecture

A common design pattern for web applications is called the [N-Tier Pattern](), where `n` is the number of layers of the application. [Wikipedia describes one N-Tier scenario](https://en.wikipedia.org/wiki/Multitier_architecture) as a presentation tier, a logic tier, and a data tier:

![Three-tier application diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Overview_of_a_three-tier_application_vectorVersion.svg/512px-Overview_of_a_three-tier_application_vectorVersion.svg.png){:class="post-image"}

###### Source: [Wikipedia](https://en.wikipedia.org/wiki/Multitier_architecture)

An important feature of this pattern is that a lower layer is not aware of any higher layers and changes to a higher layer do not affect lower layers. This pattern can present itself as simply a separation between client-side code, a service layer that contains the business logic, and a data-access layer for interfacing with a database. And this [Microsoft Azure article](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier#:~:text=An%20N%2Dtier%20architecture%20divides,layer%20has%20a%20specific%20responsibility.&text=A%20traditional%20three%2Dtier%20application,tier%2C%20and%20a%20database%20tier.) describes a much more scaled version of this pattern that separates the tiers into a number of physical processes:

![Example N-Tier architecture diagram](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/images/n-tier-physical.png){:class="post-image"}

###### Source: [Microsoft](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier#:~:text=An%20N%2Dtier%20architecture%20divides,layer%20has%20a%20specific%20responsibility.&text=A%20traditional%20three%2Dtier%20application,tier%2C%20and%20a%20database%20tier.)

In our very simple application, the presentation layer will be an Angular client that we'll build in a subsequent article. Our controller will represent a web tier and in this tutorial, we'll build and secure a service as a business-logic tier that will call an external API. 

__The result will be an API endpoint that returns the next 5 temperatures in a forecast by location.__

Here are the steps to get there:
1. Sign up for and retrieve an API key to use the [OpenWeatherMap]() service.
1. Secure the API key so it can be used in our application.
1. Build a service that handles requests to the OpenWeatherMap API.
1. Modify the controller to work with the service, then test it in [Postman]().
1. Handle exceptions from the API.

Going through these steps will demonstrate how ASP.NET Core uses [dependency injection](), protects sensitive values such as API keys and database connection strings, and how it handles exceptions. 

The starting point for this code can be found at [this repo](). Using Git, you can clone the repo locally using:

```bash
$ git clone -b 0_GettingStarted --single-branch git@github.com:jsheridanwells/WeatherWalkingSkeleton.git
```

Then restore the project:
```bash
$ dotnet restore
```

## Getting the OpenWeatherMap API key

Instead of returning random objects in the boilerplate code, we'll return values from a live API. The [OpenWeatherMap API](https://openweathermap.org/api) is an easy way to incorporate third-party data when testing out a project. You'll need to create an account, then get an API key to be able to make requests from their service.

1. Go to [https://OpenWeatherMap.org/api](https://openweathermap.org/api) and click __"Sign in"__. Create an account if you haven't and log in.
1. If you are at [home.openweathermap.org](https://home.openweathermap.org), at the top of the page is a nav item called __"API keys"__. Click that you'll arrive [here](https://home.openweathermap.org/api_keys).
1. Click the __"Generate"__ button. Name the key and save it. 
1. The table will now list your API key. We'll copy this in the next step so that's available in our application. 

At this point, we can test out the OpenWeatherMap API to get an idea of the data structure it returns. [Postman]() is a great tool for this. You can download it [from here]() if you don't have it yet. 

We'll test out the [5-day Weather Forecast](https://openweathermap.org/forecast5) endpoint. There are a variety of ways to query this resource: We'll query it by city name.

According to [the documentation](https://openweathermap.org/forecast5), the structure for the url is 
```
api.openweathermap.org/data/2.5/forecast?q={city name}&appid={your api key}
```

We'll set that up in Postman by entering the url up to the resource name (`forecast`), then entering a city name and our api key in the query parameters table below. 

![Postman Table]()

If everything is set up correctly, your response will be an array of 40 temperature objects for whatever city was selected. We'll keep Postman open so we can use the URL that was formed when we create a service in our web API to make this request.

## Securing our API key

Although I'm having a hard time imagining what mischief could be made with my OpenWeatherMap API key, it's still a best practice to store the actual value seperately from the source code. In a real project, there will be all kinds of secret keys, passwords, and database connections strings - and these values would change moving the application between environments - so here we'll save the API key in our file system, then bring it into our application configuration. 

To accomplish this, we'll:
1. Create a class to help inject our key in the places where we need it.
1. Save our key to the file system using the `dotnet` cli.
1. Bring our key into the configuration schema in our project's `Startup.cs` class.

First, we'll create a [POCO]() class called `OpenWeatherMap` and give it one property: `ApiKey`:
```bash
$ mkdir Models
$ touch Models/OpenWeather.cs
```

(Note: if you're using Visual Studio, you can create this file using the __Solution Explorer__)

Add these contents to `OpenWeather.cs`:
```csharp
public class OpenWeather
{
    public string ApiKey { get; set; }
}
```

When the `dotnet` CLI saves secrets for a project, it's in a directory structured as follows:
```bash
$ ~/.microsoft/usersecrets/<USER-SECRETS-ID>/secrets.json
```

The `USER-SECRETS-ID` is saved in the .csproj file at the root of the project. Any string will work as a user secrets ID, but for this project we'll use a [GUID](): `65988f0a-26ed-44ef-8749-f86a2f5c18a9` (you can also generate your own GUID if you prefer).

Open `WeatherWalkingSkeleton.csproj` and add the UserSecretID:
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
    <UserSecretsId>65988f0a-26ed-44ef-8749-f86a2f5c18a9</UserSecretsId>
  </PropertyGroup>
</Project>
```

Next, run the following command, replacing `YOUR-API-KEY` with the API key you generated when signing up for the OpenWeatherMap service:
```bash
$ dotnet user-secrets set "OpenWeather:ApiKey" "YOUR-API-KEY"
```

If you're successful, you should see output like this:
```bash
Successfully saved OpenWeather:ApiKey = YOUR-API-KEY to the secret store.
```

Now that the key value is stored in our `usersecrets/` directory, we need to bring it into the application. This is done in the `Startup` class by calling a method from the `Configuration` object, then adding it to the application's service collection:
```csharp

``
