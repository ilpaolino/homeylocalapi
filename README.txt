Local API create a local API server on port 3000 of your Homey.

You can create Endpoints to the app simply by adding a flow card and use
it to start a new flow or communicate an Homey variable state in the JSON
response.

The Response is always a JSON object.

HOW TO USE:

1. Install the app
2. Create a new flow with the Local API app: remeber to add the trigger card
3. Personalize the flow as you like
4. End the flow wit at least one of the following cards:
    - Respond with ... (remember to add the JSON response)
    - Respond with 200
5. Save the flow and test it with a browser. The URL is `http://homey-ip:3000/endpoint-name`
