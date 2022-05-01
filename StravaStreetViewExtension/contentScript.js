
var buttonOnSite = document.getElementsByClassName("clone-route")[0],
parent = buttonOnSite.parentElement,
next = buttonOnSite.nextSibling,
button = document.createElement("a"),
text = document.createTextNode("Street Viewer");

button.appendChild(text);
button.classList.add("btn");
button.classList.add("btn-sm");
button.classList.add("btn-default");
button.classList.add("margin-left-3");
button.id = "streetView";
if (next) parent.insertBefore(button, next);
else parent.appendChild(button);

var locations;
var accessToken = "";

document.getElementById('streetView').onclick = handleStreetViewClick;

 function handleStreetViewClick(){
    var gpxUrl = getGpxUrl();

    var bodyXml;
    fetch(gpxUrl)
    .then(data=>data.text())
    .then(body=>{
        locations = parseGpxXml(body)
        openModal();
    });

    
 }

 function getGpxUrl(){
     var buttons = document.getElementsByClassName("btn-default");
     for (let index = 0; index < buttons.length; index++) {
         const element = buttons[index];
         
         if(element.innerHTML == "Export GPX")
            return element.getAttribute("href");
     }
 }

 function parseGpxXml(gpxXml){
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(gpxXml, "text/xml");

    var elements = xmlDoc.getElementsByTagName("trkpt");

    var locations = [];

    for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        locations.push(latLong(element.getAttribute("lat"), element.getAttribute("lon")))
    }

    console.log(locations);
    return locations;
 }

 function latLong(lat, long){
     return {
         latitude: lat,
         longtitude: long
     }
 }

 function openModal(){
    var templateUrl = chrome.runtime.getURL('/streetViewModal.html');
    
    console.log(templateUrl);

    // fetch(templateUrl)
    // .then(data=>data.text)
    // .then(text=>console.log(text));

    fetch(templateUrl).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        var modal = document.getElementById("myModal");
        modal.style.display = "block";

        var span = document.getElementById("closeModal");

        span.onclick = closeModal;

        function closeModal(){
            modal.style.display = "none";
        }

        loadStreetViewImages();
        // not using innerHTML as it would break js event listeners of the page
      }); 
 }
var intervalTimerId;
 function loadStreetViewImages(){
    console.log("loading images");
    var img = document.getElementById("streetViewImage");
    img.addEventListener('load', updateImage);
    updateImage();  
     //intervalTimerId = setInterval(updateImage, 500)
 }

 var nextImageId=0;

function updateImage(){
    console.log("next image" + nextImageId);

    var totalImages = locations.length
    if(nextImageId>totalImages){
        clearInterval(intervalTimerId);
        return;
    }

    getNextImage(nextImageId)
    
       
    function getNextImage(index){
        const element = locations[index];
        var bBox = getBbox(element);
        fetch('https://graph.mapillary.com/images?' + new URLSearchParams({
            access_token: accessToken,
            fields: "id",
            bbox: bBox
        }))
        .then(data=>data.json())
        .then(data=>{
            if(data.data.length>0)
            {
                var imageId = chooseImage(data.data)
                getImageUrl(data.data[0].id);
                nextImageId = nextImageId+10
            }else{
                nextImageId = nextImageId+5;
                updateImage();
            }
        });
    }

    var currentImageId = "";

    function chooseImage(data){
        if(data.length > 0){
            for (let index = 0; index < data.length; index++) {
                const element = data[index].id;
                    if(element != currentImageId){
                        currentImageId = element;
                        return element;
                    }else{
                        console.log("dupe image");
                    }
            }
        }
    }

    function getImageUrl(imageId){
        fetch("https://graph.mapillary.com/"+imageId+"?"+ new URLSearchParams({
            access_token: accessToken,
            fields: "thumb_original_url"
        }))
        .then(data=>data.json())
        .then(body=>{
            console.log(body)
            if(typeof(body.thumb_original_url) != undefined){
                setImage(body.thumb_original_url)
            }else{
                updateImage();
            }
        });
    }

    function setImage(imageUrl){
        document.getElementById("streetViewImage").src=imageUrl;
    }
}



function getBbox(latLong){
    var lat = parseFloat(parseFloat(latLong.latitude).toFixed(4));
    var long = parseFloat(parseFloat(latLong.longtitude).toFixed(4));

    var a = (long-0.0002).toFixed(4);
    var b = (lat-0.0002).toFixed(4);
    var c = (long+0.0002).toFixed(4);
    var d = (lat+0.0002).toFixed(4);

    var bBox = [a,b,c,d].join(",");
    console.log("Bbox: " + bBox)
    return bBox;
}


