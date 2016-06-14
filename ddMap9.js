/* Script 2008 by Christian Harms / www.mittagstisch-ka.de
 modified 2009 by Konrad Bauckmeier / www.dd4kids.de
 enhanced 2010 by onli / /www.onli-blogging.de 
 rewritten & enhanced for Google Maps Api v3 2010 / 2011 / 2013 by Patrick Brausewetter
 
 basic usage:
 normally the script is called by a html-page without any parameters
 in this case, the map loads all data from the JSON (csv) File
 
 advanced usage:
 www.domain.de/test.html?location=3&amp;glat=50&amp;glong=13&amp;title=Testtitel&amp;gzoom=11
 location opens up a single element
 if location is empty or has no coresponding data, glat and glon create a new element with title as infotext (optional)
 or
 www.domain.de/test.html?category=categoryname5
 chooses a spezial category by the name
 
 use it -as it is- with no warranty and no support!
 */


/**
 * Includes javascript files.
 */
function includeJS(filenames)
{
    // how many scripts have to be loaded
    var scriptsToLoad = filenames.length;

    for (var i = 0; i < filenames.length; i++)
    {
        var filename = filenames[i];

        var script = document.createElement('script');
        script.src = filename;
        script.type = 'text/javascript';
        if (script.addEventListener)
            script.addEventListener("load",
                    function()
                    {
                        scriptsToLoad--;
                        if (scriptsToLoad == 0)
                            initMap();
                    }, false);
        else
            script.attachEvent("onreadystatechange",
                    function()
                    {
                        scriptsToLoad--;
                        if (scriptsToLoad == 0)
                            initMap();
                    });

        document.body.appendChild(script);
    }
}

/**
 * Includes a css file.
 */
function includeCSS(filename)
{
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = filename;
    link.type = 'text/css';
    link.media = 'screen, print';
    document.getElementsByTagName('head').item(0).appendChild(link);
}

function initialize()
{
    // import the dependent files
//	includeJS(["utils.js", "GroupedMap.js", "mapUtil3.js"]);

//	includeCSS("controls.css");
    initMap();
}


function initMap()
{
    var map = new KidsMap(getKidsMapData());
    map.buildMap();
}


/**
 * Dies ist das zentrale Objekt, dass s�mtliche wichtige Objekte beinhaltet
 * (die Daten f�r die Markierungen, die Markierungen selbst, die Symolbe f�r diese etc.).
 *
 * @param data
 */
function KidsMap(data)
{
    /** data ist ein Array von 7-Tupeln:
     * (lon, lat, Name, ??? , Ident (Nummer des Artikels aus dem Blog), 
     *		Kategorie, Vorschau-Bild) */
    this.data = data;

    /** immer das gleiche Infowindow nehmen, damit nie mehrere gleichzeitig sichtbar sind */
    this.infoWindow = new google.maps.InfoWindow();
    /** der aktuelle Anker f�r das Info-Fenster */
    this.infoWindowAnchor = null;
    /** ob das aktuelle Info-Fenster auf der Karte ge�ffnet ist (bei false -> Street-View) */
    this.infoWindowMap = true;
    /** ob das Info-Fenster momentan sichtbar ist */
    this.infoWindowVisible = false;

    /** the shape for the marker icons */
    this.markerShape = getMarkerShape();
    /** the icon for the normal marker */
    this.normalMarkerIcon = getNormalMarkerIcon();
    /** the icon for the favorite marker */
    this.favoriteMarkerIcon = getFavoriteMarkerIcon();
    /** the icon for the shadow for all the marker types */
    this.shadowMarkerIcon = getShadowMarkerIcon();
    /** die Markierungen zu den Daten-Tupeln (in der gleichen Reihenfolge) */
    this.markers = new Array(this.data.length);
    /** die Favoriten-Eintr�ge als Map (Ident des Eintrags (das 5. Element des zugeh�rigen Daten-Tupels)
     * 		 -> ob dieser Eintrag ein Favorit ist (Typ boolean)) */
    this.favorites = new Object();
    /** die einzelnen Kategorien als Map (Name der Kategorie -> Array mit den zugeh�rigen Markierungen) */
    this.categories = new Object();
    /** die momentan selektierte Kategorie */
    this.category = null;

    /** der Markerclusterer */
    this.clusterer = null;

	/** Routing Service aktivieren und der Karte zuordnen */
	this.directionsService = new google.maps.DirectionsService;
	this.directionsDisplay = new google.maps.DirectionsRenderer;

    /** die eigentliche Karte (Instanz von google.maps.Map) */
    this.map = null;
}

/**
 * Diese Methode baut die Karte auf und initialisiert sie vollst�ndig.
 */
KidsMap.prototype.buildMap = function()
{
    /** Aufbau der Karte **/
    var zoom1 = parseInt(getParam("gzoom"));
    var zoom2 = +zoom1
    if (zoom1 === "" || zoom1 != zoom2) {
        zoom1 = 11;
    } //pr�ft ob �berhautp ein Zoomwert �bergeben wurde uns setzt ihn ggf. manuell

    var mapOptions = {
        zoom: zoom1,
        center: new google.maps.LatLng(51.064, 13.762),
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: true,
        scaleControl: true
    };

    var groupedMap = new GroupedMap(document.getElementById("mapCanvas"), mapOptions);
    this.map = groupedMap.map;


    /** Hinzufügen der Layer **/

    var osmCopyright = "&copy; 2010 Kartendaten <a href=\"http://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap</a> und Mitwirkende, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/deed.de\" target=\"_blank\">CC-BY-SA</a>";
    var mapquestCopyright = "Data, imagery and map information provided by MapQuest, <a href=\"http://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap</a> and contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/deed.de\" target=\"_blank\">CC-BY-SA</a>";
    var hikebikeCopyright = "&copy; 2010 <a href=\"http://hikebikemap.de/\" target=\"_blank\">Hikebikemap</a>, Kartendaten <a href=\"http://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap</a> und Mitwirkende, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/deed.de\" target=\"_blank\">CC-BY-SA</a>";

    var groupNormal = groupedMap.addGroup("Normal", "Normale Karte");
    groupNormal.addMapType({name: "Google", id: google.maps.MapTypeId.ROADMAP});
    groupNormal.addMapType({name: "OSM Mapnik", id: "OSM Mapnik", mapType: buildOSMMapType(), copyright: osmCopyright});
    groupNormal.addMapType({name: "OSM MQuest", id: "OSM MapQuest", mapType: buildOSMMapQuestMapType(), copyright: mapquestCopyright});

    //var groupHybrid = groupedMap.addGroup("Hybrid", "Hybride Karten");
    //groupHybrid.addMapType({name: "Google", id: google.maps.MapTypeId.HYBRID});

    var groupLuftbild = groupedMap.addGroup("Luftbilder", "Karten mit Orthofotos");
    groupLuftbild.addMapType({name: "Google", id: google.maps.MapTypeId.SATELLITE});
    groupLuftbild.addMapType({name: "Google Hybrid", id: google.maps.MapTypeId.HYBRID});
    
    var groupGelaende = groupedMap.addGroup("Gelände", "Karten mit Höhenmodell");
    groupGelaende.addMapType({name: "Google", id: google.maps.MapTypeId.TERRAIN});
    var overlays = [buildOSMHikebikeBMapType(), buildOSMHikebikeCMapType()];
    groupGelaende.addMapType({name: "OSM Hike & Bike", id: "OSM Hikebike", mapType: buildOSMHikebikeAMapType(), overlays: overlays, copyright: hikebikeCopyright});

    //Die Kartendaten der Landeshauptstadt Dresden und die Luftbilder von Sachsen sind nicht frei verwendbar
    //
    //als Test auf eine Eigenschaft des obersten Frames lesend zugreifen
    //ist man nicht in der gleichen Domaine, wird dies durch alle Browser verhindert
    //und man landet in Folge der ausgeloesten Exception im catch Zweig 
    try
    {
        if (top.location.href != "https://www.dd4kids.de")
        {
            // nix tun -> nur zum Test da
        }

        //ist nicht in Fremddomaine, also d�rfen Karten eingebunden werden
        var copyDresden = "<a href=\"http://www.dresden.de/stadtplan\" target=\"_blank\">&copy; Landeshauptstadt Dresden</a>";
        //var copyDresdenWhite = "<a style=\"color: white;\" href=\"http://www.dresden.de/stadtplan\" target=\"_blank\">&copy; Landeshauptstadt Dresden</a>";
        var copySachsen = "<a style=\"color: white;\" href=\"http://www.landesvermessung.sachsen.de/\" target=\"_blank\">Quelle: Staatsbetrieb Geobasisinformation und Vermessung Sachsen</a>";

        // unter die Dresden Karte OSM legen?
        groupNormal.addMapType({name: "Dresden.de", id: "Dresden normal", mapType: buildDresdenMapMapType(), copyright: copyDresden});
        groupNormal.addMapType({name: "GeoSN", id: "Sachsen.Topo.Normal", mapType: buildSachsenMap(this.map, false), copyright: copySachsen});
        groupNormal.addMapType({name: "GeoSN - TK", id: "Sachsen.Topo.Alternativ", mapType: buildSachsenTopoMap(this.map), copyright: copySachsen});
		groupNormal.addMapType({name: "GeoSN - TK2", id: "Sachsen.Topo.Alternativ2", mapType: buildSachsenTopoMap2(this.map), copyright: copySachsen});

        groupLuftbild.addMapType({name: "Dresden.de", id: "Dresden Luftbild", mapType: buildDresdenMapAerialType(), copyright: copyDresden});
        groupLuftbild.addMapType({name: "GeoSN", id: "Sachsen Luftbild", mapType: buildSachsenMapAerialType(this.map), copyright: copySachsen});

        //groupGelaende.addMapType({name: "GeoSN", id: "Sachsen.Topo.Gelaende", mapType: buildSachsenMap(this.map, true), copyright: copySachsen});
    }
    catch (e)
    {
        // keine Karten definieren, da Karte in Fremddomaine per IFrame eingebunden ist
    }


    /** die Markierungen aufbauen und einbinden **/

    // die aktuelle Position des Nutzers anzeigen
    this.addUserPositionButton();

    //TODO: aktuelle Ansicht in Cookie speichern???
    var category = getParam("category");

    // die Favoriten jetzt schon laden, damit beim Aufbau der Markierungen dies gleich beachtet wird
    this.loadFavorites();

    this.buildMarkers();
    this.buildMarkerFilterControl(category);

    // bei Änderungen das Info-Window evtl. neu aufbauen (wenn von Street View zu Karte gewechselt oder andersrum)
    var kidsMap = this;
    google.maps.event.addListener(this.map.getStreetView(), "visible_changed",
            function()
            {
                if (!kidsMap.infoWindowVisible)
                    return;

                var mapVisible = !kidsMap.map.getStreetView().getVisible();

                // �nderung aufgetreten
                if (mapVisible != kidsMap.infoWindowMap)
                {
                    kidsMap.infoWindowMap = mapVisible;
                    kidsMap.openInfoWindow(kidsMap.infoWindow.getContent(), kidsMap.infoWindowAnchor);
                }
            });
    google.maps.event.addListener(this.infoWindow, "closeclick",
            function()
            {
                kidsMap.infoWindowVisible = false;
            });


	/** Routing Service der Karte zuordnen */
	this.directionsDisplay.setMap(groupedMap.map);
	
    /** die übergebenen Parameter auswerten */
    this.applyParams(category);
};

/**
 * Ermittelt und zeigt die Nutzer-Position als Marker. 
 * 
 * See: https://developers.google.com/maps/articles/geolocation
 */
KidsMap.prototype.addUserPositionButton = function()
{
    var controlDiv = document.createElement('div');
    controlDiv.id = 'positionControlDiv';

    var controlUI = document.createElement('button');
    controlUI.id = 'positionControlContent';
    controlUI.title = 'Klicken, um die eigene Position zu zentrieren';
    //controlUI.innerHTML = '<img src="images/position.png" />Position finden';
    controlUI.innerHTML = '<img src="images/position.png" />';

    controlDiv.appendChild(controlUI);

    // Setup the click event listeners
    var kidsMap = this;
    google.maps.event.addDomListener(controlUI, 'click', function() {
        kidsMap.showUserPosition();
    });

    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlDiv);
};

/**
 * Ermittelt und zeigt die Nutzer-Position als Marker. 
 * 
 * See: https://developers.google.com/maps/articles/geolocation
 */
KidsMap.prototype.showUserPosition = function()
{
    var map = this.map;
	var that = this;
    var icon = getCurrentPositionIcon();
    var shadowIcon = getCurrentPositionShadowIcon();
    var shape = getCurrentPositionShape();

    // Try W3C Geolocation (Preferred)
    if (navigator.geolocation)
    {
        browserSupportFlag = true;
		var options = {
		  enableHighAccuracy: true,
		  timeout: 10000,
		  maximumAge: 0
		};
        navigator.geolocation.getCurrentPosition(
                function(position)
                {
                    if (position.coords.accuracy > 2500)
                        alert('Die ermittelte Position ist zu ungenau für eine Anzeige. Genauigkeit: ' + position.coords.accuracy + ' m');
                    else
                    {
                        initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        map.setCenter(initialLocation);
                        map.setZoom(16);

						if (that.marker != null)
							that.marker.setMap(null);
						if (that.marker != null)
							that.circle.setMap(null);
						
						that.marker = new google.maps.Marker({
                            position: initialLocation,
                            map: map,
                            title: 'Aktueller Standort',
                            icon: icon,
                            shadow: shadowIcon,
                            shape: shape
                        });
						
						that.circle = new google.maps.Circle({
							center: initialLocation,
							radius: position.coords.accuracy, 
							map: map,
							strokeColor: "#FF0000",
							strokeOpacity: 0.8,
							strokeWeight: 2,
							fillColor: "#FF0000",
							fillOpacity: 0, //0.1
							zIndex: 1,
							clickable: false
						  });
                    }
                },
                function()
                {
                    handleNoGeolocation(browserSupportFlag);
                },
				options);
    }
    // Browser doesn't support Geolocation
    else
    {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag == true)
            alert("Bestimmung der aktuellen Position fehlgeschlagen.");
        else
            alert("Ihr Browser untertützt keine Bestimmung der aktuellen Position!");
    }
};

/**
 * Findet die Position eines Daten-Tupels �ber den Ident eines Artikels.
 * 
 * @param location Artikel-Ident (Nummer des Artikels aus dem Blog)
 * @returns die Position des zugeh�rigen Daten-Tupel oder -1, wenn er nicht gefunden werden konnte
 */
KidsMap.prototype.findDataIndex = function(location)
{
    for (var i = 0; i < this.data.length; i++)
    {
        var data = this.data[i];
        if (data[4] == location)
            return i;
    }
    return -1;
};

/**
 * Erstellt die Markierungen.
 */
KidsMap.prototype.buildMarkers = function()
{
    for (var i = 0; i < this.data.length; i++)
        this.buildMarker(i);

    var styles = [{
            url: 'images/playgroundC1.png',
            width: 32,
            height: 37,
            textColor: '#0000ff',
            textSize: 10
        }, {
            url: 'images/playgroundC2.png',
            width: 32,
            height: 37,
            textColor: '#9030FF',
            textSize: 11
        }, {
            url: 'images/playgroundC3.png',
            width: 32,
            height: 37,
            textColor: '#00ff00',
            textSize: 12
        }];
	var mcOptions = {gridSize: 40, minimumClusterSize: 2, zoomOnClick: false, averageCenter: true, imagePath: 'images/m'};  
    var markers = [];
    for (var category in this.categories)
    {
        var cm = this.categories[category];
        for (var i = 0; i < cm.length; i++)
            markers.push(cm[i]);
    }
    this.clusterer = new MarkerClusterer(this.map, markers, mcOptions);

    var map = this.map;
    google.maps.event.addDomListener(this.clusterer, 'click', function(cluster) {
        var mapDiv = map.getDiv();
        var zoom = calculateZoom(cluster.getBounds(), mapDiv.offsetHeight, mapDiv.offsetWidth);

        var maxZoom = 17;
        if (zoom <= maxZoom)
            map.fitBounds(cluster.getBounds());
        else
        {
            map.setCenter(cluster.getCenter());
            if (map.getZoom() < maxZoom)
                map.setZoom(maxZoom);
            else
                map.setZoom(map.getZoom() + 1);
        }
    });
};

/**
 * Erstellt eine Markierung und tr�gt sie in den entsprechenden Membern (markers und category).
 * Diese Methode wurde eigentlich nur angelegt, damit dataIndex korrekt
 *  an den Listener �bergeben werden kann (als Z�hlschleifenvariable klappt es nicht, da sie
 *  als Closure gehandelt w�rde und damit immer den Wert der letzten Iteration h�tte).
 *  
 *  @param dataIndex der Index zu dem 7-Tupel der Markierung
 */
KidsMap.prototype.buildMarker = function(dataIndex)
{
    var data = this.data[dataIndex];

    var icon = this.normalMarkerIcon;

    switch (data[5])
    {
        case 'Abenteuerspielplatz':
        case 'Spielplatz':
            icon = getPlaygroundMarkerIcon();
            break;
        case 'Ausflugsziel':
        case 'Sport und Freizeit':
            icon = getFreetimeMarkerIcon();
            break;
        case 'Ballplatz':
            icon = getSoccerMarkerIcon();
            break;
        case 'Kinderrestaurant':
            icon = getRestaurantMarkerIcon();
            break;
        case 'Schwimmbad':
            icon = getSwimmingMarkerIcon();
            break;
        case 'Skateplatz':
            icon = getSkateboardMarkerIcon();
            break;
        case 'Wintersport':
            icon = getWinterSportsMarkerIcon();
            break;
    }

    if (this.favorites[data[4]])
        icon = this.favoriteMarkerIcon;

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(data[1], data[0]),
        map: this.map,
        title: data[2],
        icon: icon,
        shadow: this.shadowMarkerIcon,
        shape: this.markerShape
    });

    // this funktioniert in der anonymen Methode nicht...
    var kidsMap = this;

    // registriert den Listener, der das Info-Fenster �ffnet, wenn auf die Markierung geklickt wird
    google.maps.event.addListener(marker, 'click',
            function()
            {
                kidsMap.openEntryInfoWindow(dataIndex);
            });

    this.markers[dataIndex] = marker;
    var category = this.categories[data[5]];
    if (category == null)
    {
        category = new Array();
        this.categories[data[5]] = category;
    }
    category.push(marker);
};


/**
 * Speichert einen Eintrag als Favoriten.
 * 
 * @param dataIndex der Index des Eintrags
 */
KidsMap.prototype.markAsFavorite = function(dataIndex)
{
    var marker = this.markers[dataIndex];
    marker.setIcon(this.favoriteMarkerIcon);

    // als Favoriten speichern
    this.favorites[this.data[dataIndex][4]] = true;
    // favoriten im Cookie speichern
    this.saveFavorites();

    // schlie�t das aktuelle Info-Window (die Funktion wird im Normalfall aus eben diesem heraus aufgerufen)
    this.infoWindow.close();
};


/**
 * Setzt einen Favoriten-Eintrag wieder zur�ck zu einem normalen Eintrag.
 * 
 * @param dataIndex der Index des Eintrags
 */
KidsMap.prototype.demarkAsFavorite = function(dataIndex)
{
    var marker = this.markers[dataIndex];
    marker.setIcon(this.normalMarkerIcon);

    // kein Favorit mehr
    this.favorites[this.data[dataIndex][4]] = false;
    // favoriten im Cookie speichern
    this.saveFavorites();

    // schlie�t das aktuelle Info-Window (die Funktion wird im Normalfall aus eben diesem heraus aufgerufen)
    this.infoWindow.close();
};


/**
 * Speichert die Indizes der Favoriten-Eintr�ge als Cookie.
 */
KidsMap.prototype.saveFavorites = function()
{
    var values = [];

    for (var entryIndex in this.favorites)
        if (this.favorites[entryIndex])
            values.push(entryIndex);

    setCookie("favorites", values.join("|"));
};

/**
 * L�dt die Favoriten aus dem Cookie.
 */
KidsMap.prototype.loadFavorites = function()
{
    var favorites = getCookie("favorites");

    if (favorites != null)
    {
        var values = favorites.split("|");
        for (var i = 0; i < values.length; i++)
            this.favorites[values[i]] = true;
    }
};

/**
 * Erzeugt das Kontroll-Element zur Auswahl der Kategorien der Markierungen.
 * 
 * @param selectedCategory die Kategorie, die anfangs ausgew�hlt sein soll
 */
KidsMap.prototype.buildMarkerFilterControl = function(selectedCategory)
{
    var container = document.createElement("div");
    container.className = "filterControlContainer";

    container.appendChild(document.createTextNode("Nach Rubrik filtern"));
    container.appendChild(document.createElement("br"));

    var select = document.createElement("select");
    var kidsMap = this;
    var f = function()
    {
        var selectedIndex = this.selectedIndex;

        if (selectedIndex == 0)
            kidsMap.selectCategory(null);
        else
        {
            var category = this.options[selectedIndex].value;
            kidsMap.selectCategory(category);
        }
    };
    select.onchange = f;
    select.onkeyup = f;

    var allOption = document.createElement("option");
    allOption.appendChild(document.createTextNode("Alle Orte"));
    select.appendChild(allOption);

    var categories = new Array();
    for (var category in this.categories)
        categories.push(category);
    categories.sort();

    for (var i = 0; i < categories.length; i++)
    {
        var category = categories[i];
        var option = document.createElement("option");

        // die vorausgew�hlte Kategorie als solche kennzeichnen
        if (category == selectedCategory)
            option.selected = "selected";

        option.value = category;
        option.appendChild(document.createTextNode(
                category + " (" + this.categories[category].length + "x)"));

        select.appendChild(option);
    }

    container.appendChild(select);
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(container);
};

/**
 * W�hlt eine bestimmte Kategorie aus und macht damit die Markierungen der anderen Kategorien unsichtbar.
 * 
 * @param category die neue Kategorie; kann auch null sein - alle Markierungen sichtbar
 */
KidsMap.prototype.selectCategory = function(category)
{
    if (this.category == category)
        return;

    // pr�fen, ob diese Kategorie �berhaupt existiert
    if ((category != null) && (this.categories[category] == null))
        return;

    this.category = category;

    // zuerst alle Marker entfernen
    this.clusterer.clearMarkers();

    // dann die Marker neu aufbauen
    if (category == null)
        for (var i = 0; i < this.markers.length; i++)
            this.clusterer.addMarker(this.markers[i]);
    else
    {
        var markers = this.categories[category];

        for (var i = 0; i < markers.length; i++)
            this.clusterer.addMarker(markers[i]);
    }

    // schlie�t das aktuelle Info-Window
    //TODO: nur schlie�en, wenn die zugeh�rige Markierung unsichtbar gemacht wird??? 
    this.infoWindow.close();
};

/**
 * �ffnet f�r einen Eintrag ein Info-Fenster.
 * 
 * @param dataIndex der Index des zur Markierung geh�rigen 7-Tupels 
 */
KidsMap.prototype.openEntryInfoWindow = function(dataIndex)
{
    this.openInfoWindow(this.getInfoContent(dataIndex), this.markers[dataIndex]);
};

/**
 * �ffnet f�r eine Markierung ein Info-Fenster.
 * 
 * @param marker die Markierung 
 * @param title der Titel des Inhalts des Info-Fensters
 */
KidsMap.prototype.openSimpleInfoWindow = function(marker, title)
{
    this.openInfoWindow('<div class="infoWindowContent">' + title + '</div>', marker);
};

/**
 * �ffnet f�r eine Markierung ein Info-Fenster.
 *
 * @param content der Inhalt des Info-Fensters
 * @param marker die Markierung
 */
KidsMap.prototype.openInfoWindow = function(content, marker)
{
    this.infoWindow.setContent(content);
    this.infoWindowAnchor = marker;
    this.infoWindowMap = !this.map.getStreetView().getVisible();
    this.infoWindowVisible = true;

    // je nachdem, ob Street View sichtbar ist
    if (this.infoWindowMap)
        this.infoWindow.open(this.map, marker);
    else
        this.infoWindow.open(this.map.getStreetView(), marker);
};

/**
 * @param dataIndex der Index des zur Markierung gehoerigen 7-Tupels 
 * @returns {String} den Inhalt, den das Info-Fenster anzeigen soll
 */
KidsMap.prototype.getInfoContent = function(dataIndex)
{
    var data = this.data[dataIndex];

    var picUrl = data[6];
    // kein Bild angegeben -> 
    if ((picUrl == null) || (picUrl == ""))
        picUrl = "images/markerGreen.png"; // TODO: what picture to take here?
    else
        picUrl = "https://www.dd4kids.de/wp-content/uploads/" + picUrl;

    var div = document.createElement("div");
    div.className = "infoWindowContent";

    // Name und Bild als Verweis
    var innerDiv = document.createElement("div");
    innerDiv.innerHTML = '<a class="infoWindowHeading" href="https://www.dd4kids.de/?p=' + data[4] + '" target="_parent"><div class="karte">'
            + data[2] + '</div>'
            + '<img class="kartenbild" src="' + picUrl + '"/></a>'
            + data[3];
    div.appendChild(innerDiv);

    // Zeilen-Umbruch
    //var breakAll = document.createElement("br");
    //breakAll.clear = "all";
    //div.appendChild(breakAl);
	
	{ // Link zur integrierten Route
		var routingLink = document.createElement("a");
		routingLink.href = "#";
		routingLink.appendChild(document.createTextNode("interne Route vom aktuellen Standort"));
		var ds = this.directionsService;
		var dd = this.directionsDisplay;		
		
		routingLink.onclick = function()
		{
			// Try W3C Geolocation (Preferred)
			if (navigator.geolocation)
			{
				browserSupportFlag = true;
				navigator.geolocation.getCurrentPosition(
						function(position)
						{
							if (position.coords.accuracy > 50)
								alert('Die ermittelte Position ist zu ungenau für eine Anzeige.');
							else
							{
								ds.route
								(
									{
										origin: position.coords.latitude + ", " + position.coords.longitude,
										destination: data[1] + ", " + data[0],
										travelMode: google.maps.TravelMode.DRIVING
									},
									function(response, status)
									{
										if (status === google.maps.DirectionsStatus.OK)
											dd.setDirections(response);
										else
											window.alert('Directions request failed due to ' + status);
									}
								);
							}
						},
						function()
						{
							handleNoGeolocation(browserSupportFlag);
						});
			}
			// Browser doesn't support Geolocation
			else
			{
				browserSupportFlag = false;
				handleNoGeolocation(browserSupportFlag);
			}

			function handleNoGeolocation(errorFlag) {
				if (errorFlag == true)
					alert("Bestimmung der aktuellen Position fehlgeschlagen.");
				else
					alert("Ihr Browser untertützt keine Bestimmung der aktuellen Position!");
			}	
		};
		div.appendChild(routingLink);
		div.appendChild(document.createElement("br"));
	}
	
	{ // Link zur externen Route
		var routingLink = document.createElement("a");
		routingLink.href = "#";
		routingLink.appendChild(document.createTextNode("externe Route vom aktuellen Standort"));
		
		routingLink.onclick = function()
		{
			// Try W3C Geolocation (Preferred)
			if (navigator.geolocation)
			{
				browserSupportFlag = true;
				navigator.geolocation.getCurrentPosition(
						function(position)
						{
							if (position.coords.accuracy > 50)
								alert('Die ermittelte Position ist zu ungenau für eine Anzeige.');
							else
							{
								var origin = "Current Location";
								var dest = data[1] + ", " + data[0];
								var parameter = origin + "/" + dest;
								if( (navigator.platform.indexOf("iPhone") != -1) 
									|| (navigator.platform.indexOf("iPod") != -1)
									|| (navigator.platform.indexOf("iPad") != -1))
									 window.open("maps://maps.google.com/maps?" + parameter);
								else
									 window.open("https://www.google.com/maps/dir/" + parameter);							
							}
						},
						function()
						{
							handleNoGeolocation(browserSupportFlag);
						});
			}
			// Browser doesn't support Geolocation
			else
			{
				browserSupportFlag = false;
				handleNoGeolocation(browserSupportFlag);
			}

			function handleNoGeolocation(errorFlag) {
				if (errorFlag == true)
					alert("Bestimmung der aktuellen Position fehlgeschlagen.");
				else
					alert("Ihr Browser untertützt keine Bestimmung der aktuellen Position!");
			}	
		};
		div.appendChild(routingLink);
		div.appendChild(document.createElement("br"));
	}

    if (this.favorites[data[4]])
    { // Eintrag ist schon Favorit -> evtl. wieder rausnehmen
        div.appendChild(document.createTextNode("Favorit " + data[5] + " ("));

        var demarkierenLink = document.createElement("a");
        demarkierenLink.href = "#";
        var kidsMap = this;
        demarkierenLink.onclick = function()
        {
            kidsMap.demarkAsFavorite(dataIndex);
        };
        demarkierenLink.appendChild(document.createTextNode("entfernen"));

        div.appendChild(demarkierenLink);
        div.appendChild(document.createTextNode(")"));
    }
    else
    { // Eintrag ist kein Favorit -> anbieten, zum Favoriten zu machen 
        div.appendChild(document.createTextNode("als Favorit "));

        var markierenLink = document.createElement("a");
        markierenLink.href = "#";
        var kidsMap = this;
        markierenLink.onclick = function()
        {
            kidsMap.markAsFavorite(dataIndex);
        };
        markierenLink.appendChild(document.createTextNode("markieren"));

        div.appendChild(markierenLink);
    }

    return div;
};

/**
 * Wertet die uebergebenen Parameter aus.
 * 
 * @param category die Kategorie, die anfangs ausgewaehlt sein soll (dieser Parameter wurde bereits ausgelesen) 
 */
KidsMap.prototype.applyParams = function(category)
{
    if (category != "")
        this.selectCategory(category);

    // einen bestimmten Eintrag direkt �ffnen, wenn er denn existiert
    var location = getParam("location");
    if (location != "")
    {
        var index = this.findDataIndex(location);
        var data = this.data[index];

        // der Eintrag exisitiert bereits
        if (data != null)
        {
            this.openEntryInfoWindow(index);
            this.map.setCenter(this.markers[index].getPosition());
        }
        // der Eintrag existiert nicht -> Pseudo-Eintrag anzeigen
        else
        {
            var lat = getParam("glat");
            var long = getParam("glong");

            // eine Koordinate muss gegeben sein, sonst geht nix
            if ((lat != "") && (long != ""))
            {
                var pos = new google.maps.LatLng(lat, long);
                var titleParam = getParam("title");
                var title = null;

                if (titleParam != "")
                    title = decodeURIComponent(titleParam);

                var marker = new google.maps.Marker({
                    position: pos,
                    map: this.map,
                    title: title,
                    icon: getTempMarkerIcon(),
                    shadow: this.shadowMarkerIcon,
                    shape: this.markerShape
                });

                var kidsMap = this;

                // registriert den Listener, der das Info-Fenster �ffnet, wenn auf die Markierung geklickt wird
                if (title != null)
                    google.maps.event.addListener(marker, 'click',
                            function()
                            {
                                kidsMap.openSimpleInfoWindow(marker, title);
                            });

                // das Info-Fenster �ffnen
                kidsMap.openSimpleInfoWindow(marker, title);

                // die Temp-Markierung zentrieren  
                this.map.setCenter(pos);
            }
        }
    }
};
