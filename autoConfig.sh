#automatic setup
echo "Time to set up your environment variables! Get Hype."
touch .env
echo "What type of org is this? Type \"sandbox\" or \"production\". (Hint: Dev editions are still 'production', Scratch orgs are still 'sandbox')"
read environment
echo "ENVIRONMENT:$environment" >> .env
echo "Go to your Connected App in Salesforce"
echo "Copy/paste the value for \"Consumer Key\""
read clientID 
echo "CLIENTID:$clientID" >> .env
echo "Now to the right, click to reveal the \"Consumer Secret\" and copy/paste it below"
read clientSecret
echo "CLIENTSECRET:$clientSecret" >> .env
echo "PORT:3000" >> .env
echo "Thanks! Your app has been set up!"
