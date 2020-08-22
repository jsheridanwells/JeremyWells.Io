---
layout: post
title: Configuration in ASP.NET Core Explained
subheading: How to pass in and move around configuration settings in ASP.NET Core
published: true
description: A quick guide to accessing configuration from different providers in ASP.NET Core as of version 3.
tags: 
 - csharp 
 - dotnet 
 - beginners 
 - apis
---

![Recording Console](/assets/img/aspnetcoreconfig/splash.jpg){:class="post-splash"}

###### Photo by [Alexey Ruban](https://unsplash.com/@intelligenciya?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/recording-console?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText)
A common consideration for working with an ASP.NET Core application is how to store and retrieve values in configuration settings, as well as how to change and update them as the application moves to different environments. It's common to need sensitive values like passwords, API keys, and database connection strings in order to call out to other services, and these settings must be stored separately from the application's source code. To help manage this process, ASP.NET Core contains a set of configuration providers for retrieving and storing values, as well as a class to make complex settings available in the application as strongly-typed objects.

In this tutorial, I'll start with an extremely simple web API to illustrate how and where to access different and the different options available and how to override these settings as the application moves to different environments. We'll start with some boilerplate code, create a class to hold configuration settings, then load those settings from different locations in the file system. Finally, we'll move the application to a Docker container to show how settings can be updated in different environments. 

## Prerequisites

I'll assume you have some familiarity with ASP.NET Core applications, but this article will still stay at a beginner level. To build a copy of the example application and follow on, you will need:

1. Version 3.1 of the .NET Core SDK running on your development machine, [which can be downloaded here](https://dotnet.microsoft.com/download).
1. Docker Desktop running on your local machine. [This is the download page](https://www.docker.com/products/docker-desktop). The version I'm using as of this writing is 19.03.8.k
1. To follow along with the examples, I've created a Github repo with a __before__ and __after__ branch. The following command will clone the repo:
```bash
$ git clone <URL>.git
```
To checkout the __before__ and __after__ branches, run:
 
 `$ git checkout before` 
 
 and `$ git checkout after` respectively.
 
 Lastly, I tend to prefer writing .NET Core tutorials as OS-agnostically as possible, so I'll be using the command line with __Bash__ for most of the steps, rather than Visual Studio. If you are using an IDE like Visual Studio or the Windows command line, there may be some differences from what you'll see here.
 
 

