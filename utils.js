/**
 * Returns all cookies.
 */
getCookies = function() 
{
  var cookies ={};
  if (document.cookie) {
    var cList = document.cookie.split(";");
    for (var i=0; i<cList.length; i++) {
      var name = cList[i].split("=")[0].replace(/^\s+|\s+$/g, '');
      cookies[name] = unescape(cList[i].split("=")[1]);
    }
  }
  return cookies;
};

/**
 * Returns a cookie.
 * 
 * @param the name of the cookie
 * @returns the value of the cookie or null, if it could not be found
 */
getCookie = function(name) 
{
  if (document.cookie) 
  {
    var cList = document.cookie.split(";");
    for (var i=0; i<cList.length; i++) 
    {
      var n = cList[i].split("=")[0].replace(/^\s+|\s+$/g, '');
      if (name == n)
    	  return unescape(cList[i].split("=")[1]);
    }
  }
  return null;
};

/**
 * Sets a cookie for the current page.
 * 
 * @param name the name of the cookie
 * @param value the value of the cookie
 */
setCookie = function(name, value)
{
  //console.debug("name:"+name+" = "+value);
  document.cookie = name + "=" + escape(value);
  
  // calculate expire time today + 3 years
  var date = new Date();
  date.setMonth(date.getMonth()+36);
  document.cookie += ("; expires=" + date.toUTCString()); 

};

function getParam(name) 
{
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	
	if (results == null)
		return "";
	else
		return results[1];
}

/**
 * Encodes a string into HTML valid code (produces entities for special characters like ä).
 * -> see http://www.strictly-software.com/htmlencode
 */
function encodeString(string)
{
	var s = string.replace("ä", "&auml;");
	s = s.replace("ö", "&ouml;");
	s = s.replace("ü", "&uuml;");
	
	return s;
};

/**
 * Computes the bounds of an HTML element.
 * 
 * @param obj an HTML element
 * @returns the bounds of the HTML element given
 */
function getBounds(obj)
{
    var bounds = new Object();
    bounds.height = obj.offsetHeight;
    bounds.width = obj.offsetWidth;
//    bounds.height = obj.clientHeight;
//    bounds.width = obj.clientWidth;
//    bounds.height = parseInt(obj.style.height, 10);
    
    var topValue = 0, leftValue = 0;
    while(obj)
    {
		leftValue += obj.offsetLeft;
		topValue += obj.offsetTop;
		obj = obj.offsetParent;
    }
    
    bounds.x = leftValue;
    bounds.y = topValue;
    return bounds;
}