Ok I promise I'll hit this later.

Basically what you have here is a quick node app that will let you consume from CDC. All the CDC. 
If I sent you here, here's what you do.

Get a salesforce org. Create a connected app. Set the OAuth endpoint to `http://localhost:3000/oauth/_callback`. Wait like 5 minutes. Srs.

While waiting, enable Change Data Capture on a few objects. Do it. It's fun.

`git clone this down`
`npm install`
`touch .env`

ENV needs the following vars set
* CLIENTID= the Connected App ID you get from Salesforce
* CLIENTSECRET = the Connected App Secret you get from Salesforce
* ENVIRONMENT = production or sandbox
* SFDCUSERNAME = come on now
* SFDCPASSWORD = needs to include yer token
* PORT = I like 3000. 

Then to run, use `heroku local`. What's that? no Heroku CLI? Come on (wo)man. Get your priorities in order.

At that point you can go to http://localhost:YOURPORT and you'll get a nearly blank page - while it connects up to the org. Go to the org you linked to and change a record/whatever in an object you turned CDC on for. Cheer at the results.