/**
 * Define the GroupedMap class which extends the class google.maps.Map.
 * It does NOT inherit from google.maps.Map, but instead keeps an instance of it named 'map'.
 */ 
function GroupedMap(mapDiv, mapOptions)
{
	// the instance of the real map
	this.map = new google.maps.Map(mapDiv, mapOptions);
	
	// the currently visible layers div
	this.visibleLayersDiv = null;
	
	/** the div containing the copyright label for the current map type */
    this.copyrightDiv = document.createElement("div");
    // TODO: eigentlich BOTTOM_RIGHT, aber das Verhalten ist da sehr merkwürdig...
	this.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(this.copyrightDiv);
}

/**
 * Adds a Group to the map.
 * 
 * @param groupName the name of the group (used for displaying it)
 * @param groupToolTip the the tooltip of the group
 * @returns the newly created group
 */
GroupedMap.prototype.addGroup = function(groupName, groupToolTip)
{
	// create a div to hold the control
	var controlDiv = document.createElement('div');
	controlDiv.className = "groupControlDiv";
	controlDiv.title = groupToolTip;

	
	var controlDivLabel = document.createElement('div');
	controlDivLabel.className = "groupControlDivLabel";
	controlDivLabel.innerHTML = groupName;

	controlDiv.appendChild(controlDivLabel);

	this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

	
	// construct the div containing the radio buttons for the layers
	var layersDiv = document.createElement('div');
	layersDiv.className = "groupLayersDiv";
	document.body.appendChild(layersDiv);

	var group = new Group(this, layersDiv, controlDivLabel);

	// the layers div should be made visible and insible 
	controlDivLabel.onmouseover = function() { group.makeLayersDivVisible(); };
	controlDivLabel.onmouseout = function() { group.makeLayerDivInvisible(); };
	layersDiv.onmouseover = function() { group.makeLayersDivVisible(); };
	layersDiv.onmouseout = function() { group.makeLayerDivInvisible(); };

	return group;
};

/**
 * Define the Group class. 
 */
function Group(groupedMap, layersDiv, controlDiv)
{
	// if a timer has been started
	this.timerStarted = false;
	// the id of the currently started timer
	this.alertTimerId = 0;
	
	/** the grouped map this group belongs to */
	this.groupedMap = groupedMap;
	
	// the div containing the layer's radio buttons for this group
	this.layersDiv = layersDiv;
	
	// the div containing the group's name
	this.controlDiv = controlDiv;
}

/**
 * Adds a map type to a group.
 * 
 * @param mapType the map type as an object consisting of the following members:
 * name: the name of the map type (used for displaying the choice for the maptype)
 * id: the id of the map type (used for setting the map type)
 * mapType: the map type; if it is not null, it will be added to the map
 * overlays: an array of map types used as overlays over this map type; can be null
 * copyright: the inner html for the copyright label for this map type; can be null
 */
Group.prototype.addMapType = function(mapType)
{
	if (mapType.mapType != null)
		this.groupedMap.map.mapTypes.set(mapType.id, mapType.mapType);

	var mapTypeRB = document.createElement('input');
	mapTypeRB.type = "radio";
	// the id is used for referencing by the label
	mapTypeRB.id = mapType.id;
	// all radio buttons with the same name belong to the same group
	mapTypeRB.name = "mapType";
	if (this.groupedMap.map.getMapTypeId() == mapType.id)
		mapTypeRB.checked = "checked";
	
	// when the radio button is selected, change the current's mapType
	var map = this.groupedMap.map;
	var copyrightDiv = this.groupedMap.copyrightDiv;
	mapTypeRB.onchange = function() 
	{ 
		map.setMapTypeId(mapType.id);
		
		var mapOverlays = map.overlayMapTypes;
		// remove any overlays
		while (mapOverlays.getLength() > 0)
			mapOverlays.pop();
		
		// if the map type needs overlays, activate them
		if (mapType.overlays != null)
			for (var i = 0; i < mapType.overlays.length; i++)
				mapOverlays.push(mapType.overlays[i]);
		
		// set the copyright label
		if (mapType.copyright)
			copyrightDiv.innerHTML = mapType.copyright;
		else
			copyrightDiv.innerHTML = "";
	};

	// a label for the radio button
	var mapTypeLabel = document.createElement('label');
	// specifies for which radio button is label is meant
	mapTypeLabel.htmlFor = mapType.id;
	mapTypeLabel.appendChild(document.createTextNode(mapType.name));

	this.layersDiv.appendChild(mapTypeRB);
	this.layersDiv.appendChild(mapTypeLabel);
	this.layersDiv.appendChild(document.createElement('br'));
};

/**
 * Makes the layers div visible.
 */
Group.prototype.makeLayersDivVisible = function()
{
	if (this.timerStarted)
	{
		this.timerStarted = false;
		clearTimeout(this.alertTimerId);
	}

	// if the layer's div of another group is still visible (because of the timeout),
	// hide it
	if (this.groupedMap.visibleLayersDiv != null)
	{
		this.groupedMap.visibleLayersDiv.style.visibility = "hidden";
		this.groupedMap.visibleLayersDiv = null;
	}

	var controlBounds = getBounds(this.controlDiv);	
	var layersBounds = getBounds(this.layersDiv);	
	var mapBounds = getBounds(this.groupedMap.map.getDiv());

	// if the div would be too wide on the right side, move it a bit to the left
	var spaceAvailable = mapBounds.width - (controlBounds.x + layersBounds.width); 
	if (spaceAvailable < 0)
		this.layersDiv.style.left = controlBounds.x + spaceAvailable;
	else
		this.layersDiv.style.left = controlBounds.x;
	this.layersDiv.style.top = controlBounds.y + controlBounds.height;
	this.layersDiv.style.visibility = "visible";
	
	this.groupedMap.visibleLayersDiv = this.layersDiv;
};

/**
 * Schedules the layer div for being made invisible.
 */
Group.prototype.makeLayerDivInvisible = function()
{		
	// use a closure
	var self = this;
	// wait one second before making invisible
	this.alertTimerId = setTimeout(function() { self.makeLayerDivInvisibleNow(); }, 1000);	

	this.timerStarted = true;
};

/**
 * Makes the layer div invisible now.
 */
Group.prototype.makeLayerDivInvisibleNow = function()
{
	this.layersDiv.style.visibility = "hidden";
	
	// check if no other group's layer div has been made visible since starting the timeout	
	if (this.groupedMap.visibleLayersDiv == this.layersDiv)
		this.groupedMap.visibleLayersDiv = null;
};