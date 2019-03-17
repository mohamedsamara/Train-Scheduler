$(document).ready(function() {
  // Initialize Firebase
  var config = {
    apiKey: 'AIzaSyAcxdngxwy2J6BJn2aih9spdY_DqYGJb_0',
    authDomain: 'train-scheduler-e6659.firebaseapp.com',
    databaseURL: 'https://train-scheduler-e6659.firebaseio.com',
    projectId: 'train-scheduler-e6659',
    storageBucket: 'train-scheduler-e6659.appspot.com',
    messagingSenderId: '223671418911'
  };
  firebase.initializeApp(config);

  // Create a variable to reference the database
  var database = firebase.database();

  // fetch trains data
  var getTrains = function() {
    database.ref('/trains').on(
      'value',
      function(snapshot) {
        $('.train-table tbody').empty();

        $.each(snapshot.val(), function(i, value) {
          var scheduleData = calculateScheduleTime(
            value.first_arrival,
            value.frequency
          );

          var markup =
            '<tr><td>' +
            value.name +
            '</td><td>' +
            value.destination +
            '</td><td>' +
            value.frequency +
            ' min</td><td>' +
            scheduleData.nextTrainTime +
            '</td><td>' +
            scheduleData.minToArrival +
            ' min</td><td><button class="btn btn-danger btn-xs remove-train" data-key="' +
            i +
            '"><i class="fas fa-times"></i></button></td><td></tr>';

          $('.train-table tbody').append(markup);
        });
      },
      function(errorObject) {
        showNotification(errorObject.code, 'danger');
      }
    );
  };

  // add train
  $('#add-train').on('submit', function(e) {
    e.preventDefault();

    var name = $('#trainName').val();
    var destination = $('#destination').val();
    var frequency = $('#frequency').val();
    var firstArrival = $('#firstArrival')
      .val()
      .trim();

    // construct an object ready to be sent to the database
    var newTrain = {
      name: name,
      destination: destination,
      frequency: frequency,
      first_arrival: firstArrival,
      date_added: firebase.database.ServerValue.TIMESTAMP
    };

    database
      .ref('/trains')
      .push(newTrain)
      .then(function() {
        $('#trainName').val('');
        $('#destination').val('');
        $('#frequency').val('');

        getTimeFormatted();
        showNotification('Train successfully added', 'success');
      })
      .catch(function(error) {
        showNotification(error.message, 'danger');
      });
  });

  // remove train
  $(document).on('click', '.remove-train', function() {
    var id = $(this).attr('data-key');

    database
      .ref('trains')
      .child(id)
      .remove()
      .then(function() {
        showNotification('Train successfully removed', 'success');
      })
      .catch(function(error) {
        showNotification(error.message, 'danger');
      });
  });

  // show notification
  var showNotification = function(message, type) {
    $('#message-alerts').html('<p>' + message + '</p>');
    $('#message-alerts').addClass('alert alert-' + type);

    $('#message-alerts')
      .fadeTo(2000, 500)
      .slideUp(500, function() {
        $('#message-alerts').slideUp(500);
      });
  };

  // format time
  var getTimeFormatted = function() {
    $('#firstArrival').mask('00:00');
    $('#frequency').mask('00');

    var time = moment().format('HH:mm');
    $('#firstArrival').val(time);
  };

  getTrains();
  getTimeFormatted();

  setInterval(function() {
    window.location.reload();
  }, 90000);

  // calculate schedule time
  var calculateScheduleTime = function(arrival, frequency) {
    var scheduleData = {};

    var firstArrival = moment(arrival, 'HH:mm')
      .subtract(1, 'years')
      .format('X');

    var timeDifference = moment().diff(moment.unix(firstArrival), 'minutes');

    var timeRemaining = timeDifference % frequency;

    var minToArrival = frequency - timeRemaining;

    var nextTrainTime = moment()
      .add(minToArrival, 'm')
      .format('hh:mm A');

    scheduleData.firstArrival = firstArrival;
    scheduleData.minToArrival = minToArrival;
    scheduleData.nextTrainTime = nextTrainTime;

    return scheduleData;
  };
});
