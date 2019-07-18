# Salesforce Event Log + CDC Viewer _(CDC-Viewer)_

[![Salesforce API v46.0](https://img.shields.io/badge/Salesforce%20API-v46.0-blue.svg)]()
[![Lightning Experience Not Required](https://img.shields.io/badge/Lightning%20Experience-Not%20Required-inactive.svg)]()
[![User License Platform](https://img.shields.io/badge/User%20License-Platform-032e61.svg)]()

> A Salesforce CDC/Platform Event viewer, in SLDS too

This app will give you all you need to see the events being tossed out of your Salesforce org. We're not retaining or storing them, just viewing them in realtime, so it's helpful if testing that events are firing, or if you want to look at the code to see an easy form of consuming them.

For CDC, we're taking in all the CDC by consuming `data/changeEvents` - so any object you enable, it's consuming. For Platform Events, there's a form in there to specify the events you want to subscribe to. It expects an API name, so it should look like `yoEvent__e` or it'll probably yell at you. For EM Realtime Beta, put in the name of the EM log you want to track as if it were a normal Platform Event topic (ex. `UriEventStream`) and it'll get picked up.

## Security and Limitations
So there are two elements to be aware of here when trying this out and trusting my code, especially if you're attaching this to a production system.
* For a sub to consume from CDC's firehose, it requires super high permissions, specifically View All Data. That's a lot of trust. I'm not DOING anything with the data in my direct build (cowie/CDC-Viewer) but if someone forks this and does other stuff with it you're opening up a hell of a pandora's box. We're using OAuth to get the access, so you're not providing the code any form of credentials at least.
* Events are a metered thing in Salesforcia- you have a limit to what you can consume. If you were to flip this on, monitor all the things in a production org, you're going to potentially hit some limits. If you're awesome and already using CDC/PE in your day to day, those integrations may explode. This is a quick tool, don't leave it running please.

## Install

Before ya start - you will need a few prereq's if you don't have them already.
* [Git](https://git-scm.com/downloads)
* [Node.js](https://nodejs.org/en/download/)
* [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

You'll also need to be at least comfy enough with a command line (terminal in mac land) to copy/paste commands.

### Salesforce Setup
Get a Salesforce org, either from developer.salesforce.com, trailhead.com, your own sandbox/scratch org, I don't care - just get an org handy.

Click on *Setup*, and in the quick find bar on the left, type in **App Manager** and click on the link. Click *New Connected App*.

In the dialog, name it whatever you'd like, and make sure you check the box that says *Enable OAuth Settings*. 
* Where it says *Callback URL*, put in the value **http://localhost:3000/auth/sfdc/callback**. 
* Below that, where it says *Selected OAuth Scopes*, just be lazy and select **Full access(full)**. 
* Leave the rest of the values as defaults and click save. Once you're at the detail page for your app - *keep it open*. You will need some of the stuff on here soon.

#### (Optional) Turn on CDC
Open a new tab in Salesforce, and go to *Setup*. In the quickfind box, type in **Change Data Capture**, and click on the *Change Data Capture* link. Here you can select the objects you want to track with CDC. Pick the ones you want, leave the ones you don't, and click to confirm.

#### (Optional) Create a Custom Platform Event
Open a new tab in Salesforce, and go to *Setup*. In the quickfind box, type in **Platform Events**, and click on the *Platform Events* link. Click the button that says *New Platform Event*. Now, making a custom event is very similar to making a custom object, just click through and add the fields you want, and you're good to go. Remember the API name, which ends in `__e`, not `__c`.

### Code Setup
Now for the fun stuff, pull down all the code from this repository to your local system. Type these commands one by one into your command line/terminal.
`git clone https://github.com/cowie/CDC-Viewer.git`

`cd CDC-Viewer`

`npm install`

Now we need to put that connected app information into our app. Thankfully I threw a quick script together to do this easily.

In your command line (in the CDC-Viewer Directory), type this command into your command line/terminal

`sh autoConfig.sh` 

Follow the prompts accordingly, and when it finishes, it should have created a file in there called .env. You might not see it due to Mac/Win hiding 'secret' files like these, so to validate, type this into your command line:

`cat .env`

What prints out should look something like the following
```
CLIENTID=WellThisIsJustPlainGibberishButItLooksReallyComputeryAndTechnicalItProbablyWorkedWell
CLIENTSECRET=LessGibberishButStillSoManyRandomDigits
ENVIRONMENT=production
PORT=300
```
You're now good to move on to usage.

## Usage

Type the following into your command line/terminal:
`heroku local`

This will launch the app for you on your local machine. Once you've done this, just open a browser and go to **localhost:3000**. This should redirect you to a login page for Salesforce - log in with your credentials, and you'll be prompted with an OAuth acceptance page. Click to authorize, and you'll be brought back to the main application.

There are two tabs here, *CDC* and *Platform Events*. *CDC* will have automatically connected to the full `data/ChangeEvents` topic. At this point, leave this page open, go to your org, and Create/Update/Delete any record in Salesforce on the objects you set up for CDC above. You will get a new message on this page at the same time with the details on the change made.

For your custom platform events, or realtime Event Monitoring beta, you need to select the *Platform Events* tab, and type in the API Name of your event topic to track. Probably `my_event__e` or, if one of the Event Monitoring topics, `UriEventStream`. If it's not valid, you'll get the error message bout why. If it is, you'll see it added to the subscription list on the right hand side. From this point, any events fired on a subscribed topic will post here for you. In order to actually create a custom event, I recommend [this trailhead](https://trailhead.salesforce.com/en/content/learn/modules/platform_events_basics) to get started.

## Maintainers
[Cowie](https://github.com/cowie)

## Thanks
I'm a fan of all of y'all. Also thanks to folk on the SF Security Specialists team for guiding some requirements for this viewer. Also thanks to [nforce](https://www.npmjs.com/package/nforce) and [Faye](https://faye.jcoglan.com) and [SocketIO](https://socket.io/).

## Contributing
If you've got something you want tossed in, or errors you're seeing, super cool. Toss issues in the github issues area, and if you'd like, I'm open to PR's. Just hit me up.

## License
MIT License, so do whatever!

Copyright (c) [2019] [Cowie]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.