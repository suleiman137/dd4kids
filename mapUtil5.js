/**
 * Calculates the zoom for a given LatLngBounds.
 * @param {LatLngBounds} bounds the LatLngBounds
 * @returns {Number} the zoom level
 * 
 * @see http://stackoverflow.com/questions/6048975/google-maps-v3-how-to-calculate-the-zoom-level-for-a-given-bounds
 */
function calculateZoom(bounds, mapHeight, mapWidth)
{
    /// method 1 ///
//    var GLOBE_WIDTH = 256; // a constant in Google's map projection
//    var west = bounds.getSouthWest().lng();
//    var east = bounds.getNorthEast().lng();
//    var angle = east - west;
//    if (angle < 0) {
//        angle += 360;
//    }
//    var zoom = Math.round(Math.log(pixelWidth * 360 / angle / GLOBE_WIDTH) / Math.LN2);
//    
//    return zoom; 

    /// method 2 ///
    var WORLD_DIM = {height: 256, width: 256};
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

/**
 * @returns the map type for the normal OSM map rendered with the Osmarender renderer
 */
function buildOSMMapType()
{
    var openStreet = new google.maps.ImageMapType(
            {
                getTileUrl: function(point, zoom) {
                    return "http://tile.openstreetmap.org/" + zoom + "/" + point.x + "/" + point.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 18,
                name: "OSM",
                alt: "Open Streetmap tiles - Mapnik"
            });

    return openStreet;
}

/**
 * See https://wiki.openstreetmap.org/wiki/MapQuest.
 * @returns the map type for the normal OSM map rendered by MapQuest
 */
function buildOSMMapQuestMapType()
{
    var openStreet = new google.maps.ImageMapType(
            {
                getTileUrl: function(point, zoom) {
                    return "http://otile1.mqcdn.com/tiles/1.0.0/osm/" + zoom + "/" + point.x + "/" + point.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 18,
                name: "OSM",
                alt: "Open Streetmap tiles - MapQuest"
            });

    return openStreet;
}

/**
 * Please note, that the Dresden Map is NOT under a free/open license, usage only with written permission of the owner!
 * http://www.dresden.de/stadtplan
 * 
 * @returns the map type for the normal map taken from dresden.de
 */
function buildDresdenMapMapType()
{
    var dresdenMap = new google.maps.ImageMapType(
            {//TODO: try EPSG 4326!
                getTileUrl: function(point, zoom) {
                    return "http://tile1stadtplan.dresden.de/public/ogcsl.ashx?Service=CTMS&PkgId=5&noTransparent=false&epsgCode=3785&timeStamp=21&format=image/png32&tileX="
                            + point.x + "&tileY=" + point.y + "&zoomLevel=" + zoom;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 17,
                name: "Dresden Karte",
                alt: "Map from dresden.de"
            });

    return dresdenMap;
}


/**
 * Please note, that the Dresden Map is NOT under a free/open license, usage only with written permission of the owner!
 * http://www.dresden.de/stadtplan
 * 
 * @returns the map type for the orthophoto map taken from dresden.de
 */
function buildDresdenMapAerialType()
{
    var dresdenMap = new google.maps.ImageMapType(
            {//TODO: try EPSG 4326!
                getTileUrl: function(point, zoom) {
                    return "http://tile1stadtplan.dresden.de/public/ogcsl.ashx?Service=CTMS&PkgId=4&noTransparent=false&epsgCode=3785&timeStamp=21&format=image/png32&tileX="
                            + point.x + "&tileY=" + point.y + "&zoomLevel=" + zoom;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 18,
                name: "Dresden Luftbild",
                alt: "Map from dresden.de"
            });

    return dresdenMap;
}

/**
 * Please note, that the Sachsen Map is NOT under a free/open license, usage only with written permission of the owner!
 * http://www.landesvermessung.sachsen.de/inhalt/geo/geoMIS/geoMIS.html
 * 
 * @param {google.maps.Map} map the map itself
 * @returns the map type for the orthophoto map taken from dresden.de
 */
function buildSachsenMapAerialType(map)
{
    var sachsenMap = new google.maps.ImageMapType(
            {
                // EPSG:4326 is WGS 84
                // tile is in tile coordinates
                getTileUrl: function(tile, zoom) {
                    // transform from tile coordinates to pixel coordinates
                    var upperLeftPoint = new google.maps.Point(tile.x * 256, (tile.y + 1) * 256);
                    var lowerRightPoint = new google.maps.Point((tile.x + 1) * 256, tile.y * 256);

                    // transform from pixel coordinates to world coordinates
                    var zPow = Math.pow(2, zoom);
                    var upperLeftWorld = new google.maps.Point(upperLeftPoint.x / zPow, upperLeftPoint.y / zPow);
                    var lowerRightWorld = new google.maps.Point(lowerRightPoint.x / zPow, lowerRightPoint.y / zPow);

                    // transform from world coordinates to WGS-84
                    var upperLeft = this.map.getProjection().fromPointToLatLng(upperLeftWorld);
                    var lowerRight = this.map.getProjection().fromPointToLatLng(lowerRightWorld);

                    var bBox = upperLeft.lng() + "," + upperLeft.lat() + "," + lowerRight.lng() + "," + lowerRight.lat();

                    return "https://geodienste.sachsen.de/wms_geosn_dop-rgb/guest?"
                            + "LAYERS=sn_dop_020" + "&TRANSPARENT=true" + "&SERVICE=WMS" + "&STYLES=" + "&VERSION=1.1.1" + "&REQUEST=GetMap" + "&FORMAT=image/png"
                            + "&SRS=EPSG:4326" + "&WIDTH=256&HEIGHT=256" + "&BBOX=" + bBox;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 19,
                name: "Sachsen Luftbild",
                alt: "Map from GeoSN",
                map: map
            });

    return sachsenMap;
}


/**
 * Please note, that the Sachsen Map is NOT under a free/open license, usage only with written permission of the owner!
 * http://www.geomis.sachsen.de
 * 
 * Doku: www.landesvermessung.sachsen.de/ias/basiskarte4/service/SRV4ADV_P_DTK/WMSFREE_TK/WMSFREE_TK/wmsservice?&REQUEST=GetCapabilities&SERVICE=WMS
 *
 * @param {google.maps.Map} map the map itself
 * @returns the map type for the orthophoto map taken from dresden.de
 */
function buildSachsenTopoMap(map)
{
    var sachsenMap = new google.maps.ImageMapType(
            {
                // EPSG:4326 is WGS 84
                // tile is in tile coordinates
                getTileUrl: function(tile, zoom) {
                    // transform from tile coordinates to pixel coordinates
                    var upperLeftPoint = new google.maps.Point(tile.x * 256, (tile.y + 1) * 256);
                    var lowerRightPoint = new google.maps.Point((tile.x + 1) * 256, tile.y * 256);

                    // transform from pixel coordinates to world coordinates
                    var zPow = Math.pow(2, zoom);
                    var upperLeftWorld = new google.maps.Point(upperLeftPoint.x / zPow, upperLeftPoint.y / zPow);
                    var lowerRightWorld = new google.maps.Point(lowerRightPoint.x / zPow, lowerRightPoint.y / zPow);

                    // transform from world coordinates to WGS-84
                    var upperLeft = this.map.getProjection().fromPointToLatLng(upperLeftWorld);
                    var lowerRight = this.map.getProjection().fromPointToLatLng(lowerRightWorld);

                    var bBox = upperLeft.lng() + "," + upperLeft.lat() + "," + lowerRight.lng() + "," + lowerRight.lat();

                    return "https://geodienste.sachsen.de/wms_geosn_dtk-pg-color/guest?"
                            + "LAYERS=sn_dtk_pg_color&TRANSPARENT=TRUE" + "&STYLES=" + "&SERVICE=WMS" + "&VERSION=1.1.1" + "&REQUEST=GetMap" + "&FORMAT=image/png"
                            + "&SRS=EPSG:4326" + "&WIDTH=256&HEIGHT=256" + "&BBOX=" + bBox;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 13,
                minZoom: 12,
                name: "Sachsen Digitale Topographische Karten - DTK Produkt",
                alt: "Map from GeoSN",
                map: map
            });

    return sachsenMap;
}

function buildSachsenTopoMap2(map)
{
    var sachsenMap = new google.maps.ImageMapType(
            {
                // EPSG:4326 is WGS 84
                // tile is in tile coordinates
                getTileUrl: function(tile, zoom) {
                    // transform from tile coordinates to pixel coordinates
                    var upperLeftPoint = new google.maps.Point(tile.x * 256, (tile.y + 1) * 256);
                    var lowerRightPoint = new google.maps.Point((tile.x + 1) * 256, tile.y * 256);

                    // transform from pixel coordinates to world coordinates
                    var zPow = Math.pow(2, zoom);
                    var upperLeftWorld = new google.maps.Point(upperLeftPoint.x / zPow, upperLeftPoint.y / zPow);
                    var lowerRightWorld = new google.maps.Point(lowerRightPoint.x / zPow, lowerRightPoint.y / zPow);

                    // transform from world coordinates to WGS-84
                    var upperLeft = this.map.getProjection().fromPointToLatLng(upperLeftWorld);
                    var lowerRight = this.map.getProjection().fromPointToLatLng(lowerRightWorld);

                    var bBox = upperLeft.lng() + "," + upperLeft.lat() + "," + lowerRight.lng() + "," + lowerRight.lat();

                    return "https://geodienste.sachsen.de/wms_geosn_dtk-pg-color/guest?"
                            + "LAYERS=sn_dtk_pg_color&TRANSPARENT=TRUE" + "&STYLES=" + "&SERVICE=WMS" + "&VERSION=1.1.1" + "&REQUEST=GetMap" + "&FORMAT=image/png"
                            + "&SRS=EPSG:4326" + "&WIDTH=256&HEIGHT=256" + "&BBOX=" + bBox;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 18,
                minZoom: 17,
                name: "Sachsen Digitale Topographische Karten - DTK Produkt",
                alt: "Map from GeoSN",
                map: map
            });

    return sachsenMap;
}


//TODO: abgehackt an Kachelgrenzen -> überarbeiten, wenn auf openlayers???
/**
 * Please note, that the Sachsen Map is NOT under a free/open license, usage only with written permission of the owner!
 * http://www.geomis.sachsen.de
 * 
 * Doku: http://www.landesvermessung.sachsen.de/ias/basiskarte4/service/SRV4TOPSN/WMSFREE_TK/WMSFREE_TK/wmsservice?&REQUEST=GetCapabilities&SERVICE=WMS
 *
 * @param {google.maps.Map} map the map itself
 * @param {bool} schummerung if a relief map should be overlaid
 * @returns the map type for the orthophoto map taken from dresden.de
 * 
 * nach der Umstellung gibt es Schummerung nicht mehr!!!
 * 
 */
function buildSachsenMap(map, schummerung)
{
    var sachsenMap = new google.maps.ImageMapType(
            {
                // EPSG:4326 is WGS 84
                // tile is in tile coordinates
                getTileUrl: function(tile, zoom) {
                    // transform from tile coordinates to pixel coordinates
                    var upperLeftPoint = new google.maps.Point(tile.x * 256, (tile.y + 1) * 256);
                    var lowerRightPoint = new google.maps.Point((tile.x + 1) * 256, tile.y * 256);

                    // transform from pixel coordinates to world coordinates
                    var zPow = Math.pow(2, zoom);
                    var upperLeftWorld = new google.maps.Point(upperLeftPoint.x / zPow, upperLeftPoint.y / zPow);
                    var lowerRightWorld = new google.maps.Point(lowerRightPoint.x / zPow, lowerRightPoint.y / zPow);

                    // transform from world coordinates to WGS-84
                    var upperLeft = this.map.getProjection().fromPointToLatLng(upperLeftWorld);
                    var lowerRight = this.map.getProjection().fromPointToLatLng(lowerRightWorld);

                    var bBox = upperLeft.lng() + "," + upperLeft.lat() + "," + lowerRight.lng() + "," + lowerRight.lat();

                    if (this.schummerung)
                        return "https://geodienste.sachsen.de/wms_geosn_webatlas-sn/guest?"
                                + "LAYERS=Vegetation,Siedlung,Gewaesser,Verkehr,Beschriftung,Schummerung" + "&STYLES=" + "&TRANSPARENT=TRUE" + "&SERVICE=WMS" + "&VERSION=1.1.1" + "&REQUEST=GetMap" + "&FORMAT=image/png"
                                + "&SRS=EPSG:4326" + "&WIDTH=256&HEIGHT=256" + "&BBOX=" + bBox;
                    else
                        return "https://geodienste.sachsen.de/wms_geosn_webatlas-sn/guest?"
                                + "LAYERS=Vegetation,Siedlung,Gewaesser,Verkehr,Beschriftung" + "&STYLES=" + "&TRANSPARENT=TRUE" + "&SERVICE=WMS" + "&VERSION=1.1.1" + "&REQUEST=GetMap" + "&FORMAT=image/png"
                                + "&SRS=EPSG:4326" + "&WIDTH=256&HEIGHT=256" + "&BBOX=" + bBox;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 18,
                name: "Sachsen Digitale Topographische Karten",
                alt: "Map from GeoSN",
                map: map,
                schummerung: schummerung
            });

    return sachsenMap;
}


/**
 * Die Hike & Bike Karte von OSM entsteht, indem 3 Teilkarten ?bereinander gelegt werden. 
 * Dier Teilkarten sind: Grundkarte, Schattierungen und H?henlinien.
 *   
 * @returns {google.maps.ImageMapType} die Grundkarte der Hike & Bike Karte 
 */
function buildOSMHikebikeAMapType()
{
    var openStreet = new google.maps.ImageMapType(
            {
                getTileUrl: function(point, zoom) {
                    return "http://toolserver.org/tiles/hikebike/" + zoom + "/" + point.x + "/" + point.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 17,
                name: "OSM",
                alt: "Open Streetmap tiles"
            });

    return openStreet;
}

/**
 * Die Hike & Bike Karte von OSM entsteht, indem 3 Teilkarten ?bereinander gelegt werden. 
 * Dier Teilkarten sind: Grundkarte, Schattierungen und H?henlinien.
 *   
 * @returns {google.maps.ImageMapType} die Karte der Schattierungen (geben H?he an)
 * 									   der Hike & Bike Karte 
 */
function buildOSMHikebikeBMapType()
{
    var openStreet = new google.maps.ImageMapType(
            {
                getTileUrl: function(point, zoom) {
                    return "http://toolserver.org/~cmarqu/hill/" + zoom + "/" + point.x + "/" + point.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 17,
                name: "OSM",
                alt: "Open Streetmap tiles"
            });

    return openStreet;
}

/**
 * Die Hike & Bike Karte von OSM entsteht, indem 3 Teilkarten ?bereinander gelegt werden. 
 * Dier Teilkarten sind: Grundkarte, Schattierungen und H?henlinien.
 *   
 * @returns {google.maps.ImageMapType} die Karte der H?henlinien der Hike & Bike Karte 
 */
function buildOSMHikebikeCMapType()
{
    var openStreet = new google.maps.ImageMapType(
            {
                getTileUrl: function(point, zoom) {
                    return "http://toolserver.org/~cmarqu/opentiles.com/cmarqu/tiles_contours_8/" + zoom + "/" + point.x + "/" + point.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                maxZoom: 17,
                name: "OSM",
                alt: "Open Streetmap tiles"
//		  opacity: 0.8 TODO - IE has problems with this
            });

    return openStreet;
}
