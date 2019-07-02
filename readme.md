# SFDC Simple Change Data Capture (CDC) Event Viewer
### Things this is: Open sourced, free
### Things this isn't: Didn't do like disconnect logic, retries, that sort of thing, so it's a baseline to show stuff, but it's not complex. Also probably isn't efficient to go JSFOrce-Faye-Socket, but it was suuuuper easy to set up quickly.
### Status: Actually it works just fine. Maybe a 5-10m spinup process for localhost. Can push to Heroku too if ya wanted.

## Ramblin's

Basically what you have here is a quick node app that will let you consume from CDC. All the CDC. I didn't add the ability to pick your objects, it's simple and just hitting `data/ChangeEvents`, to capture everything and anything.

Now, I didn't want any of the CDC logic in the client, because meh, so we're basically using two different methods to event in real-time. Yeah, it's probably an anti-pattern, but it was suuuper easy to do, and I'm a big fan of Socket.io, so here we are. Basically, the dance is such - when you hit index, it'll check the **NForce** object to see if we've got a live org. If not, use **NForce** to quickly redirect to an oAuth page from SF to log in, and authorize the app. Then redirected back to the live feed, newly connected (the redirect URL expected is `/auth/sfdc/callback`, found in *routes/index.js*[13] and routed at *routes/index.js*[35]). At this point, **Faye** will kick off with your token, and set up a subscription to your org's `data/changeEvents` CDC endpoint, which gives you everything.

Now, to get the feed to the clientside, we need to add a server for the client to listen to. I probably coulda created a **Faye** client, but I'm having a ball lately with **socket.io**, so I used it instead. Once the **Faye** client is in, we activate a channel in **socket.io** in order to publish to. Once you're redirected to the live index.pug, we activate a client-side **socket.io** subscriber to listen to the messages routed via **Faye** to **socket.io**. 

Styling? We just downloaded the SLDS package and are using that to make it look pretty and Salesforcey.

## Setup

Get a salesforce org. Create a connected app. Set the OAuth endpoint to `http://localhost:3000/auth/sfdc/callback`. Wait like 5 minutes. Srs, it's gotta propagate throughout all the servers, really let it breathe.

While you're waiting - go into **Setup** and **Change Data Capture**. Activate this for the objects you want to play with. It's dirt simple, seriously.

### Local Install/Execution:

`git clone this`
`npm install`
`touch .env`

Env Vars Of Note to put either in your local .env file, or in Heroku's dashboard.
* CLIENTID / CLIENTSECRET - Standard OAuth things
* ENVIRONMENT - 'sandbox' or 'production' - hint: if a scratch org, dats a sandbox
* PORT - I like 3000, if on Heroku this'll get auto-set for you.

`heroku local` - use this, NOT npm start, in order to pick up all them pretty heroku bits in the .env var. What's that? no Heroku CLI? Come on (wo)man. Get your priorities in order.

At that point you can go to `http://localhost:PORT` and you'll get redirected to log in. Log in, authorize your app, and any changes on objects you selected for CDC above will filter directly here. It should handle Multi-Record changes, as well as objects that have multi-field fields (think like Name:{firstname/lastname} or Address:{all the address stuff}).

### Heroku Install/Execution
Supes lazy, will get to this - basically just create an app, push the source, create the env vars, and make sure your Connected App is pointing to your heroku endpoint not localhost and I think you should be good to go.

## What would I need to do to make this real?
I mean really, it *is*? You probably need to add retry logic and other elements, but since this is oriented around a client view of the messages flowing through, I imagine it'd be tying the message logic into whatever js you're doing, instead of just creating dom elements. Trigger things on the page, etc. Really float yer boat. That said - be careful here, it's not really...built for like 80 viewers of the same thread. You might want to break this apart if you're building a streaming system against CDC, basically one Heroku App to be what Faye does here and set up a socket.io bit, and then everything hitting that. You can't trust that everyone'll be on the same dyno, so you need to build this right, dig?

You could probably not use socket if you didn't want to, or swap out JSForce instead of NForce + Faye. That probably isn't the best way, but again - lazy, ya know?

## What can I learn from this sucker?
Ehh probably not too much, I mean it is what it is.

## ToDo / Asks
* Probably should tab out or something to allow for easier segmentation of different objects.
* Didn't do a TON of Gap/Overflow testing