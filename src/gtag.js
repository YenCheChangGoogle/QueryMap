function GTag (map, form, director) {
    this.curPos = null;
    this.option = null;
    this.markers = [];
    this.dataUrl = null;
    this.drivingLimit = false;
    this.drivingDistance = null;
    this.iconLink = 'http://maps.google.com/mapfiles/kml/pal2/icon10.png';
    this.queryFocus = [22.998069, 120.218391]; // ncku cc in latlng
    this.focusZoom = 17;

    this.drawingManager = null;
    this.rectangle = null;
    this.polyOptions = {
        strokeWeight: 0,
        fillOpacity: 0.45,
        editable: true,
        fillColor: '#1E90FF',
        draggable: true
    };

    var tag = this;
    this.map = map;
    this.director = null;
    this.form = form;
    this.dataUrl = $(form).attr('action');

    $(form).submit(function(event) {
        event.preventDefault();
        var data = tag.prepareQueryData(this);
        if (data === '') {
            alert('Form must contain [option] field at least.')
        } else if (data) {
            tag.ajaxQuery(data);
        }
    });
}

GTag.prototype.initOption = function(option) {
    this.option = option;
    switch (option) {
        case 'around':
            this.enableClickMarker();
            this.disableDrawingRegion();
            break;
        case 'region':
            this.enableDrawingRegion();
            this.disableClickMarker();
            break;
        default:
            this.disableClickMarker();
            this.disableDrawingRegion();
    }
}

GTag.prototype.setDataUrl = function(url) {
    this.dataUrl = url;
}

GTag.prototype.prepareQueryData = function(form) {
    var posData = '';
    if (this.option == 'around') {
        posData = this.getPosFromPoint();
    } else if (this.option == 'region') {
        posData = this.getPosFromRegion();
    }
    if (posData === false) {
        return false;
    }
    var data = '';
    data = $(form).serialize();
    data += posData;
    return data;
}

/**
 * get latlng from the current tag point
 * @return {string} query string from google point, &lat1=[]&lon1=[]
 */
GTag.prototype.getPosFromPoint = function() {
    var data = '';
    if (this.curPos) {
        this.delAllMarkers();
        var lat = this.curPos.getPosition().lat();
        var lon = this.curPos.getPosition().lng();
        data = '&lat1='+lat+'&lon1='+lon;
    } else {
        alert('請在地圖上按一下滑鼠設定位置!');
        return false;
    }
    return data;
}

/**
 * get bounds from the current drawed rectangle
 * @return {string} query string from google rectangle, &lat1=[]&lon1=[]&lat2=[]&lon2=[]
 */
GTag.prototype.getPosFromRegion = function() {
    var data = '';
    if (this.rectangle) {
        this.delAllMarkers();
        var bounds = this.rectangle.getBounds();
        var start = bounds.getNorthEast();
        var end = bounds.getSouthWest();
        data = '&lat1='+end.lat()+'&lon1='+end.lng()+'&lat2='+start.lat()+'&lon2='+start.lng();
    } else {
        alert('請框定一個範圍');
        return false;
    }
    return data;
}

GTag.prototype.panToCc = function() {
    var focus = new google.maps.LatLng(this.queryFocus[0], this.queryFocus[1]);
    var extent = this.map.getBounds();
    var contain = extent.contains(focus);
    var zoom = this.map.getZoom();
    if (!contain || zoom != this.focusZoom) {
        this.map.setCenter(focus, this.focusZoom);
        this.map.setZoom(this.focusZoom);
    }
}

/**
 * enable click marker
 */
GTag.prototype.enableClickMarker = function() {
    var tag = this;
    google.maps.event.addListener(tag.map, "click", function(event) {
        // Clear marker if it already exists
        if (tag.curPos) tag.curPos.setMap(null);

        // Setting of marker
        var optionOfMarker = {
            position: event.latLng,
            map: map,
            title: event.latLng.toString()
        };

        // Show marker in the place of mouse clicks
        tag.curPos = new google.maps.Marker(optionOfMarker);
        tag.curPos.setAnimation(google.maps.Animation.DROP);
    });
}

/**
 * disable click marker
 */
GTag.prototype.disableClickMarker = function() {
    google.maps.event.clearListeners(map, "click");
    if (this.curPos) {
        this.curPos.setMap(null);
    }
    this.curPos = null;
}

/**
 * get the pos marker
 * @return {googlemap.Marker} return the assigned point marker
 */
GTag.prototype.getPos = function() {
    return this.curPos;
}

/**
 * set the pos marker
 * @return {null} set the current position point
 */
GTag.prototype.setPos = function(value) {
    this.curPos = value;
}

/**
 * clear all tags from markers
 * @return {null}
 */
GTag.prototype.delAllMarkers = function() {
    for(var i=0;i<this.markers.length;i++){
        this.markers[i].setMap(null);
    }
    this.markers = [];
}

GTag.prototype.setIcon = function(link) {
    this.iconLink = link;
}

/**
 * tag all latlng from data
 * @param  {json} data json data with lat, lng, and name
 * @return {null}
 */
GTag.prototype.tagMarkers = function(data) {
    var tagger = this;
    data.forEach(function(item) {
        var pos = new google.maps.LatLng(item.lat, item.lon);
        if (tagger.drivingLimit && tagger.option === 'around') {
            tagger.considerDrivingDistance(item.name, pos, tagger.drivingDistance);
        } else {
            tagger.tagMarker(item.name, pos);
        }
    });
}

/**
 * tag one marker
 * @param  {string} name name to show on the marker
 * @param  {latlng} pos  google latlng
 * @return {null}
 */
GTag.prototype.tagMarker = function (name, pos) {
    var tag = new google.maps.Marker({
            position: pos,
            icon: this.iconLink,
            map: this.map,
            title: name
        });
    this.markers.push(tag);
}

/**
 * [no api specific]
 * ajax function to query data and callback to tag markers
 * @param  {string} data query string
 * @return {null}
 */
GTag.prototype.ajaxQuery = function(data) {
    var tagger = this;
    $.ajax({
        dataType: "json",
        url: tagger.dataUrl,
        data: data,
        type: 'get',
        success: function(data) {
            if (typeof data.message === 'undefined') {
                tagger.tagMarkers(data);
            } else {
                alert(data.message);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(ajaxOptions + ":\n" + thrownError.message);
        }
    });
}

/**
 * activate google drawing tool
 * @return {null}
 */
GTag.prototype.enableDrawingRegion = function() {
    var tag = this;
    tag.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
        drawingControl: false,
        markerOptions: {
            draggable: true
        },
        // polylineOptions: {
        //     editable: true,
        //     draggable: true
        // },
        rectangleOptions: tag.polyOptions,
        // circleOptions: polyOptions,
        // polygonOptions: polyOptions,
        map: tag.map
    });

    google.maps.event.addListener(tag.drawingManager, 'overlaycomplete', function (e) {
        if (e.type !== google.maps.drawing.OverlayType.MARKER) {
            // Switch back to non-drawing mode after drawing a shape.
            tag.drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user
            // mouses down on it.
            tag.rectangle = e.overlay;
            tag.rectangle.type = e.type;
            tag.rectangle.setEditable(true);
        }
    });
}

/**
 * disable the drawing tool and remove the drawed rectangle
 * @return {null}
 */
GTag.prototype.disableDrawingRegion = function() {
    if (this.drawingManager) {
        this.drawingManager.setMap(null);
        this.drawingManager = null;
    }
    if (this.rectangle) {
        this.rectangle.setMap(null);
        this.rectangle = null;
    }
}

/**
 * set driving limit option
 * @param {string} distance in km
 */
GTag.prototype.setDrivingLimit = function(value) {
    this.drivingLimit = this.option=='around' && !!value;
    if (this.drivingLimit) {
        if (typeof google === 'object' && typeof google.maps === 'object') {
            this.director = new google.maps.DirectionsService();
            this.drivingDistance = parseInt(value, 10) * 1000;
            return true;
        } else {
            this.drivingLimit = false;
            return false;
        }
    } else {
        this.drivingDistance = 0;
        return false;
    }
}

/**
 * filter markers by Dirving distance
 * @param  {string} name  tag name
 * @param  {pos} pos   google latlng
 * @param  {int} limit driving distance limit
 * @return {null}
 */
GTag.prototype.considerDrivingDistance = function(name, pos, limit) {
    var tagger = this;
    var request = {
        origin: new google.maps.LatLng(this.curPos.getPosition().lat(), this.curPos.getPosition().lng()),
        destination: pos,
        provideRouteAlternatives: false,
        travelMode: 'DRIVING'
    };
    this.director.route(request, function(response, status) {
        var distance = 9999;
        if (status == 'OK') {
            distance = response.routes[0].legs[0].distance.value;
        }
        if (distance < limit) {
            tagger.tagMarker(name, pos);
        }
    });
}