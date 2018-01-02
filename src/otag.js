function OTag (map, form) {
    this.curPos = null;
    this.option = null;
    this.markers = [];
    this.dataUrl = null;
    this.drivingLimit = false;
    this.drivingDistance = null;
    this.posIcon = 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png';
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
    this.source = new ol.source.Vector();
    this.dbFeatureLayer = new ol.layer.Vector({
        source: this.source,
    });
    this.map.addLayer(this.dbFeatureLayer);

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

OTag.prototype.initOption = function(option) {
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

OTag.prototype.setDataUrl = function(url) {
    this.dataUrl = url;
}

/**
 * retrieve query data from form and the positions of the marked point or the drawed rectangle
 * @param  {element} form a form with query fields
 * @return {string}      query string formated with urlencoded
 */
OTag.prototype.prepareQueryData = function(form) {
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
OTag.prototype.getPosFromPoint = function() {
    var data = '';
    if (this.curPos) {
        this.delAllMarkers();
        var coord = this.curPos.getGeometry().getCoordinates();
        coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
        var lat = coord[1];
        var lon = coord[0];
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
OTag.prototype.getPosFromRegion = function() {
    var data = '';
    if (this.rectangle) {
        this.delAllMarkers();
        var bounds = this.rectangle.getGeometry().getExtent();
        var start = [bounds[0], bounds[1]];
        var end = [bounds[2], bounds[3]];
        start = ol.proj.transform(start, 'EPSG:3857', 'EPSG:4326');
        end = ol.proj.transform(end, 'EPSG:3857', 'EPSG:4326');
        data = '&lat1='+start[1]+'&lon1='+start[0]+'&lat2='+end[1]+'&lon2='+end[0];
    } else {
        alert('請框定一個範圍');
        return false;
    }
    return data;
}

OTag.prototype.panToCc = function() {
    var focus = ol.proj.fromLonLat([this.queryFocus[1], this.queryFocus[0]]);
    var view = this.map.getView();
    var zoom = view.getZoom();
    var extent = view.calculateExtent(this.map.getSize());
    var contain = ol.extent.containsCoordinate(extent, focus);
    if (!contain || zoom != this.focusZoom) {
        view.animate({
            center: focus,
            duration: 2000,
            zoom: this.focusZoom
        });
    }
}

/**
 * enable click marker
 */
OTag.prototype.enableClickMarker = function() {
    map.on("singleclick", this.clickHandler, this);
}

OTag.prototype.clickHandler = function(event) {
    // Clear marker if it already exists
    if (this.curPos) {
        this.dbFeatureLayer.getSource().removeFeature(this.curPos);
        this.curPos = null;
    }
    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(({
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              src: this.posIcon
        }))
    });
    this.curPos = new ol.Feature({
        geometry: new ol.geom.Point(event.coordinate)
    });
    this.curPos.setStyle(iconStyle);
    this.dbFeatureLayer.getSource().addFeature(this.curPos);
}

/**
 * disable click marker
 */
OTag.prototype.disableClickMarker = function() {
    map.un("singleclick", this.clickHandler, this);
    if (this.curPos) {
        this.dbFeatureLayer.getSource().removeFeature(this.curPos);
        this.curPos = null;
    }
}

/**
 * get the pos marker
 * @return {googlemap.Marker} return the assigned point marker
 */
OTag.prototype.getPos = function() {
    return this.curPos;
}

/**
 * set the pos marker
 * @return {null} set the current position point
 */
OTag.prototype.setPos = function(value) {
    this.curPos = value;
}

/**
 * clear all tags from markers
 * @return {null}
 */
OTag.prototype.delAllMarkers = function() {
    for (var i = 0; i < this.markers.length; i++) {
        this.dbFeatureLayer.getSource().removeFeature(this.markers[i]);
    }
    this.markers = [];
}

/**
 * set feature icon link
 * @param {string} link url to the icon
 */
OTag.prototype.setIcon = function(link) {
    this.iconLink = link;
}

/**
 * tag all latlng from data
 * @param  {json} data json data with lat, lng, and name
 * @return {null}
 */
OTag.prototype.tagMarkers = function(data) {
    var tagger = this;

    data.forEach(function(item) {
        var pos = ol.proj.fromLonLat([parseFloat(item.lon), parseFloat(item.lat)]);
        var pos_g = new google.maps.LatLng(item.lat, item.lon);
        if (tagger.drivingLimit) {
            tagger.considerDrivingDistance(item.name, pos_g, tagger.drivingDistance);
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
OTag.prototype.tagMarker = function (name, pos) {
    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(({
              anchor: [0.5, 1],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              src: this.iconLink
        }))
    });
    var markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(pos),
        name: name

    });
    markerFeature.setStyle(iconStyle);
    this.markers.push(markerFeature);
    this.dbFeatureLayer.getSource().addFeature(this.markers[this.markers.length - 1]);
}

/**
 * [no api specific]
 * ajax function to query data and callback to tag markers
 * @param  {string} data query string
 * @return {null}
 */
OTag.prototype.ajaxQuery = function(data) {
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
OTag.prototype.enableDrawingRegion = function() {
    var tagger = this;
    var geometryFunction = ol.interaction.Draw.createBox();
    tagger.drawingManager = new ol.interaction.Draw({
        source: this.source,
        type: 'Circle',
        geometryFunction: geometryFunction
    });
    tagger.drawingManager.on('drawend', function(e) {
        // var format = new ol.format.GeoJSON();
        tagger.rectangle = e.feature;
        var modify = new ol.interaction.Modify({
            features: new ol.Collection([tagger.rectangle]),
            style: null
        });
        tagger.map.addInteraction(modify);
        var drag = ol.interaction.defaults().extend([new OTag.Drag(tagger.rectangle)]);
        drag.forEach (function (interact) {
            tagger.map.addInteraction(interact);
        });
        tagger.map.removeInteraction(tagger.drawingManager);
        tagger.drawingManager = null;
    });
    tagger.map.addInteraction(tagger.drawingManager);
}

/**
 * disable the drawing tool and remove the drawed rectangle
 * @return {null}
 */
OTag.prototype.disableDrawingRegion = function() {
    if (this.drawingManager) {
        this.map.removeInteraction(this.drawingManager);
        this.drawingManager = null;
    }
    if (this.rectangle) {
        this.dbFeatureLayer.getSource().removeFeature(this.rectangle);
        this.rectangle = null;
    }
}

/**
 * set driving limit option
 * @param {string} distance in km
 */
OTag.prototype.setDrivingLimit = function(value) {
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
OTag.prototype.considerDrivingDistance = function(name, pos, limit) {
    var tagger = this;
    var coord = tagger.curPos.getGeometry().getCoordinates();
    coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
    var lat = coord[1];
    var lon = coord[0];
    var request = {
        origin: new google.maps.LatLng(lat, lon),
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
            var pos_o = ol.proj.fromLonLat([pos.lng(), pos.lat()]);
            tagger.tagMarker(name, pos_o);
        }
    });
}


OTag.Drag = function(rectangle) {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: OTag.Drag.prototype.handleDownEvent,
    handleDragEvent: OTag.Drag.prototype.handleDragEvent,
    handleMoveEvent: OTag.Drag.prototype.handleMoveEvent,
    handleUpEvent: OTag.Drag.prototype.handleUpEvent
  });

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.coordinate_ = null;

  /**
   * @type {string|undefined}
   * @private
   */
  this.cursor_ = 'pointer';

  /**
   * @type {ol.Feature}
   * @private
   */
  this.feature_ = null;

  this.rectangle = rectangle;

  this.onEdge = null;

  this.onPoint = null;

  this.vertex = 0;

  /**
   * @type {string|undefined}
   * @private
   */
  this.previousCursor_ = undefined;

};
ol.inherits(OTag.Drag, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
OTag.Drag.prototype.handleDownEvent = function(evt) {
    var map = evt.map;

    var feature = map.forEachFeatureAtPixel(evt.pixel,
      function(feature, layer) {
        return feature;
    });

    if (feature) {
        this.coordinate_ = evt.coordinate;
        this.feature_ = feature;
        if (this.rectangle && feature !== this.rectangle) {
            this.feature_ = this.rectangle;
            this.vertex = feature.getGeometry().getCoordinates();
            var coorn = this.rectangle.getGeometry().getCoordinates();

            if (ol.coordinate.equals(coorn[0][1], this.vertex)) this.onPoint = 1; // bottom_right
            else if (ol.coordinate.equals(coorn[0][2], this.vertex)) this.onPoint = 2; // top_right
            else if (ol.coordinate.equals(coorn[0][3], this.vertex)) this.onPoint = 3; // top_left
            else if (ol.coordinate.equals(coorn[0][4], this.vertex)) this.onPoint = 4; // bottom_left
            else this.onPoint = null; // top_left
            if (!this.onPoint) {
                var e = this.rectangle.getGeometry().getExtent();
                if (this.vertex[0] == e[0]) this.onEdge = 'left';
                else if (this.vertex[1] == e[1]) this.onEdge = 'bottom';
                else if (this.vertex[0] == e[2]) this.onEdge = 'right';
                else if (this.vertex[1] == e[3]) this.onEdge = 'top';
                else this.onEdge = null;
            }
        }
    }

    return !!feature;
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 */
OTag.Drag.prototype.handleDragEvent = function(evt) {
    var map = evt.map;
    // var feature = map.forEachFeatureAtPixel(evt.pixel,
    //     function(feature, layer) {
    //         return feature;
    //     });

    // var deltaX = evt.coordinate[0] - this.coordinate_[0];
    // var deltaY = evt.coordinate[1] - this.coordinate_[1];

    // var geometry = (this.feature_.getGeometry());
    // geometry.translate(deltaX, deltaY);
    this.vertex = evt.coordinate;
    var geometry = this.feature_.getGeometry();

    var coorn_arr = geometry.getCoordinates();
    var coorn = coorn_arr[0];
    if (coorn.length == 0) {
        debugger;
    }
    if (this.onPoint) {
        if (this.onPoint == 1) {
            coorn[1][0] = coorn[2][0] = this.vertex[0];
            coorn[0][1] = coorn[1][1] = coorn[4][1] = this.vertex[1];
        } else if (this.onPoint == 2) {
            coorn[1][0] = coorn[2][0] = this.vertex[0];
            coorn[2][1] = coorn[3][1] = this.vertex[1];
        } else if (this.onPoint == 3) {
            coorn[0][0] = coorn[3][0] = coorn[4][0] = this.vertex[0];
            coorn[2][1] = coorn[3][1] = this.vertex[1];
        } else if (this.onPoint == 4) {
            coorn[0][0] = coorn[3][0] = coorn[4][0] = this.vertex[0];
            coorn[0][1] = coorn[1][1] = coorn[4][1] = this.vertex[1];
        }
        geometry.setCoordinates([coorn]);
    } else if (this.onEdge) {
        switch(this.onEdge) {
            case 'left':
                coorn[0][0] = coorn[3][0] = coorn[4][0] = this.vertex[0];
                break;
            case 'bottom':
                coorn[0][1] = coorn[1][1] = coorn[4][1] = this.vertex[1];
                break;
            case 'right':
                coorn[1][0] = coorn[2][0] = this.vertex[0];
                break;
            case 'top':
                coorn[2][1] = coorn[3][1] = this.vertex[1];
                break;
        }
        geometry.setCoordinates([coorn]);
    } else {
        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        geometry.translate(deltaX, deltaY);

    }
    this.coordinate_[0] = evt.coordinate[0];
    this.coordinate_[1] = evt.coordinate[1];
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
OTag.Drag.prototype.handleMoveEvent = function(evt) {
  if (this.cursor_) {
    var map = evt.map;
    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          return feature;
        });
    var element = evt.map.getTargetElement();
    if (feature) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `false` to stop the drag sequence.
 */
OTag.Drag.prototype.handleUpEvent = function(evt) {
    // var g = this.feature_.getGeometry();
    // var e = g.getExtent();
    // var c = [];
    // c.push([e[0], e[1]]);
    // c.push([e[2], e[1]]);
    // c.push([e[2], e[3]]);
    // c.push([e[0], e[3]]);
    // c.push([e[0], e[1]]);
    // g.setCoordinates([c]);
    this.onEdge = null;
    this.onPoint = null;
    this.vertex = null;
    this.coordinate_ = null;
    this.feature_ = null;
    return false;
};