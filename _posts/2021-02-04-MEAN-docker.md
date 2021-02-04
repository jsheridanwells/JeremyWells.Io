---
layout: post
title: Dockerizing a Mongo database
subheading: Using Docker, we can ensure our database can conveniently grow and change with our application in a local development environment.
published: true
description: Using Docker, we can ensure our database can conveniently grow and change with our application in a local development environment.
tags: 
 - mongo
 - docker 
---

![Vines](/assets/img/docker-mdb/splash.jpg){:class="post-splash"}
###### Photo by [Salomé Guruli](https://unsplash.com/@sguruli?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/vines?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText)


One challenge in local development is constantly changing and reconfiguring a project's local database as an application grows. One way I've found to make changes to the database more flexible is to leverage Docker containers and volumes to quickly set up, run, drop, and rebuild an application database. Likewise, containerizing a database can help
