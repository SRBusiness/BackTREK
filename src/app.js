// Vendor Modules
import $ from 'jquery';
import _ from 'underscore';

// CSS
import './css/foundation.css';
import './css/style.css';

// Our components
import TripList from './app/collections/trip_list';
import Trip from './app/models/trip';

const tripList = new TripList();

const TRIP_FIELDS = ["id", "about", "name", "continent", "category", "weeks", "cost"];

let tripTemplate;
let detailsTemplate;
let statusTemplate;

const renderDetails = function renderDetails(trip){
  const detailsElement = $('#trip-details');
  detailsElement.html('');

  if (trip.get('about')) {
    const generatedHTML = $(detailsTemplate(trip.attributes));
    detailsElement.append(generatedHTML);
    console.log(`my trip already has info`);
  } else {
    trip.fetch({
      success: (model) => {
        const generatedHTML = $(detailsTemplate(trip.attributes));
        detailsElement.append(generatedHTML);
        console.log(trip);
        console.log(trip.attributes);
      }
    });
  }
};

// Add a new status message
// Need to make this method work for front and back end validation or need different ones.

// const reportSuccess = function reportSuccess(status, message){
//
// };

const reportStatus = function reportStatus(status, field, problem) {
  console.log('in reportStatus function');
  // fail status
  if (status === 'error') {
    console.log('error');
    console.log(`Reporting ${ status } status: ${ field } problem: ${problem}`);
    const errorSpanElement = $(`#form-${field}`)
    errorSpanElement.html('');
    const generatedHTML = $(statusTemplate({'problem': problem }));
    errorSpanElement.append(generatedHTML);
  } else {
    // success status
    console.log('success');
    console.log(`Reporting ${ status } status: ${ field } `);
    const messageHook = $('#success p')
    messageHook.html('');
    const generatedHTML = `${field}`
    messageHook.append(generatedHTML);
  }
};

const clearFormMessages = function clearFormMessages() {
  $('#add-trip-form span').html('')
};

const handleValidationFailures = function handleValidationFailures(errors) {
  console.log('in handleValidationFailures function');
  for (let field in errors) {
    for (let problem of errors[field]) {
      reportStatus('error', field,  problem);
    }
  }
};

const addTripHandler = function(event) {
  console.log('addTripHandler entered');
  event.preventDefault();

  const trip = new Trip(readResFormData());
  if (!trip.isValid()) {
    console.log(`trip is not valid!`);
    handleValidationFailures(trip.validationError);
    return;
  }

  tripList.add(trip);

  trip.save({}, {
    success: (model, response) => {
      console.log('Successfully saved Trip!');
      console.log('passed server side validation');
      $('#myModal').hide();
      $(`#add-trip-form input`).val('');
      reportStatus('success', 'Successfully saved trip!');
    },
    error: (model, response) => {
      console.log('Failed to save book! Server response:');
      console.log('Failed server side validation');

      console.log(response);

      // Server-side validations failed, so remove this bad trip from the list
      tripList.remove(model);
      console.log(response.responseJSON["errors"]);
      handleValidationFailures(response.responseJSON["errors"]);
    },
  });
  // console.log();
};



const readResFormData = function readResFormData(){
  const tripData = {};
  TRIP_FIELDS.forEach((field) => {
    // select the input corresponding to the field we want
    const inputElement = $(`#add-trip-form input[name="${ field }"]`);
    const value = inputElement.val();

    // Don't take empty strings, so that Backbone can fill in default values
    if (value != '') {
      tripData[field] = value;
    }

    // inputElement.val('');
  });
  console.log("Read trip data");
  console.log(tripData);

  return tripData;
};

const render = function render(tripList) {
  // iterate through the bookList, generate HTML
  // for each model and attatch it to the DOM
  const tripTableElement = $('#trip-list');

  // clears the html so when we dynamically render again we get a new list vs just adding on
  tripTableElement.html('');

  tripList.forEach((trip) => {
    const generatedHTML = $(tripTemplate(trip.attributes));
    generatedHTML.on('click', (event) => {
      renderDetails(trip);
    });
    tripTableElement.append(generatedHTML);
  });
};

$(document).ready( () => {
  let modal = $('#myModal');

  // compiled underscore templates
  detailsTemplate = _.template($('#details-template').html());
  tripTemplate = _.template($('#trip-template').html());
  statusTemplate = _.template($('#status-message-template').html());

  // adding new models to a collection triggers an update event
  tripList.on('update', render);

  // get all of the trips from the API
  tripList.fetch();

  // EVENTS
  $('#add-trip-form').on('submit', addTripHandler);

  // MODAL
  // displays modal on button click
  $('#add-trip-button').on('click', function() {
    modal.css("display", "block");
  });

  // hides modal on click for things with correct class
  $('body').on('click', '.modal-close', function(event){
    if($(event.target).hasClass('modal-close')) {
      modal.hide();
      clearFormMessages();
    }
  });
});
