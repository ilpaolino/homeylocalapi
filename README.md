# Local API

Local API create a local API server on port 3000 of your Homey.

You can create Endpoints to the app simply by adding a flow card and use 
it to start a new flow or communicate an Homey variable state in the JSON
response.

The Response is always a JSON object.

## How to use

1. Install the app
2. Create a new flow with the Local API app: remeber to add the trigger card
3. Personalize the flow as you like
4. End the flow wit at least one of the following cards:
    - Respond with ... (remember to add the JSON response)
    - Respond with 200
5. Save the flow and test it with a browser. The URL is `http://homey-ip:3000/endpoint-name`

## Future improvements

- [ ] Add Port personalization in settings
- [ ] Add JSON validation
- [ ] Add more methods (PUT, OPTIONS)
- [ ] Add more translations (You can contribute! Write me a message)
- [ ] ... (please suggest)

## Thanks to

- App Icon:\
  [Stephan Photo](https://pixabay.com/it/users/io-images-1096650/) from [Pixabay](https://pixabay.com/it/)

- Background Image:\
  [Pete Linforth Photo](https://pixabay.com/it/users/thedigitalartist-202249/) from [Pixabay](https://pixabay.com/it/)


## Donate

If you like this app, please consider a donation to support the development of this app.

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?business=3HHS9TR2JXJ5W&no_recurring=1&item_name=Donations+for+OpenSource+projects+developed+by+me.&currency_code=EUR)
