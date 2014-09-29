function is_defined (obj) {
  return typeof(obj) !== "undefined";
}

function save_cookies () {
  $.cookie("from", $("#from").prop("value"));
  $.cookie("to", $("#to").prop("value"));
  $.cookie("when", $("#when").prop("value"));
}

function load_cookies () {
  $.cookie.defaults.expires = 365; // expire in one year
  $.cookie.defaults.path = '/'; // available across the whole site
  $("#from").prop("value", $.cookie("from"));
  $("#to").prop("value", $.cookie("to"));
  $("#when").prop("value", $.cookie("when"));
}

String.prototype.repeat = function( num ) {
  for( var i = 0, buf = ""; i < num; i++ ) buf += this;
  return buf;
}

String.prototype.rjust = function( width, padding ) {
  padding = padding || " ";
  padding = padding.substr( 0, 1 );
  if( this.length < width )
    return padding.repeat( width - this.length ) + this;
  else
    return this;
}

function str2date (str) {
  var parts = str.split(':').map(function(t) { return parseInt(t) });
  var date = new Date();
  date.setHours(parts[0], parts[1], parts[2]);
  return date;
}

function date2str (date) {
  return [
  date.getHours().toString().rjust(2, '0'),
  date.getMinutes().toString().rjust(2, '0')
  ].join(':');
}

function time_relative (from, to) {
  return Math.round((to - from) / 1000 / 60); // in minute
}

function is_now () {
  return $("#when").prop("value") === "now";
}

function get_trip_match_regexp () {
  if (is_now()) {
    var now_date = new Date();
    switch (now_date.getDay()) {
      case 1: case 2: case 3: case 4: case 5:
        return /Weekday/i;
      case 6:
        return /Saturday/i;
      case 0:
        return /Sunday/i;
      default:
        alert("now_date.getDay() got wrong: " + now_date.getDay());
        return;
    }
  } else {
    var value = $("#when").prop("value");
    value = value.charAt(0).toUpperCase() + value.substring(1); // capitalize
    return new RegExp(value, "i"); // ignore case
  }
}

function compare_trip (a, b) {
  return a.departure_time - b.departure_time;
}

function get_trips (services, from_ids, to_ids) {
  var trips = []; // valid trips
  var trip_reg = get_trip_match_regexp();

  for (var trip_id in services) {
    if (!trip_reg.exec(trip_id)) {
      continue;
    }

    var service = services[trip_id],
    from = undefined,
    to = undefined;

    from_ids.forEach(function(id) {
      if (is_defined(service[id])) {
        from = service[id];
      }
    });
    to_ids.forEach(function(id) {
      if (is_defined(service[id])) {
        to = service[id];
      }
    });

    if (is_defined(from) && is_defined(to) &&
        from.stop_sequence < to.stop_sequence &&
        (!is_now() || from.departure_time > new Date())) {
      trips.push({
        departure_time: from.departure_time,
        arrival_time: to.arrival_time
      });
    };
  }

  return trips.sort(compare_trip);
}

function render_info (next_train) {
  var info = $("#info").empty();
  if (is_now() && is_defined(next_train)) {
    var next_relative = time_relative(new Date(), next_train.departure_time);
    info.append('<div class="info">Next train: ' + next_relative + 'min</div>');
  };
}

function render_result (trips) {
  var result = $("#result").empty();
  trips.forEach(function(trip) {
    var departure_str = date2str(trip.departure_time);
    var arrival_str = date2str(trip.arrival_time);
    var trip_time = time_relative(trip.departure_time, trip.arrival_time);
    result.append('<div class="trip">' +
                  departure_str + ' => ' + arrival_str + ' (' + trip_time + 'min)' +
                  '</div>');
  });
}

function schedule (event) {
  save_cookies();

  var cities = event.data["cities"], services = event.data["services"];
  var from_ids = cities[$("#from").prop("value")],
      to_ids = cities[$("#to").prop("value")];
  var trips = get_trips(services, from_ids, to_ids);

  render_info(trips[0]);
  render_result(trips);
}

function bind_events (data) {
  $("#from").on("change", data, schedule);
  $("#to").on("change", data, schedule);
  $("#when").on("change", data, schedule);
  $("#reverse").on("click", data, function(event) {
    var t = $("#from").prop("value");
    $("#from").prop("value", $("#to").prop("value"));
    $("#to").prop("value", t);
    schedule(event);
  });
}

function initialize (data) {
  var stops = data.stops, times = data.times;

  // generate cities
  var cities = {};
  stops.forEach(function(s) {
    var id = s.stop_id, name = s.stop_name;
    if (!is_defined(cities[name])) {
      cities[name] = [id];
    } else {
      cities[name].push(id);
    };
  });

  // generate select options
  var from = $("#from"), to = $("#to");
  for (var name in cities) {
    from.append(new Option(name));
    to.append(new Option(name));
  }

  // generate services
  var services = {};
  times.forEach(function(t) {
    var trip_id = t.trip_id;
    if (!is_defined(services[trip_id])) {
      services[trip_id] = {};
    };

    services[trip_id][t.stop_id] = {
      departure_time: str2date(t.departure_time),
      arrival_time: str2date(t.arrival_time),
      stop_sequence: t.stop_sequence
    };
  });

  // init
  var data = {
    cities: cities,
    services: services
  };
  load_cookies();
  bind_events(data);
  schedule({ data: data }); // init schedule
}

function data_checker (names, callback) {
  var mark = {}, all_data = {}, callback = callback;
  names.forEach(function(name) {
    mark[name] = false;
  });
  return function(name, data) {
    mark[name] = true;
    all_data[name] = data;

    var all_true = true;
    for (var n in mark)
      if (!mark[n])
        all_true = false;

    if (all_true)
      callback(all_data);
  };
}

$(function() {
  FastClick.attach(document.body);
});

$(document).ready(function() {
  var checker = data_checker(["stops", "times"], initialize);

  Papa.parse("data/stops.csv", {
    download: true,
    dynamicTyping: true,
    header: true,
    complete: function(results) {
      checker("stops", results.data);
    }
  });

  Papa.parse("data/times.csv", {
    download: true,
    dynamicTyping: true,
    header: true,
    complete: function(results) {
      checker("times", results.data);
    }
  });
});
