Local API create a local API server on your Homey.

You can create Endpoints to the app simply by adding a flow card and use
it to start a new flow or communicate a variable state in the JSON
response.

The Response is always a JSON object.

HOW TO USE:

1. Install the app
2. Set up the app in the settings page and restart it
3. Create a new flow with the Local API app: remember to add the trigger card
4. Personalize the flow as you like
5. End the flow with at least one of the following cards:
    - Respond with ... (remember to add the JSON response)
    - Respond with 200
6. Save the flow and test it with a browser. The URL is `http://homey-ip:<PORT>/endpoint-name`

DISCLAIMER:

Don't use this app to expose your Homey to the internet. Its use is intended for local network only.
