---
layout: post
title: Mocking a backend in a client-side project
subheading: With a few simple tools, you can make a fake API server for building a client-side project
published: true
description: With a few simple tools, you can make a fake API server for building a client-side project
tags: 
 - webdev 
 - productivity 
 - beginners 
 - apis
 - tutorial
---

![Server](/assets/img/mockApi/splash.jpg){:class="post-splash"}

###### Photo by [Lars Kienle](https://unsplash.com/@larskienle?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/mock-data?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

<span>Photo by <a href="https://unsplash.com/@larskienle?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Lars Kienle</a> on <a href="https://unsplash.com/s/photos/mock-data?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>
## Introduction 

In this post I'd like to demonstrate two simple tools that you can use to simulate fetching data from an API that can greatly faciliate frontend web development. This can be helpful for focusing on UI development without worry about the server-side implementation of the project. It can also be helpful for setting up a proof-of-concept without having to worrying about protecting real data, or for setting up consistent fake data for end-to-end testing. The two tools I'll demonstrate are [Mockaroo](https://www.mockaroo.com/) for generating sets of dummy data, and [json-server](https://github.com/typicode/json-server) for creating a fake API that a front-end application can make requests to.

## Prerequisites
This tutorial is aimed squarely at folks just starting out writing browser-side code with HTML, CSS, and Javascript. That said, these tools can help support more robust front-end projects. If you've got a bit of knowledge of HTML and Javascript and some familiarity with the command line, then you should be able to get the tools in this article to work for you.

Before we start, you'll need the following installed:
 - [Node.js](https://nodejs.org). I'm using version 14 as I write this, but any LTS version should do.
 - Some way of serving static HTML and Javascript files locally. I use [http-server](https://github.com/http-party/http-server#readme) because it's dead simple, but there are several other options. 

To get started, create a tiny web project that'll consist of just an html page and a JSON file that will hold our fake data:
```bash
$ mkdir FileViewer
$ cd FileViewer
$ touch index.html db.json
```

We'll paste in a little bit of code at the end of this tutorial to get it all working.

## Step one: Data modeling
I'm imagining a web application that allows users to upload files, then it shows a list of all the files that have been saved. 
For this very simple example, we'll create a mock backend for an API that lists all of the file metadata (e.g., file name, file type, date created) after uploading. 

Before generating mock data, we need to get some idea of what our data will look like, what properties each object will have when it's returned from the API. We'll need to know the properties we want and what primitive Javascript type they'll be. Our file metadata can look something  like this:
```
id: number
fileName: string
fileType: string
createdDate: Date
email: string
active: boolean
```

An example json object with those properties might look like:
```json
{
    "id": 30,
    "fileName": "Latest Report",
    "fileType": ".pdf",
    "createdDate": "2020-11-18T01:36:46Z",
    "email": "kuni@garu.com",
    "active": true
}
```

## Step two: Generate mock data with Mockaroo
Now that we have an idea of what our data looks like, we can use [Mockaroo](https://www.mockaroo.com/), a browser-based tool that can generate thousands of realistic looking records for us. Mockaroo has a variety of subscription-based utilities for creating mock APIs, but for this demonstration we'll use it for basic mock data generation which we can do for free. 

The first part of Mockaroo is a form for adding properties to our mock data objects. Play around with the different data types that they offer and you'll see it can generate random data for a wide range of situations. Many of the data types have settings to further customize what gets generated. You can customize the behavior further by passing values through your own functions. Below, I'll create settings for each of the properties in our file metadata object, but feel free to add and change anything you find that's interesting. The rest of this tutorial will still work.

__id:__ For this field, I selected the __Row Number__ data type which will number all of the records in order. This will help with fetching individual records from our fake API further on in this article. 

__fileName and email:__ For these two properties, Mockaroo can generate realistic random values by searching for and selecting the __File Name__ and __Email__ types respectively.

__createdDate and active:__ For the `createdDate`, I can use Mockaroo's __Datetime__ type and set it to return an ISO date which Javascript can parse, and I've set it to return dates from the past year. For the `active` (which indicates if our file has been deleted or not), I can return a boolean.

__fileType:__ For file types, I'd like my application to only allow Microsoft Word, Excel, and PDF files to be used, so in Mocakroo, I'll use a custom function to populate those values. Mockaroo allows us to write functions in Ruby to allow values to be transformed before returning. I'm going to click the __`fx`__ button for the `fileType` row and add the following:
```ruby
['.docx', '.xlsx', '.pdf'].sample
```

This will randomly select one item from that array and return it. 

Now that my data objects are defined, I'll select __# Rows: 100__ and __Format: JSON__ from the bottom of the form. I'll also select __array__ and deselect __include null values__. This is what my Mockaroo form looks like now:

__IMG__

I'll click the __Preview__ button to make sure my objects look like what I expect, then click __Download Data__ to save it as a JSON file.

## Serving the mock data with json-server
Now that we have some data, let's create a fake server that we can fetch it from. 

[json-server](https://github.com/typicode/json-server) is a very light Node.js tool that can allow a frontend developer to define some API endpoints and sets of data that can be returned to a client application. This way, the mock data is completely separate from the client-side code and it can be switched out once the project is ready for a real API.

First, install the json-server npm package globally:
```bash
$ npm install -g json-server
```

Create a file at the root of the `FileViewer` directory that you created above that will hold all of the json data:
```bash
$ touch db.json
```

Just to make sure it works, paste the following into `db.json`:
```json
{
  "posts": [
    { "id": 1, "title": "json-server", "author": "typicode" }
  ],
  "comments": [
    { "id": 1, "body": "some comment", "postId": 1 }
  ],
  "profile": { "name": "typicode" }
}
```

This comes directly from the [json-server documentation](https://github.com/typicode/json-server#readme). 

Run the json server with this command:
```bash
$ json-server --watch db.json
```

In a browser, paste in `http://localhost:3000/posts/1` and it should return the first object in the `posts` array in our json file:
```json
{ "id": 1, "title": "json-server", "author": "typicode" }
```

Now that we know the server is working, stop the server (`CTRL+`). 

Open `db.json` again and clear the contents. We'll define an endpoint for our mock data called `files`:
```json
{
    "files": []
}
```

Open the JSON file that was downloaded from Mockaroo (it should be called `MOCK_DATA.json`). Copy all of the contents. Replace the empty `"files"` array with these contents so it looks something like this:
```javascript
{
    "files": [
        {"id":1,"fileName":"nulla.xls","fileType":".xlsx","createdDate":"2020-02-27T05:10:27Z","email":"hweiner0@wikimedia.org","active":true},
        {"id":2,"fileName":"sapien urna.png","fileType":".xlsx","createdDate":"2020-12-20T05:12:00Z","email":"creding1@google.com.br","active":false},
        {"id":3,"fileName":"vel augue.ppt","fileType":".docx","createdDate":"2020-10-03T05:06:18Z","email":"ccrust2@theguardian.com","active":true},
        {"id":4,"fileName":"mauris morbi non.txt","fileType":".docx","createdDate":"2020-04-26T13:44:41Z","email":"nfolbig3@livejournal.com","active":true},
        {"id":5,"fileName":"sapien sapien non.ppt","fileType":".pdf","createdDate":"2020-04-16T17:56:06Z","email":"cdesimoni4@uol.com.br","active":true},

        // ...

    ]
}
```

Run json-server again and request the `/files` endpoint: `http://localhost:3000/files`. It should load all 100 of the fake records that Mockaroo generated. Add an id number at the end of the url (`http://localhost:3000/files/42`) and you should see the one record with that id.

Finally, we can make an AJAX request from inside of our (tiny) web application to make sure it can connect with our front end code.

Open the `index.html` file that was created earlier and paste the following:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>File Viewer</title>
    <link href="css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <h1>File Viewer</h1>
    
    <script>
        fetch('http://localhost:3000/files')
          .then(response => response.json())
          .then(data => console.log('Data from our mock backend: ', data));
    </script>
  </body>
</html>
```

Open a separate terminal window and `cd` into the `FileViewer` project created above. Start an HTTP server from this location (if you installed [http-server](https://github.com/http-party/http-server#readme), the command is just `$ http-server --open`). 

In a browser, navigate to the http-server url (it would be `http://localhost:8080` by default) and open a dev tools console. The page should have printed the mock data to the console.

## Conclusion

In this tutorial, we walked through a very basic way to define data for a web application, generate hundreds of realistic records, then serve them from a mock API that can be consumed by the application. This is only a very bare minimum implementation of these steps. I highly advise going through the [Mockaroo](https://www.mockaroo.com/) and [json-server](https://github.com/http-party/http-server#readme) documentation for a wide variety of uses and configurations that can suit your frontend development needs even more closely.