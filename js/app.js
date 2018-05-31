// Global Variables
var _bounds;
var _infoWindow;
var map;

// My list of hard coded locations
var locations = [
    {
        name: "Crown Bar",
        coordinates: {
            lat: -33.722259,
            lng: 18.963637
        }
    },
    {
        name: "Kikka",
        coordinates: {
            lat: -33.741825,
            lng: 18.962442
        }
    },
    {
        name: "Nederburg Wines",
        coordinates: {
            lat: -33.720603,
            lng: 19.003357
        }
    },
    {
        name: "Drakenstein Lion Park",
        coordinates: {
            lat: -33.795344,
            lng: 18.909834
        }
    },
    {
        name: "Knus",
        coordinates: {
            lat: -33.776417,
            lng: 18.954701
        }
    },
    {
        name: "Hussar Grill",
        coordinates: {
            lat: -33.755591,
            lng: 18.961894
        }
    },
    {
        name: "Spice Route",
        coordinates: {
            lat: -33.763608,
            lng: 18.918893
        }
    },
    {
        name: "Fairview",
        coordinates: {
            lat: -33.771445,
            lng: 18.924220
        }
    },
    {
        name: "Pearl Mountain",
        coordinates: {
            lat: -33.708564,
            lng: 18.957503
        }
    }
];

// Initialize map function centers on Paarl South Africa
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -33.722259, lng: 18.963637 },
        zoom: 13
    });

    // Initializing bounds and infowindow for later use
    _bounds = new google.maps.LatLngBounds();
    _infoWindow = new google.maps.InfoWindow();

    ko.applyBindings(new ViewModel());
}

// Error Logger
function errorLogger() {
    alert("Problem Loading Map. Please Check Quality Of Network And Try Again");
}

var locationMarker = function (data) {
    // To avoid conflict self is declared inorder not to cross data stream
    var self = this;

    this.title = data.name;
    this.position = data.coordinates;
    this.street = "";
    this.city = "";

    this.visible = ko.observable(true);

    // FourSquare Required
    var clientSecret = "2AHIGPEAMCNF0RZ3LOVGWRAZRKLJ3KNBUNZ0WVCNNJHMPLJQ";
    var clientID = "U5TPQXMG0IUYSHTTAUMTRWAGQILLTXDZ2QVRU1DTEKRYCCOY";

    // Prebuilds url to be requested
    var foureSquareUrl = "https://api.foursquare.com/v2/venues/search?ll=" + self.position.lat + "," + self.position.lng + "&client_id=" + clientID + "&client_secret=" + clientSecret + "&v=20180531&q=" + this.title;

    $.getJSON(foureSquareUrl).done(function (data) {

        var results = data.response.venues[0];
        console.log(data);
        // Sets self to data retrieved from API request

        self.title = results.location.name;
        self.type = results.categories[0].shortName;
        self.street = results.location.address ? results.location.address : "Not Available";
        self.city = results.location.city ? results.location.city : "Not Available";

    }).fail(function () {
        // If fouresquare call should fail error 
        alert("Error Occured While Retrieving ForeSquare Information");
    });
    // Creates Marker
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP
    });

    // Filters locations based on data entered into input
    self.filterMarkers = ko.computed(function () {
        if (self.visible() === true) {
            self.marker.setMap(map);
            _bounds.extend(self.marker.position);
            map.fitBounds(_bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Add listener to detect when marker is clicked to open infoWindow and toggleAnimation
    this.marker.addListener("click", function () {
        populateInfoWindow(this, self.street, self.type, self.city, _infoWindow);
        toggleAnimation(this);
        map.panTo(this.getPosition());
    });

    // Triggers when list item is clicked to trigger marker on map
    this.show = function (location) {
        google.maps.event.trigger(self.marker, "click");
    };

}

// ViewModel Setup
var ViewModel = function () {
    var self = this;

    this.searchTerm = ko.observable("");
    this.markerList = ko.observableArray([]);

    // Creates new LocationMarker objects
    locations.forEach(loc => {
        self.markerList.push(new locationMarker(loc));
    });

    // Filters markerList and returns and items that matches the search term which inturn removes markers not within it
    this.markerList = ko.computed(function () {
        var filterTerm = self.searchTerm().toLowerCase();
        if (filterTerm) {
            return ko.utils.arrayFilter(self.markerList(), function (location) {
                var temp = location.title.toLowerCase();
                var result = temp.includes(filterTerm);

                location.visible(result);
                return result;
            });
        }

        // Hides marker if it does not contain the search term
        self.markerList().forEach(function (location) {
            location.visible(true);
        });
        return self.markerList();
    }, self);

}

function populateInfoWindow(marker, street, type, city, infoWindow) {

    console.log(marker);
    // Creates Info Window with markers data and binds them together
    if (infoWindow.marker != marker) {
        // The content within the info Window
        var content = "<h4 class='infoTitle'>" + marker.title + "</h4>" +
            "<p class='description'> Type: <span>" + type + "</span><p>" +
            "<p class='description'> Address: <span>" + street + "</span><p>" +
            "<p class='description'> City: <span>" + city + "</span></p>";
        infoWindow.setContent(content);
        infoWindow.marker = marker;

        infoWindow.addListener("closeclick", function () {
            infoWindow.marker = null;
        });


        // Initiates InfoWindow
        infoWindow.open(map, marker);
    }
}

// Small toggle animation button to apply bounce effect to markers
function toggleAnimation(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function () {
        marker.setAnimation(null);
    }, 2000);
}