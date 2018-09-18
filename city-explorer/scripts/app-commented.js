'use strict';

/* Variable to store the back end URL. This allows the client to make requests to *your* deployed back end, no one else's */
let __API_URL__;

/* When a user enters a back end URL in the first input and submits the form, this callback will execute. The __API_URL__ variable is now assigned the value that the user entered, so it can be prepended to the url in the AJAX request, below. So if you are testing locally, the __API_URL__ can be "http://localhost:3000", or if you are testing your deployed backend, the __API_URL__ can be your Heroku URL. Also, jQuery is used to hide the URL form and show the Search form. */
$('#url-form').on('submit', function(event) {
  event.preventDefault();
  // Whatever the user enters into the first input becomes the __API_URL__ that will receive requests
  __API_URL__ = $('#back-end-url').val();
  $('#url-form').addClass('hide');
  $('#search-form').removeClass('hide');
});

// Event listener for the search form
$('#search-form').on('submit', fetchCityData);

// Callback to execute when the user enters a search
function fetchCityData(event) {
  event.preventDefault();

  // Captures the query entered by the user and stores it in a variable
  let searchQuery = $('#input-search').val();

  // Use jQuery to make a request to a server at a specific URL
  // In our case, the URL is our deployed back end on Heroku
  // Or, if we are testing locally with nodemon, our port on local host
  $.ajax({
    /* Specifies the URL and path, corresponds to a listener in the server. On the back end (aka in the server.js file), this corresponds to the "location" part of app.get('/location'), also called the "path" */
    url: `${__API_URL__}/location`,
    // specifies the method we want to use, this part matches to "app.get" in the server
    method: 'GET',
    /* Sends along the necessary data, which the server can then use. Remember, this is the value of the search box, so this comes from the user. On the back end, we can access this as "request.query.data". The "request.query" comes from the request and the data is appended to the url. For example, "http://localhost:3000/location?data=seattle". It has to be "data" specifically in "request.query.data" because that is the value we set in the object literal. The server has no idea what "searchQuery" is because it is a variable scoped to the client, but whatever the user enters is stored in the searchQuery variable and then included as part of the request. */
    data: {data: searchQuery}
  })  // the client doesn't know what the server will be sending back, but whatever it sends, we are going to call it "location", below, as a parameter to represent the server's response. Because we are writing the back end code as well, we know that this is going to be an object literal with four properties: search_query, formatted_address, latutitude, and longitude
    .then(location => { // remember, this code will execute when the AJAX request completes
      // renders the Google map based on the latitude and longitude returned from the server
      displayMap(location);
      /* Use the getResource helper function, below, to send additional requests. For example, the first one matches over to the following URL: ${__API_URL__}/weather. This uses the same "location" parameter that represents the response from the server.
      
      This can also be written as: 
      $.ajax({
        url: `${__API_URL__}/weather`,
        method: 'GET',
        data: {data: location}
      })
      
      This can also be written as:
      $.get(`${__API_URL__}/weather`, {data: location});
      */
      getResource('weather', location);
      getResource('movies', location);
      getResource('yelp', location);
      getResource('meetups', location);
      getResource('trails', location);
    })
    // This is what we do if an error occurs. Every .then should be matched with a .catch
    .catch(error => {
      compileTemplate([error], 'error-container', 'error-template');
      $('#map').addClass('hide');
      $('section, div').addClass('hide');
    });
}

// From the Google Maps API, uses the latitude and longitude to render the map
function displayMap(location) {
  // This is why the response included the formatted query
  $('.query-placeholder').text(`Here are the results for ${location.formatted_query}`);

  $('#map').removeClass('hide');
  $('section, div').removeClass('hide');

  $('#map').attr('src', `https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude}%2c%20${location.longitude}&zoom=13&size=600x300&maptype=roadmap
  &key=AIzaSyDp0Caae9rkHUHwERAFzs6WN4_MuphTimk`)
}

// Function used above in the .then() to request data from the other five APIs using the response from the Google Maps geocoding API
function getResource(resource, location) {
  // Will send an AJAX request, specifically $.get(), to the server and will send the location as the data
  // Recall from above that the location is the response from the first AJAX request we sent to the server
  $.get(`${__API_URL__}/${resource }`, {data: location})
    // whenever the server responds, we will pass the result through Handlebars using the helper function below
    .then(result => {
      /* The use of "resource" twice here matches over to the naming in our HTML, as well as our path. For example, the path is "yelp", the section has a class of "yelp-results", and the Handlebars template has an id of "yelp-results-template", so we can use "yelp" in three different places with one variable name. */
      compileTemplate(result, `${resource}-results`, `${resource}-results-template`);
    })
    .catch(error => {
      // use the same helper function if there is an error
      compileTemplate([error], 'error-container', 'error-template');
    })
}

// Helper function to compile the response with Handlebars
function compileTemplate(input, sectionClass, templateId) {
  $(`.${sectionClass}`).empty();

  let template = Handlebars.compile($(`#${templateId}`).text());

  // We can assume that the input (aka response from the server) will be an array because .forEach() is an array method
  input.forEach(element => {
    // dynamically append to the corresponding section
    $(`.${sectionClass}`).append(template(element));
  })
}
