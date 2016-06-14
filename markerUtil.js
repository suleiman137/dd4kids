/**
 * @returns the shape for the marker icons
 */
function getMarkerShape()
{
    return	{
        coord: [2, 2, 2, 29, 9, 29, 15, 35, 16, 35, 22, 29, 29, 29, 29, 2],
        type: "poly"
    };
}

/**
 * @param {String} fileName the file name of the marker image
 * @returns {google.maps.MarkerImage} the icon for a marker from the given file
 */
function getMapIconsIcon(fileName)
{
    return new google.maps.MarkerImage(
            "images/" + fileName,
            new google.maps.Size(32, 37),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(15, 34)); // anchor 
}

/**
 * @returns {google.maps.MarkerImage} the icon for the freetime marker
 */
function getFreetimeMarkerIcon()
{
    return getMapIconsIcon("party.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the playground marker
 */
function getPlaygroundMarkerIcon()
{
    return getMapIconsIcon("playground.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the restaurant marker
 */
function getRestaurantMarkerIcon()
{
    return getMapIconsIcon("restaurant.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the soccer marker
 */
function getSoccerMarkerIcon()
{
    return getMapIconsIcon("soccer.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the WinterSports marker
 */
function getWinterSportsMarkerIcon()
{
    return getMapIconsIcon("sledge.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the skateboard marker
 */
function getSkateboardMarkerIcon()
{
    return getMapIconsIcon("skateboard.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the swimming marker
 */
function getSwimmingMarkerIcon()
{
    return getMapIconsIcon("swimming.png");
}

/**
 * @returns {google.maps.MarkerImage} the icon for the normal marker
 */
function getNormalMarkerIcon()
{
    return new google.maps.MarkerImage(
            "images/playground.png",
            new google.maps.Size(32, 37),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(15, 34)); // anchor
}

/**
 * @returns the shape for the marker icons
 */
function getMarkerShapeOld()
{
    return	{
        coord: [4, 0, 0, 4, 0, 7, 3, 11, 4, 19, 7, 19, 8, 11, 11, 7, 11, 4, 7, 0],
        type: "poly"
    };
}

/**
 * @returns {google.maps.MarkerImage} the icon for the normal marker
 */
function getNormalMarkerIconOld()
{
    return new google.maps.MarkerImage(
            "images/markerRed.png",
            new google.maps.Size(12, 20),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(6, 20)); // anchor
}

/**
 * @returns {google.maps.MarkerImage} the icon for the temp marker
 */
function getTempMarkerIcon()
{
    return new google.maps.MarkerImage(
            "images/markerBlue.png",
            new google.maps.Size(12, 20),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(6, 20)); // anchor
}

/**
 * @returns {google.maps.MarkerImage} the icon for the favorite marker
 */
function getFavoriteMarkerIcon()
{
    return new google.maps.MarkerImage(
            "images/markerGreen.png",
            new google.maps.Size(12, 20),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(6, 20)); // anchor
}

/** 
 * @returns {google.maps.MarkerImage} the icon for the shadow for all the marker types 
 */
function getShadowMarkerIcon()
{
    return new google.maps.MarkerImage(
            "images/markerShadow.png",
            new google.maps.Size(18, 14),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(2, 14)); // anchor
}

/** 
 * @returns {google.maps.MarkerImage} the icon for the current position
 */
function getCurrentPositionIcon()
{
    return new google.maps.MarkerImage(
            "images/position.png",
            new google.maps.Size(32, 37),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(15, 34)); // anchor
}


/** 
 * @returns {google.maps.MarkerImage} the icon for the shadow of the current position
 */
function getCurrentPositionShadowIcon()
{
    return new google.maps.MarkerImage(
            "images/positionShadow.png",
            new google.maps.Size(51, 37),
            new google.maps.Point(0, 0), // origin
            new google.maps.Point(23, 35)); // anchor
}

/**
 * @returns the shape for the current position icon
 */
function getCurrentPositionShape()
{
    return	{
        coord: [2, 2, 2, 29, 9, 29, 15, 35, 16, 35, 22, 29, 29, 29, 29, 2],
        type: "poly"
    };
}
